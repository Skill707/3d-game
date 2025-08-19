import { Text, Billboard, Extrude } from "@react-three/drei";
import { useAtom } from "jotai";
import * as THREE from "three";
import { useEffect, useState } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import { Raycaster } from "three";
import { partsAtom } from "../state/atoms";
import { CreatePart, Part } from "../utils/partFactory";
import { addPart, transformPart, selectPartByID, clearSavedParts } from "../state/actions";
import { useControls } from "leva";
import { produce } from "immer";
import { DragControls } from "three/addons/controls/DragControls.js";

export default function Craft({ orbit }) {
	const [partsStorage, setPartsStorage] = useAtom(partsAtom);
	const parts = partsStorage.parts;
	const selectedID = partsStorage.selectedID;
	const selectedPart = parts.find((p) => p.id === selectedID) || null;

	const { clear } = useControls({ clear: false });
	if (clear & (parts.length > 0)) {
		clearSavedParts(setPartsStorage);
	}

	const { camera, scene, mouse, gl } = useThree();
	const [raycaster] = useState(() => new Raycaster());

	
	useEffect(() => {
		const partsGroupObjects = scene.children;
		console.log("partsGroupObjects", partsGroupObjects);
	
		if (partsGroupObjects) {
			const controls = new DragControls(partsGroupObjects.filter((obj)=>obj.name.includes("drag")), camera, gl.domElement);
			controls.transformGroup = true;
			controls.rotateSpeed = 0;

			function dragstart(event) {
				console.log("dragstart", event.object.userData);
				orbit.current.enabled = false;
				
			}

			controls.addEventListener("dragstart", dragstart);
			function dragend(event) {
				//console.log("dragend", event.object);
				orbit.current.enabled = true;
			}

			controls.addEventListener("dragend", dragend);
			return () => {
				controls.dispose()
			};
		}
	}, [parts, camera, orbit, gl, scene]);


	const getCollision = true;

	useFrame((state) => {
		if (selectedPart && !selectedPart.drag) return;
		raycaster.setFromCamera(mouse, camera);
		const partsGroupObjects = state.scene.children[3].children;
		console.log("partsGroupObjects", partsGroupObjects);

		let selectedObject = null;
		let otherObjects = [];

		partsGroupObjects.map((group) => {
			if (group.name === "dragPart" + selectedID) {
				selectedObject = group;
			} else {
				otherObjects.push(group);
			}
		});
		if (otherObjects.length === 0 || selectedObject === null) return;
		//console.log("otherObjects", otherObjects, "selectedObject", selectedObject);

		const intersects = raycaster.intersectObjects(otherObjects);
		if (intersects.length > 0) {
			const firstIntersect = intersects[0];

			const object = firstIntersect.object;
			const attachTo = object.name;
			const point = firstIntersect.point;
			const localNormal = firstIntersect.normal;

			const intersectPartGroupObject = object.parent.parent;
			if (!intersectPartGroupObject) return;

			const intersectPart = parts.find((p) => p.objectName === intersectPartGroupObject.name) || null;
			if (!intersectPart) return;

			let euler = new THREE.Euler();
			let finalPosition = new THREE.Vector3();
			if (attachTo === "side") {
				// Transform normal from local to world space using part's rotation
				const partRotation = new THREE.Euler(...intersectPart.rot);
				const rotationMatrix = new THREE.Matrix4().makeRotationFromEuler(partRotation);
				const normal = localNormal.clone().applyMatrix4(rotationMatrix);

				// Convert normal to rotation using quaternion
				const normalVector = new THREE.Vector3(normal.x, normal.y, normal.z);
				const defaultUp = new THREE.Vector3(0, 1, 0);
				const quaternion = new THREE.Quaternion();

				// Calculate the rotation from defaultUp to our normal
				quaternion.setFromUnitVectors(defaultUp, normalVector);

				// Convert quaternion to euler angles
				euler = new THREE.Euler().setFromQuaternion(quaternion);

				// Calculate position offset based on part size and rotation
				const size = selectedPart.size;

				// Create rotation matrix from our quaternion
				const rotMatrix = new THREE.Matrix4().makeRotationFromQuaternion(quaternion);

				// Calculate the offset vector in local space
				const offsetVector = new THREE.Vector3(0, -size[1] / 2, 0);
				// Transform the offset vector by our rotation
				offsetVector.applyMatrix4(rotMatrix);

				// Apply the offset to the intersection point
				finalPosition = [point.x - offsetVector.x, point.y - offsetVector.y, point.z - offsetVector.z];

				//transformPart(setPartsStorage, selectedID, finalPosition, [euler.x, euler.y, euler.z]);
			} else if (attachTo === "front" || attachTo === "back") {
				// Calculate position offset based on part size
				const size = selectedPart.size;
				const offset = attachTo === "front" ? size[2] / 2 : -size[2] / 2;
				finalPosition = [point.x, point.y, point.z + offset];

				//transformPart(setPartsStorage, selectedID, finalPosition, part.rot);
			}
			const quaternion = new THREE.Quaternion().setFromEuler(euler);
			selectedObject.matrix = new THREE.Matrix4().compose(new THREE.Vector3().fromArray(finalPosition), quaternion, new THREE.Vector3(1, 1, 1));
		}
	});

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

	return (
		<>
			
				{parts.map((part) => (
					<CreatePart
						key={part.pos}
						part={part}
						handleClickPart={handleClickPart}
						handleStartDragPart={handleStartDragPart}
						handleCopyPart={handleCopyPart}
						handleEndDragPart={handleEndDragPart}
					/>
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
			<mesh>
				<sphereGeometry args={[0.1, 16, 16]} />
				<meshStandardMaterial color="white" />
			</mesh>

			<mesh name="placementPlane" rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} visible={false}>
				<planeGeometry args={[100, 100]} />
				<meshBasicMaterial />
			</mesh>

			let closest = null;
			let minDist = MAGNET_THRESHOLD;

			// Текущие attach points ghostPart (если есть в attachPointsMap)
			const mousePoints = attachPointsMap[mousePart.id];
			const ghostPoints = attachPointsMap[ghostPart.id];
			if (!ghostPoints | !mousePoints) return;

			// Перебираем все детали, кроме ghostPart
			for (const [partId, points] of Object.entries(attachPointsMap)) {
				if (partId === ghostPart.id) continue;
				if (partId === mousePart.id) continue;

				for (let index = 0; index < mousePoints.length; index++) {
					const mousePoint = mousePoints[index];
					const ghostPoint = ghostPoints[index];
					for (const p of points) {
						const dist = mousePoint.distanceTo(p);
						if (dist < minDist) {
							minDist = dist;
							closest = { ghostPoint: ghostPoint, partPoint: p };
						}
					}
				}
			}

			if (closest) {
				const offset = new THREE.Vector3().subVectors(closest.partPoint, closest.ghostPoint);
				const newPos = new THREE.Vector3(...ghostPart.pos).add(offset.multiply(new THREE.Vector3(0.5, 0.5, 0.5)));
				setGhostPart((prev) => (prev ? { ...prev, pos: [newPos.x, newPos.y, newPos.z] } : prev));
			} else {
				setGhostPart((prev) => (prev ? { ...prev, pos: mousePart.pos } : prev));
			}
			*/
