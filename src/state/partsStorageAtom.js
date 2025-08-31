import { atom } from "jotai";
import { generatePoints, Part } from "../utils/partFactory";

const loadPartsFromStorage = () => {
	try {
		const stored = localStorage.getItem("craftParts");

		if (stored && stored != undefined) {
			let partsStorage = JSON.parse(stored);
			partsStorage.selectedPart = null;
			return partsStorage;
		}
	} catch (e) {
		console.error("Error loading parts from localStorage:", e);
	}
	return initialState;
};

function updateShapeSegment(shapeSegments, newSegment) {
	newSegment.points = generatePoints(newSegment);
	return { ...shapeSegments, [newSegment.name]: newSegment };
}
function updateShapeSegmentProperties(segment, newProperties) {
	return { ...segment, ...newProperties, name: segment.name, closed: segment.closed };
}

const initialState = { parts: [new Part({ id: 0, name: "fueltank", root: true })], selectedPart: null };

const basePartsAtom = atom(initialState);

export default atom(
	(get) => get(basePartsAtom),
	(get, set, update) => {
		let newState = structuredClone(get(basePartsAtom));
		let updatedParts = [];
		let objects = null;

		/**
		 * API для управления частями.
		 * @typedef {Object} PartsAPI
		 * @property {(type: string|object) => Part} addPart Добавляет новую деталь, делает её выбранной и возвращает её.
		 * @property {(objectName: string) => Part|null} selectObjectName Выбирает часть по имени объекта.
		 * @property {(id: number) => Part|null} selectPartID Выбирает часть по ID.
		 * @property {() => void} commit Применяет все изменения в состояние.
		 */

		/** @type {PartsAPI} */
		const api = {
			restart: () => {
				set(basePartsAtom, initialState);
			},
			loadCraft: () => {
				set(basePartsAtom, loadPartsFromStorage());
			},
			saveCraft: () => {
				localStorage.setItem("craftParts", JSON.stringify(newState));
			},
			setObjects: (newObjects) => {
				objects = newObjects;
			},
			addPart: (prop) => {
				const parts = newState.parts;
				const newID = Math.max(0, ...parts.map((p) => p.id)) + 1; // Генерируем уникальный ID
				let parameters = {};
				if (typeof prop === "string") {
					parameters = {
						id: newID,
						name: prop,
					};
				} else if (typeof prop === "object") {
					parameters = { ...prop, id: newID };
				} else return null;
				const newPart = new Part(parameters);
				parts.push(newPart);
				updatedParts.push(newPart);
				newState.selectedPart = newPart;
				return newPart;
			},

			selectObjectName: (objectName) => {
				const selectedPart = newState.parts.find((p) => p.objectName === objectName) || null;
				newState.selectedPart = selectedPart;
				return selectedPart;
			},
			selectPartID: (id) => {
				const selectedPart = newState.parts.find((p) => p.id === id) || null;
				newState.selectedPart = selectedPart;
				return selectedPart;
			},
			updPartProperties: (id, properties) => {
				let updatedPart = null;
				newState.parts = newState.parts.map((part) => {
					if (part.id === id) {
						updatedPart = { ...part, ...properties };
						return updatedPart;
					}
					return part;
				});
				updatedParts.push(updatedPart);
				return updatedPart;
			},
			addAttachedPart: (id, ap) => {
				const statePart = newState.parts.find((p) => p.id === id);
				const attachedParts = [...statePart.attachedParts, ap];
				api.updPartProperties(id, {
					attachedParts: attachedParts,
				});
				return attachedParts;
			},
			translateParts: (list) => {
				list.forEach((part) => {
					const statePart = newState.parts.find((p) => p.id === part.id);
					const newPos = [statePart.pos[0] + part.posDelta[0], statePart.pos[1] + part.posDelta[1], statePart.pos[2] + part.posDelta[2]];
					api.updPartProperties(part.id, {
						pos: newPos,
					});
				});
			},
			rotateParts: (list) => {
				list.forEach((part) => {
					const statePart = newState.parts.find((p) => p.id === part.id);
					const newRot = [statePart.rot[0] + part.rotDelta[0], statePart.rot[1] + part.rotDelta[1], statePart.rot[2] + part.rotDelta[2]];
					api.updPartProperties(part.id, {
						rot: newRot,
					});
				});
			},
			updShapeCenter: (id, newProperties) => {
				const statePart = newState.parts.find((p) => p.id === id);
				let newShapeSegments = structuredClone(statePart.shapeSegments);
				newShapeSegments.center = { ...newShapeSegments.center, ...newProperties };
				api.updPartProperties(id, {
					shapeSegments: newShapeSegments,
				});
			},
			updPartsSegmentNameProps: (list) => {
				list.forEach((part) => {
					const statePart = newState.parts.find((p) => p.id === part.id);
					const newSegment = updateShapeSegmentProperties(statePart.shapeSegments[part.segmentName], part.newProperties);
					const newShapeSegments = updateShapeSegment(statePart.shapeSegments, newSegment);
					api.updPartProperties(part.id, {
						shapeSegments: newShapeSegments,
					});
				});
			},
			todo: (tasks) => {
				console.log("todo:");
				for (const key in tasks) {
					const value = tasks[key];
					const ret = api[key](value);
					console.log(key, "(", value, ")=>", ret);
				}
			},
			commit: (state) => {
				if (state) {
					set(basePartsAtom, state);
				} else {
					set(basePartsAtom, newState);
				}
			},
		};

		update(api, get(basePartsAtom), set);
		return updatedParts;
	}
);

/*
		function updateParts(list) {
			const updatedParts = list;
			const updatedPartsList = newState.parts.map((part) => {
				for (let index = 0; index < list.length; index++) {
					const element = list[index];
					const updatedPart = updatePartProperties(part, element.properties);
					updatedParts[index] = updatedPart;
					if (part.id === element.id) return updatedPart;
					return part;
				}
			});
			newState.parts = updatedPartsList;
			return updatedParts;
		}
*/