import { Part } from "./partFactory";
import { saveTransformation, transformSelectedObject } from "../utils/transformUtils";
import { moveAttached } from "./attachmentUtils";
export const onClick = (e, setPartsStorage) => {
	const button = e.button;

	if (button === 0) {
		setPartsStorage((prev) => {
			const selectedPart = prev.parts.find((p) => p.objectName === e.object.name) || null;
			return { ...prev, selectedPart: selectedPart };
		});
	}
};

export const onDragStart = (e, orbit, setPartsStorage) => {
	const button = e.button;
	orbit.current.enabled = false;

	setPartsStorage((prev) => {
		const selectedPart = prev.parts.find((p) => p.objectName === e.object.name) || null;
		let parts = prev.parts;
		if (button === 2) {
			const newID = Math.max(0, ...parts.map((p) => p.id)) + 1; // Генерируем уникальный ID
			const newPart = new Part({
				id: newID,
				name: selectedPart.name,
				pos: e.object.position.clone().toArray(),
				rot: e.object.rotation.clone().toArray(),
				shapeSegments: selectedPart.shapeSegments,
			});
			parts = [...parts, newPart];
		} else if (button === 0) {
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

export const onDrag = (e) => {
	const selectedPart = e.object.userData;
	const objects = e.objects;
	if (selectedPart.attachedParts.length > 0) {
		moveAttached(selectedPart.id, selectedPart.attachedParts, objects);
	}
	const hit = e.hit;
	if (!hit) return;
	transformSelectedObject(e.object, hit);
	if (selectedPart.attachedParts.length > 0) {
		moveAttached(selectedPart.id, selectedPart.attachedParts, objects);
	}
};

export const onDragEnd = (e, orbit, setPartsStorage) => {
	orbit.current.enabled = true;
	const destroy = e.destroy;
	saveTransformation(setPartsStorage, e.object, e.objects, e.lastHit);
	destroy();
};

export const onHoverOff = (e) => {};

export const onHoverOn = (e) => {};
