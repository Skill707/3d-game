import { Text, Billboard } from "@react-three/drei";
import { useAtom } from "jotai";
import * as THREE from "three";
import { useCallback, useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import { partsAtom } from "../state/atoms";
import { CreatePart, Part } from "../utils/partFactory";
import { addPart, selectPartByID, clearSavedParts } from "../state/actions";
import { useControls } from "leva";
import { produce } from "immer";
import { DragControls } from "three/examples/jsm/Addons.js";

export default function Craft({ orbit }) {
	//console.log("Craft comp update");

	const [partsStorage, setPartsStorage] = useAtom(partsAtom);
	const parts = partsStorage.parts;
	const selectedID = partsStorage.selectedID;
	const selectedPart = parts.find((p) => p.id === selectedID) || null;

	const { clear } = useControls({ clear: false });
	if (clear & (parts.length > 0)) {
		clearSavedParts(setPartsStorage);
	}

	const { camera, scene, gl } = useThree();

	const lastButton = useRef(0);

	useEffect(() => {
		const handler = (ev) => (lastButton.current = ev.button);
		gl.domElement.addEventListener("pointerdown", handler);
		return () => gl.domElement.removeEventListener("pointerdown", handler);
	}, [gl]);

	const createControls = useCallback(
		(partsGroupObjects) => {
			const controls = new DragControls(partsGroupObjects, camera, gl.domElement);
			controls.transformGroup = true;
			controls.recursive = true;
			controls.mouseButtons = {
				LEFT: 1,
				RIGHT: 1,
			};

			const dragstart = (e) => {
				console.log("START", e.object.name);
				orbit.current.enabled = false;
				const part = parts.find((p) => p.objectName === e.object.name) || null;
				if (!part) return;
				const id = part.id;
				if (lastButton.current === 2) {
					const newID = Math.max(0, ...parts.map((p) => p.id)) + 1; // Генерируем уникальный ID
					const newPart = new Part({
						...part,
						id: newID,
						pos: e.object.position.clone().toArray(),
						rot: e.object.rotation.clone().toArray(),
						attachPartsByID: {
							front: [],
							back: [],
							side: [],
						},
					});
					addPart(setPartsStorage, newPart);
					selectPartByID(setPartsStorage, id);
				} else if (lastButton.current === 0) {
					setPartsStorage((prev) => {
						const parts = prev.parts.map((p) => (p.id === id ? { ...p, selected: true, drag: true } : { ...p, selected: false, drag: false }));
						return { ...prev, parts, selectedID: id };
					});
				}
			};

			const drag = (e) => {
				// актуальные "другие" объекты каждый раз
				const others = partsGroupObjects.filter((o) => o !== e.object);
				if (!others.length) return;

				// DragControls уже обновил свой raycaster; доп. setFromCamera не обязателен
				const hits = controls.raycaster.intersectObjects(others, true);
				if (!hits.length) return;

				const hit = hits[0];
				const point = hit.point.clone();
				const attachTo = hit.object.name;
				const localNormal = hit.normal;

				const intersectPartGroupObject = hit.object.parent;
				if (!intersectPartGroupObject) return;

				const intersectPart = parts.find((p) => p.objectName === intersectPartGroupObject.name) || null;
				if (!intersectPart) return;

				let finalPosition = point.clone();
				let finalRotation = new THREE.Euler();
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

					const size = selectedPart.size;
					const offset = new THREE.Vector3(0, -size[1] / 2, 0).applyQuaternion(quaternion);
					finalPosition.sub(offset);
				} else if (attachTo === "front" || attachTo === "back") {
					const size = selectedPart.size;
					const offset = attachTo === "front" ? size[2] / 2 : -size[2] / 2;
					finalPosition.set(point.x, point.y, point.z + offset);
					finalRotation.copy(new THREE.Euler(...intersectPart.rot));
				} else {
					finalPosition.copy(point);
					finalRotation.copy(new THREE.Euler());
				}

				e.object.position.copy(finalPosition);
				e.object.rotation.copy(finalRotation);
			};

			const dragend = (e) => {
				console.log("END", e.object.name);

				orbit.current.enabled = true;
				const part = parts.find((p) => p.objectName === e.object.name);
				if (!part) return;
				setPartsStorage(
					produce((draft) => {
						const found = draft.parts.find((p) => p.id === part.id);
						if (!found) return;
						found.drag = false;
						// можно ещё сохранить финальную pos/rot сюда
						found.pos = [e.object.position.x, e.object.position.y, e.object.position.z];
						found.rot = [e.object.rotation.x, e.object.rotation.y, e.object.rotation.z];
					})
				);
			};

			console.log("addEventListeners");
			controls.addEventListener("dragstart", dragstart);
			controls.addEventListener("drag", drag);
			controls.addEventListener("dragend", dragend);
			return controls;
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[parts]
	);

	const controlsRef = useRef(null);
	const partsGroupObjects = scene.children.filter((obj) => obj.name.includes("drag"));

	useEffect(() => {
		if (controlsRef.current) {
			if (partsGroupObjects.length !== controlsRef.current.objects.length) {
				controlsRef.current?.dispose();
				controlsRef.current = null;
				console.log("delete Controls");
			}
		}

		if (!partsGroupObjects.length) return;
		if (!controlsRef.current) {
			console.log("createControls");
			controlsRef.current = createControls(partsGroupObjects);
		}
	}, [partsGroupObjects, createControls, parts, setPartsStorage]);

	return (
		<>
			{parts.map((part) => (
				<CreatePart key={part.id} part={part} />
			))}

			{parts.length == 0 && (
				<Billboard
					follow={true}
					lockX={false}
					lockY={false}
					lockZ={false} // Lock the rotation on the z axis (default=false)
				>
					<Text position={[0, 0, 0]} fontSize={1} color="white" anchorX="center" anchorY="middle">
						Select new part to be root of the vehicle
					</Text>
				</Billboard>
			)}
		</>
	);
}

/*



//const quaternion = new THREE.Quaternion().setFromEuler(euler);
				//e.object.matrix = new THREE.Matrix4().compose(new THREE.Vector3().fromArray(finalPosition), quaternion, new THREE.Vector3(1, 1, 1));

	const handleClickPart = (id) => {};

	const handleCopyPart = (id) => {
		const newID = Math.max(0, ...parts.map((p) => p.id)) + 1; // Генерируем уникальный ID
		const part = parts.find((p) => p.id === id);
		const newPart = new Part({
			...part,
			id: newID,
			pos: [part.pos[0], part.pos[1], part.pos[2]], // Offset by 1 unit on X axis
			attachPartsByID: {
				front: [],
				back: [],
				side: [],
			},
		});
		addPart(setPartsStorage, newPart);
		selectPartByID(setPartsStorage, newID);
	};

	function handleStartDragPart(id) {
		setPartsStorage((prev) => {
			const parts = prev.parts.map((part) => (part.id === id ? { ...part, selected: true, drag: true } : { ...part, selected: false, drag: false }));
			return { ...prev, parts, selectedID: id };
		});
	}

	function handleDragPart(localMat) {
		//matrix.copy(localMat);
	}

	const handleEndDragPart = (id, newPos, newRot) => {
		setPartsStorage(
			produce((draft) => {
				const part = draft.parts.find((p) => p.id === id);
				if (!part) {
					console.warn("part not found");
					return;
				}
				part.pos = newPos;
				part.rot = newRot;
				part.drag = false;
			})
		);
	};
*/
