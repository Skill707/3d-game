import { produce } from "immer";
import * as THREE from "three";
import { Part } from "./partFactory";

export const onClick = (e, setPartsStorage) => {
	const button = e.button;

	console.log("click", e.object.name);

	setPartsStorage((prev) => {
		const selectedPart = prev.parts.find((p) => p.objectName === e.object.name) || null;
		return { ...prev, selectedPart: selectedPart };
	});
};

export const onDragStart = (e, orbit, setPartsStorage) => {
	const button = e.button;
	orbit.current.enabled = false;
	console.log("start", e.object.name);

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
	const hit = e.hit;

	//moveAttached(selectedPart.id, selectedPart.attachedParts);
};

export const onDragEnd = (e, orbit, setPartsStorage) => {
	orbit.current.enabled = true;
	const destroy = e.destroy;
	destroy();
	setPartsStorage(
		produce((draft) => {
			console.log("end parts: ", JSON.stringify(draft.parts.map((p) => p.id)));
			const selectedPart = draft.parts.find((p) => p.objectName === e.object.name);
			selectedPart.drag = false;
			// можно ещё сохранить финальную pos/rot сюда
			selectedPart.pos = [e.object.position.x, e.object.position.y, e.object.position.z];
			selectedPart.rot = [e.object.rotation.x, e.object.rotation.y, e.object.rotation.z];
			draft.selectedPart = null; // кастыль
			draft.selectedPart = selectedPart;

			/*
			const objects = e.objects;
			const lastHit = e.lastHit;
			if (!objects || !lastHit) return;
			const attachTo = lastHit.object.name;
			const hitGroupObject = lastHit.object.parent;
			const hitPart = hitGroupObject.userData;

			if (hitGroupObject) {
				selectedPart.attachedToPart = hitPart.id;
				const foundPart = draft.parts.find((p) => p.id === hitPart.id);
				//foundPart.shape.sections[0] = p.shape.sections[0];
				if (!foundPart.attachedParts.find((part) => part.id === selectedPart.id))
					foundPart.attachedParts.push({
						id: selectedPart.id,
						offset: new THREE.Vector3().subVectors(e.object.position, hitGroupObject.position).toArray(),
						name: attachTo,
					});
			}*/
		})
	);
	const selectedPart = e.object.userData;
	//saveAttaced(selectedPart.id, selectedPart.attachedParts);
};

export const onHoverOff = (e) => {};

export const onHoverOn = (e) => {};
