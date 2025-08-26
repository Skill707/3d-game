import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import { initDragControls } from "../utils/initDragControls";

export function useDragControls(enabled, orbit, partsStorage, setPartsStorage, lastAddedRef) {
	const controlsRef = useRef(null);
	const { scene, camera, gl } = useThree();

	useEffect(() => {
		if (controlsRef.current !== null) {
			if (controlsRef.current.enabled === false || !enabled) {
				controlsRef.current.dispose();
				controlsRef.current = null;
			}
		}

		if (!enabled) return;

		if (controlsRef.current === null) {
			const objects = scene.children.filter((obj) => obj.name.includes("dragPart"));

			if (objects.length > 0) controlsRef.current = initDragControls(objects, [camera, gl.domElement, orbit], setPartsStorage);
		} else {
			controlsRef.current.objects = scene.children.filter((obj) => obj.name.includes("dragPart"));
			if (lastAddedRef.current) {
				const lastAddedObject = scene.getObjectByName(lastAddedRef.current) || null;
				lastAddedRef.current = null;

				if (lastAddedObject) {
					controlsRef.current.selected = lastAddedObject;
					controlsRef.current.state = 0;
				}
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [partsStorage, enabled]);

	return controlsRef;
}
