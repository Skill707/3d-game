import { useEffect, useRef } from "react";
import * as THREE from "three";
import { DragControls } from "three/examples/jsm/controls/DragControls.js";
import { useThree } from "@react-three/fiber";
import { produce } from "immer";

export function useDragControls(objects, orbit, parts, setPartsStorage) {
	const controlsRef = useRef(null);
	//const controlsRef = (useRef < DragControls) | (null > null);
	const { camera, gl } = useThree();

	useEffect(() => {
		if (!objects.length) console.log("return");
		if (!objects.length) return;

		if (controlsRef.current) return;

		console.log("did");
		// создаём контролы один раз
		const controls = new DragControls(objects, camera, gl.domElement);
		controls.transformGroup = true;
		controls.rotateSpeed = 0;
		controlsRef.current = controls;
		console.log(controlsRef.current);

		// примеры событий
		controls.addEventListener("dragstart", (e) => {
			console.log("drag start", e.object);
			orbit.current.enabled = false;
			const part = parts.find((p) => p.objectName === e.object.name) || null;
			const id = part.id;
			setPartsStorage((prev) => {
				const parts = prev.parts.map((part) => (part.id === id ? { ...part, selected: true, drag: true } : { ...part, selected: false, drag: false }));
				return { ...prev, parts, selectedID: id };
			});
		});
		controls.addEventListener("dragend", (e) => {
			console.log("drag end", e.object);
			orbit.current.enabled = true;
			const part = parts.find((p) => p.objectName === e.object.name) || null;
			const id = part.id;
			setPartsStorage(
				produce((draft) => {
					const part = draft.parts.find((p) => p.id === id);
					if (!part) {
						console.warn("part not found");
						return;
					}
					//part.pos = newPos;
					//part.rot = newRot;
					part.drag = false;
				})
			);
		});

		return () => {};
	}, [camera, gl, objects, parts, orbit, setPartsStorage]);
	console.log("controlsRef", controlsRef.current)
	return controlsRef;
}
