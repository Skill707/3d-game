//import { DragControls } from "three/examples/jsm/Addons.js";
import { transformSelectedObject } from "../state/actions.js";
import { DragControls } from "../utils/MyDragControls.js";
import { moveAttached, saveTransformation } from "./transformUtils.js";

export const initDragControls = (objects, threeStuff, partsStorageAPI, settingsStorage, lastAddedRef) => {
	const [camera, domElement, orbit] = threeStuff;
	const controls = new DragControls(objects, camera, domElement);
	controls.mouseButtons = {
		LEFT: 1,
		RIGHT: 1,
	};

	const autoResizeParts = settingsStorage.move.autoResizeParts;
	const autoRotateParts = settingsStorage.move.autoRotateParts;
	const attachToSurfaces = settingsStorage.move.attachToSurfaces;

	const onDragStart = (e) => {
		const button = e.button;
		orbit.current.enabled = false;

		const selectedPart = e.object.userData;
		partsStorageAPI((api, prev) => {
			if (button === 2) {
				const newPart = api.addPart({
					type: selectedPart.type,
					pos: e.object.position.clone().toArray(),
					rot: e.object.rotation.clone().toArray(),
					shapeSegments: selectedPart.shapeSegments,
				});
				api.commit();
				lastAddedRef.current = "dragPart" + newPart.id;
			} else if (button === 0) {
				api.disconnectPart(selectedPart.id);
				api.commit();
			}
		});
	};

	const onDrag = (e) => {
		const selectedPart = e.object.userData;
		const objects = e.objects;
		if (selectedPart.attachedParts.length > 0) {
			moveAttached(selectedPart.id, selectedPart.attachedParts, objects);
		}
		const hit = e.hit;
		if (!hit) return;
		transformSelectedObject(e.object, hit, attachToSurfaces, autoRotateParts);
		if (selectedPart.attachedParts.length > 0) {
			moveAttached(selectedPart.id, selectedPart.attachedParts, objects);
		}
	};

	const onDragEnd = (e) => {
		orbit.current.enabled = true;
		const destroy = e.destroy;
		saveTransformation(partsStorageAPI, e.object, e.objects, e.lastHit, autoResizeParts, "Connected");
		destroy();
	};

	controls.addEventListener("dragstart", (e) => onDragStart(e));
	controls.addEventListener("drag", onDrag);
	controls.addEventListener("dragend", (e) => onDragEnd(e));

	return controls;
};
