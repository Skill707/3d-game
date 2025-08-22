import { useAtom } from "jotai";
import * as THREE from "three";
import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import { partsAtom } from "../state/atoms";
import { CreatePart, Part } from "../utils/partFactory";
import { useControls } from "leva";
import { produce } from "immer";
import { DragControls } from "three/examples/jsm/Addons.js";

export default function Craft({ orbit }) {
	const [partsStorage, setPartsStorage] = useAtom(partsAtom);
	const controlsRef = useRef(null);

	/*
	const { clear } = useControls({ clear: false });
	if (clear && partsStorage.parts.length > 1) {
		localStorage.removeItem("craftParts");
		setPartsStorage({ parts: [new Part({ id: 0, name: "fueltank" })], selectedID: 0 });
		controlsRef.current = null;	
	}*/

	const { camera, scene, gl } = useThree();

	const lastButton = useRef(0);

	useEffect(() => {
		const handler = (ev) => (lastButton.current = ev.button);
		gl.domElement.addEventListener("pointerdown", handler);
		return () => gl.domElement.removeEventListener("pointerdown", handler);
	}, [gl]);

	//useCallback
	const createControls = (partsGroupObjects, parts) => {
		const controls = new DragControls(partsGroupObjects, camera, gl.domElement);
		controls.transformGroup = true;
		controls.recursive = true;
		controls.mouseButtons = {
			LEFT: 1,
			RIGHT: 1,
		};

		let intersectPart = null;
		let intersectPartGroupObject = null;
		let attachTo = null;
		const dragstart = (e) => {
			console.log("START", e.object.name);
			orbit.current.enabled = false;
			const selectedPart = parts.find((p) => p.objectName === e.object.name) || null;
			if (!selectedPart) return;

			if (lastButton.current === 2) {
				const newID = Math.max(0, ...parts.map((p) => p.id)) + 1; // Генерируем уникальный ID
				const newPart = new Part({
					id: newID,
					name: selectedPart.name,
					pos: e.object.position.clone().toArray(),
					rot: e.object.rotation.clone().toArray(),
					shape: selectedPart.shape,
					selected: false,
				});
				setPartsStorage((prev) => {
					let parts = [...prev.parts, newPart];
					return { ...prev, parts, selectedID: selectedPart.id };
				});
			} else if (lastButton.current === 0) {
				setPartsStorage((prev) => {
					const parts = prev.parts.map((p) => {
						if (p.id === selectedPart.attachedToPart) {
							return { ...p, attachedParts: p.attachedParts.filter((part) => part.id !== selectedPart.id) };
						}
						if (p.id === selectedPart.id) {
							return { ...p, selected: true, drag: true, attachedToPart: null };
						} else {
							return { ...p, selected: false, drag: false };
						}
					});

					return { ...prev, parts, selectedID: selectedPart.id };
				});
			}
		};

		const drag = (e) => {
			const selectedPart = parts.find((p) => p.objectName === e.object.name) || null;
			if (!selectedPart) return;

			function moveAttaced(id, attachedParts) {
				if (!attachedParts) return;
				attachedParts.forEach((part) => {
					const selObj = scene.getObjectByName("dragPart" + id);
					const obj = scene.getObjectByName("dragPart" + part.id);
					obj.position.copy(new THREE.Vector3(...selObj.position).add(new THREE.Vector3().fromArray(part.offset)));
					const found = parts.find((p) => p.id === part.id);
					moveAttaced(found.id, found.attachedParts);
				});
			}

			moveAttaced(selectedPart.id, selectedPart.attachedParts);

			// актуальные "другие" объекты каждый раз
			const others = partsGroupObjects.filter((o) => o !== e.object);
			if (!others.length) return;

			// DragControls уже обновил свой raycaster; доп. setFromCamera не обязателен
			const hits = controls.raycaster.intersectObjects(others, true);
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

			moveAttaced(selectedPart.id, selectedPart.attachedParts);
		};

		const dragend = (e) => {
			console.log("END", e.object.name);

			orbit.current.enabled = true;
			const selectedPart = parts.find((p) => p.objectName === e.object.name) || null;
			if (!selectedPart) return;

			setPartsStorage(
				produce((draft) => {
					const p = draft.parts.find((p) => p.id === selectedPart.id);
					if (!p) return;
					p.drag = false;
					// можно ещё сохранить финальную pos/rot сюда
					p.pos = [e.object.position.x, e.object.position.y, e.object.position.z];
					p.rot = [e.object.rotation.x, e.object.rotation.y, e.object.rotation.z];
					console.log("updated pos for id", p.id);

					if (intersectPart) {
						p.attachedToPart = intersectPart.id;
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
							const selObjPos = selObj.position.add(new THREE.Vector3().fromArray(part.offset));
							const par = draft.parts.find((p) => p.id === part.id);
							par.pos = [selObjPos.x, selObjPos.y, selObjPos.z];
							//par.rot = [selObj.rotation.x, selObj.rotation.y, selObj.rotation.z];
							console.log("updated pos for id", par.id);

							saveAttaced(par.id, par.attachedParts);
						});
					}

					saveAttaced(p.id, p.attachedParts);
				})
			);

			intersectPart = null;
			controlsRef.current?.dispose();
			controlsRef.current = null;
		};

		//console.log("addEventListeners");
		controls.addEventListener("dragstart", dragstart);
		controls.addEventListener("drag", drag);
		controls.addEventListener("dragend", dragend);
		return controls;
	};

	useEffect(() => {
		if (!controlsRef.current) {
			const partsGroupObjects = scene.children.filter((obj) => obj.name.includes("drag"));
			if (partsGroupObjects.length) {
				if (controlsRef.current) {
					controlsRef.current?.dispose();
				}
				controlsRef.current = createControls(partsGroupObjects, partsStorage.parts);
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [partsStorage]);

	return (
		<>
			{partsStorage.parts.map((part) => (
				<CreatePart key={part.id} part={part} />
			))}
		</>
	);
}

//const quaternion = new THREE.Quaternion().setFromEuler(euler);
//e.object.matrix = new THREE.Matrix4().compose(new THREE.Vector3().fromArray(finalPosition), quaternion, new THREE.Vector3(1, 1, 1));
