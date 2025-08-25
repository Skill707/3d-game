import { useAtom } from "jotai";
import { useEffect, useRef, useState } from "react";
import { useThree } from "@react-three/fiber";
import { partsAtom, settingsAtom } from "../state/atoms";
import { CreatePart } from "../utils/partFactory";
import { createDragControls } from "../hooks/createDragControls";
import * as THREE from "three";
import { produce } from "immer";
import { Part } from "../utils/partFactory";

export default function CraftOld({ orbit }) {
	const [partsStorage, setPartsStorage] = useAtom(partsAtom);
	const [settingsStorage, setSettingsStorage] = useAtom(settingsAtom);
	const controlsRef = useRef(null);
	const lastAddedRef = useRef(null);
	const { scene, camera, gl } = useThree();
	const lastButton = useRef(null);

	useEffect(() => {
		console.clear();
	}, []);

	useEffect(() => {
		console.log("Craft Effect[partsStorage.parts, scene.children]");
		if (!controlsRef.current) {
			const partsGroupObjects = scene.children.filter((obj) => obj.name.includes("drag"));
			let intersectPart = null;
			let intersectPartGroupObject = null;
			let attachTo = null;

			const onDragStart = (e) => {
				orbit.current.enabled = false;
				let selectedPart = null;
				let parts = null;
				setPartsStorage((prev) => {
					selectedPart = prev.parts.find((p) => p.objectName === e.object.name) || null;
					parts = prev.parts;
					if (lastButton.current === 2) {
						const newID = Math.max(0, ...parts.map((p) => p.id)) + 1; // Генерируем уникальный ID
						const newPart = new Part({
							id: newID,
							name: selectedPart.name,
							pos: e.object.position.clone().toArray(),
							rot: e.object.rotation.clone().toArray(),
							shapeSegments: selectedPart.shapeSegments,
						});
						parts = [...parts, newPart];
					} else if (lastButton.current === 0) {
						parts = parts.map((p) => {
							if (p.id === selectedPart.attachedToPart) {
								return { ...p, attachedParts: p.attachedParts.filter((part) => part.id !== selectedPart.id) };
							}
							if (p.id === selectedPart.id) {
								return { ...p, selected: true, drag: true, attachedToPart: null };
							} else {
								return { ...p, selected: false, drag: false };
							}
						});
					}
					return { ...prev, parts, selectedPart: selectedPart };
				});
			};

			const onDrag = (e) => {
				const partsObjects = e.object.parent.children.filter((obj) => obj.name.includes("drag"));
				const parts = partsStorage.parts;
				let selectedPart = parts.find((p) => p.objectName === e.object.name) || null;
				if (!selectedPart || !parts) return;

				function moveAttached(id, attachedParts) {
					if (!attachedParts) return;
					attachedParts.forEach((part) => {
						const selObj = scene.getObjectByName("dragPart" + id);
						const obj = scene.getObjectByName("dragPart" + part.id);
						obj.position.copy(new THREE.Vector3(...selObj.position).add(new THREE.Vector3().fromArray(part.offset)));
						const found = parts.find((p) => p.id === part.id);
						moveAttached(found.id, found.attachedParts);
					});
				}

				moveAttached(selectedPart.id, selectedPart.attachedParts);

				// актуальные "другие" объекты каждый раз

				const others = partsObjects.filter((o) => o !== e.object);
				if (!others.length) return;

				// DragControls уже обновил свой raycaster; доп. setFromCamera не обязателен
				const hits = controlsRef.current.raycaster.intersectObjects(others, true);
				if (!hits.length) {
					intersectPart = null;
					intersectPartGroupObject = null;
					attachTo = null;
					return;
				}

				const hit = hits[0];
				const point = hit.point.clone();
				attachTo = hit.object.name;
				const localNormal = hit.normal;

				intersectPartGroupObject = hit.object.parent;
				if (!intersectPartGroupObject) return;

				intersectPart = parts.find((p) => p.objectName === intersectPartGroupObject.name) || null;
				if (!intersectPart) return;

				let finalPosition = point.clone();
				/*finalPosition.x = finalPosition.x.toPrecision(1);
					finalPosition.y = finalPosition.y.toPrecision(1);*/

				finalPosition.z = intersectPartGroupObject.position.z;
				let finalRotation = new THREE.Euler();
				const size = [2, 2, 2];
				if (attachTo === "side") {
					// Transform normal from local to world space using part's rotation
					const partRotation = new THREE.Euler(...intersectPart.rot);
					const rotationMatrix = new THREE.Matrix4().makeRotationFromEuler(partRotation);
					const normal = localNormal.applyMatrix4(rotationMatrix).normalize();

					// Convert normal to rotation using quaternion
					// Calculate the rotation from defaultUp to our normal
					const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
					// Convert quaternion to euler angles
					finalRotation.setFromQuaternion(quaternion);

					const offset = new THREE.Vector3(0, -size[1] / 2, 0).applyQuaternion(quaternion);
					finalPosition.sub(offset);
				} else if (attachTo === "front" || attachTo === "back") {
					const offset = attachTo === "front" ? size[2] / 2 : -size[2] / 2;
					finalPosition.set(intersectPartGroupObject.position.x, intersectPartGroupObject.position.y, point.z + offset);
					finalRotation.copy(new THREE.Euler(...intersectPart.rot));
				} else {
					finalPosition.copy(point);
					finalRotation.copy(new THREE.Euler());
				}

				e.object.position.copy(finalPosition);
				e.object.rotation.copy(finalRotation);

				moveAttached(selectedPart.id, selectedPart.attachedParts);
			};

			const onDragEnd = (e) => {
				orbit.current.enabled = true;

				setPartsStorage(
					produce((draft) => {
						const selectedPart = draft.parts.find((p) => p.objectName === e.object.name);
						if (!selectedPart) return;
						selectedPart.drag = false;
						// можно ещё сохранить финальную pos/rot сюда
						selectedPart.pos = [e.object.position.x, e.object.position.y, e.object.position.z];
						selectedPart.rot = [e.object.rotation.x, e.object.rotation.y, e.object.rotation.z];

						if (intersectPart) {
							selectedPart.attachedToPart = intersectPart.id;
							const foundPart = draft.parts.find((p) => p.id === intersectPart.id);
							//foundPart.shape.sections[0] = p.shape.sections[0];
							if (!foundPart.attachedParts.find((part) => part.id === selectedPart.id))
								foundPart.attachedParts.push({
									id: selectedPart.id,
									offset: new THREE.Vector3().subVectors(e.object.position, intersectPartGroupObject.position).toArray(),
									name: attachTo,
								});
						}

						function saveAttaced(id, attachedParts) {
							if (!attachedParts) return;
							attachedParts.forEach((part) => {
								const selObj = scene.getObjectByName("dragPart" + id);
								const selObjPos = selObj.position.clone().add(new THREE.Vector3().fromArray(part.offset));
								const par = draft.parts.find((p) => p.id === part.id);
								par.pos = [selObjPos.x, selObjPos.y, selObjPos.z];
								//par.rot = [selObj.rotation.x, selObj.rotation.y, selObj.rotation.z];

								saveAttaced(par.id, par.attachedParts);
							});
						}

						saveAttaced(selectedPart.id, selectedPart.attachedParts);
					})
				);

				intersectPart = null;
				controlsRef.current?.dispose();
				controlsRef.current = null;
			};
			const events = [onDragStart, onDrag, onDragEnd];

			controlsRef.current = createDragControls(partsGroupObjects, [camera, gl.domElement], events);
		} else {
			if (lastAddedRef.current) {
				const lastAddedObject = scene.getObjectByName(lastAddedRef.current.objectName) || null;
				if (!lastAddedObject) return;

				controlsRef.current.selected = lastAddedObject;
				controlsRef.current.state = 0;
				lastAddedRef.current = null;
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [partsStorage.parts, scene.children, lastAddedRef.current]);

	useEffect(() => {
		console.log("Craft Effect[settingsStorage.addParts]");

		if (settingsStorage.addParts.selectedPartType !== null && settingsStorage.addParts.pointerOut === true) {
			console.log("init add part");

			const newID = Math.max(0, ...partsStorage.parts.map((p) => p.id)) + 1; // Генерируем уникальный ID
			const newPart = new Part({
				id: newID,
				name: settingsStorage.addParts.selectedPartType,
			});

			setPartsStorage((prev) => {
				const parts = [...prev.parts, newPart];

				return { ...prev, parts, selectedPart: newPart };
			});
			lastAddedRef.current = newPart;
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [settingsStorage.addParts]);

	return (
		<>
			{console.log("Craft comp createParts")}
			{partsStorage.parts.map((part) => (
				<CreatePart key={part.id} part={part} selected={part.id === partsStorage.selectedPart?.id} />
			))}
		</>
	);
}

/*
			setSettingsStorage(
				produce((draft) => {
					draft.addParts.selectedPartType = null;
				})
			);
		
			
			setPartsStorage((prev) => {
				const parts = [...prev.parts, newPart];

				return { ...prev, parts, selectedPart: newPart };
			});
			*/

//const quaternion = new THREE.Quaternion().setFromEuler(euler);
//e.object.matrix = new THREE.Matrix4().compose(new THREE.Vector3().fromArray(finalPosition), quaternion, new THREE.Vector3(1, 1, 1));

/*
	const { clear } = useControls({ clear: false });
	if (clear && partsStorage.parts.length > 1) {
		localStorage.removeItem("craftParts");
		setPartsStorage({ parts: [new Part({ id: 0, name: "fueltank" })], selectedID: 0 });
		controlsRef.current = null;	
	}*/
