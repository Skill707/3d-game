//import { DragControls } from "three/examples/jsm/Addons.js";
import { DragControls } from "../utils/MyDragControls.js";
import { attachPart, moveAttached, saveTransformation } from "./transformUtils.js";

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
					partType: selectedPart.partType,
					position: e.object.position.clone().toArray(),
					rotation: e.object.rotation.clone().toArray(),
					fuselage: selectedPart.fuselage,
				});
				api.commit();
				lastAddedRef.current = "dragPart" + newPart.id;
			} else if (button === 0) {
				api.disconnectPart(selectedPart);
				api.commit();
			}
		});
	};

	const onDrag = (e) => {
		const selectedObject = e.object;
		if (attachToSurfaces && e.hit) {
			const final = attachPart(selectedObject, e.hit);
			selectedObject.position.copy(final.position);
			if (autoRotateParts) selectedObject.rotation.copy(final.rotation);
		}

		selectedObject.updateMatrixWorld(true);

		moveAttached(selectedObject, e.objects);
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
