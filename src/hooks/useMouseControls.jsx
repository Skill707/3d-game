import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import { Raycaster, Vector2 } from "three";

const raycaster = new Raycaster();
const pointer = new Vector2();
let selected = null;

export default function useMouseControls(enabled, partsStorage, partsStorageAPI, settingsStorage, orbit) {
	const { scene, camera, gl } = useThree();
	
	function updatePointer(event) {
		const rect = gl.domElement.getBoundingClientRect();
		pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
		pointer.y = (-(event.clientY - rect.top) / rect.height) * 2 + 1;
	}

	function findGroup(obj, group = null) {
		if (obj.isGroup) group = obj;

		if (obj.parent === null || obj.parent.name === "craft") return group;

		return findGroup(obj.parent, group);
	}

	function raycast() {
		const intersections = [];
		raycaster.setFromCamera(pointer, camera);
		raycaster.intersectObjects(scene.children, true, intersections);
		const hits = intersections.filter((i) => i.object.name.includes("front") || i.object.name.includes("rear") || i.object.name.includes("side"));
		return hits;
	}

	useEffect(() => {
		if (!enabled) return;
		function onPointerDown(event) {
			updatePointer(event);

			const hits = raycast();
			if (hits.length > 0) {
				selected = findGroup(hits[0].object);

				if (selected && event.button === 0) {
					orbit.current.enabled = false;
					if (settingsStorage.activeSubToolId !== "PAINT") {
						partsStorageAPI((api) => {
							api.selectPart(selected.name);
							api.commit();
						});
					} else {
						partsStorageAPI((api) => {
							api.updPartProperties(selected.userData.id, { color: settingsStorage.paint.selected });
							api.commit();
						});
					}
				}
			}
		}

		function onPointerCancel(event) {
			orbit.current.enabled = true;
			selected = null;
		}

		function onDoubleClick(event) {
			updatePointer(event);

			const intersections = [];
			raycaster.setFromCamera(pointer, camera);
			raycaster.intersectObjects(scene.children, true, intersections);
			const hits = intersections.filter((i) => i.object.name === "extender");
			if (hits.length > 0) {
				const hit = hits[0];
				selected = findGroup(hit.object);
			}
		}

		gl.domElement.addEventListener("pointerdown", onPointerDown);
		gl.domElement.addEventListener("pointerup", onPointerCancel);
		gl.domElement.addEventListener("dblclick", onDoubleClick);
		return () => {
			gl.domElement.removeEventListener("pointerdown", onPointerDown);
			gl.domElement.removeEventListener("pointerup", onPointerCancel);
			gl.domElement.removeEventListener("dblclick", onDoubleClick);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [partsStorage.parts, settingsStorage, enabled]);

	return selected;
}
