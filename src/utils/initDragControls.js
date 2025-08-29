//import { DragControls } from "three/examples/jsm/Addons.js";
import { DragControls } from "../utils/MyDragControls.js";
import { saveTransformation, transformSelectedObject } from "./transformUtils.js";
import { moveAttached } from "./attachmentUtils.js";

export const initDragControls = (objects, threeStuff, partsStorageAPI, settingsStorage) => {
	const [camera, domElement, orbit] = threeStuff;
	const controls = new DragControls(objects, camera, domElement);

	controls.transformGroup = true;
	controls.mouseButtons = {
		LEFT: 1,
		RIGHT: 1,
	};

	const autoResizeParts = settingsStorage.move.autoResizeParts;
	const autoRotateParts = settingsStorage.move.autoRotateParts;
	const attachToSurfaces = settingsStorage.move.attachToSurfaces;

	const onClick = (e) => {
		const button = e.button;
		if (button === 0) {
			partsStorageAPI((api) => {
				api.selectObjectName(e.object.name);
				api.commit();
			});
		}
	};

	const onDragStart = (e) => {
		const button = e.button;
		orbit.current.enabled = false;

		partsStorageAPI((api, prev) => {
			const selectedPart = prev.parts.find((p) => p.objectName === e.object.name) || null;
			if (button === 2) {
				api.addPart({
					name: selectedPart.name,
					pos: e.object.position.clone().toArray(),
					rot: e.object.rotation.clone().toArray(),
					shapeSegments: selectedPart.shapeSegments,
				});
				api.commit();
			} else if (button === 0) {
				let parts = prev.parts.map((p) => {
					if (selectedPart.attachedToPart && p.id === selectedPart.attachedToPart.id) {
						return { ...p, attachedParts: p.attachedParts.filter((part) => part.id !== selectedPart.id) };
					}
					if (p.id === selectedPart.id) {
						return { ...p, selected: true, drag: true, attachedToPart: null };
					} else {
						return { ...p, selected: false, drag: false };
					}
				});
				api.commit({ ...prev, parts, selectedPart: selectedPart });
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
		saveTransformation(partsStorageAPI, e.object, e.objects, e.lastHit, autoResizeParts);
		destroy();
	};

	controls.addEventListener("click", (e) => onClick(e));
	controls.addEventListener("dragstart", (e) => onDragStart(e));
	controls.addEventListener("drag", onDrag);
	controls.addEventListener("dragend", (e) => onDragEnd(e));

	return controls;
};
