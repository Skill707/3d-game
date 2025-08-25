import { produce } from "immer";
import { canAttachParts, wouldFormCycle } from "../utils/attachmentUtils";
import { calculatePositionDelta, calculateRotationDelta, updateRelativeTransform } from "../utils/transformUtils";
import { Part } from "../utils/partFactory";

export function addPart(parts, newID, type) {
	const newPart = new Part({
		id: newID,
		name: type,
	});
	return [[...parts, newPart], newPart];
}

export function removePart(setPartsStorage, id) {
	setPartsStorage(
		produce((draft) => {
			draft.parts = draft.parts.filter((part) => part.id !== id);
			draft.selectedID = null;
		})
	);
}



export function transformPart2(setPartsStorage, id, newPos, newRot) {
	setPartsStorage(
		produce((draft) => {
			const part = draft.parts.find((p) => p.id === id);
			if (!part) return;

			// Сохраняем старые значения для вычисления дельты
			const oldPos = [...part.pos];
			const oldRot = [...part.rot];

			// Обновляем позицию и поворот выбранной детали
			part.pos = newPos;
			part.rot = newRot;

			// Вычисляем изменения в позиции и повороте
			const positionDelta = calculatePositionDelta(oldPos, newPos);
			const rotationDelta = calculateRotationDelta(oldRot, newRot);

			// Рекурсивная функция для обновления прикрепленных деталей
			function updateAttachedParts(parentId, visited = new Set()) {
				if (visited.has(parentId)) return;
				visited.add(parentId);

				const parent = draft.parts.find((p) => p.id === parentId);
				if (!parent) return;

				// Для каждой точки крепления
				["front", "back", "side"].forEach((attachPoint) => {
					parent.attachedPartIDs[attachPoint].forEach((attachedId) => {
						if (visited.has(attachedId)) return;

						const attachedPart = draft.parts.find((p) => p.id === attachedId);
						if (!attachedPart) return;

						// Обновляем трансформацию прикрепленной детали
						const newTransform = updateRelativeTransform(attachedPart, parent, positionDelta, rotationDelta);

						attachedPart.pos = newTransform.pos;
						attachedPart.rot = newTransform.rot;

						// Рекурсивно обновляем детали, прикрепленные к текущей
						updateAttachedParts(attachedId, visited);
					});
				});
			}

			// Начинаем обновление с выбранной детали
			updateAttachedParts(id);
		})
	);
}

export function selectPartByID(setPartsStorage, id) {
	setPartsStorage((prev) => {
		const parts = prev.parts.map((part) => (part.id === id ? { ...part, selected: true } : { ...part, selected: false }));
		return { ...prev, parts, selectedID: id };
	});
}


export function attachPartsByID(setPartsStorage, id, attachToID, attachPoint) {
	setPartsStorage(
		produce((draft) => {
			const part = draft.parts.find((p) => p.id === id);
			const attachToPart = draft.parts.find((p) => p.id === attachToID);

			if (!part || !attachToPart) {
				console.warn("One or both parts not found");
				return;
			}

			// Проверяем возможность прикрепления
			if (!canAttachParts(part, attachToPart, attachPoint)) {
				console.warn(`Cannot attach part ${part.name} to ${attachToPart.name}`);
				return;
			}

			// Проверяем на образование циклов
			if (wouldFormCycle(draft.parts, id, attachToID)) {
				console.warn("Cannot attach - would form a cycle");
				return;
			}

			// Прикрепляем детали друг к другу
			part.attachedPartIDs[attachPoint].push(attachToID);
			attachToPart.attachedPartIDs[attachPoint].push(id);
		})
	);
}

export function detachPartsByID(setPartsStorage, id, detachFromID) {
	setPartsStorage(
		produce((draft) => {
			const part = draft.parts.find((p) => p.id === id);
			const attachToPart = draft.parts.find((p) => p.id === detachFromID);
			if (part && attachToPart) {
				part.attachedPartIDs.front = part.attachedPartIDs.front.filter((pid) => pid !== detachFromID);
				part.attachedPartIDs.back = part.attachedPartIDs.back.filter((pid) => pid !== detachFromID);
				part.attachedPartIDs.side = part.attachedPartIDs.side.filter((pid) => pid !== detachFromID);

				attachToPart.attachedPartIDs.front = attachToPart.attachedPartIDs.front.filter((pid) => pid !== id);
				attachToPart.attachedPartIDs.back = attachToPart.attachedPartIDs.back.filter((pid) => pid !== id);
				attachToPart.attachedPartIDs.side = attachToPart.attachedPartIDs.side.filter((pid) => pid !== id);
			}
		})
	);
}

export function clearAttachmentsOfPartsByID(setPartsStorage, id) {
	setPartsStorage(
		produce((draft) => {
			const part = draft.parts.find((p) => p.id === id);
			if (part) {
				part.attachedPartIDs.front = [];
				part.attachedPartIDs.back = [];
				part.attachedPartIDs.side = [];
			}
		})
	);
}

