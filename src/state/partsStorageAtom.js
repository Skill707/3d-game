import { atom } from "jotai";
import { generatePoints, Part } from "../utils/partFactory";
import { getOffsetMatrix } from "../utils/transformUtils";

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

const otherSide = (side) => {
	if (side === "front") {
		return "back";
	} else if (side === "back") {
		return "front";
	} else {
		return side;
	}
};

const initialState = { parts: [new Part({ id: 0, type: "fueltank", root: true })], selectedPart: null };

const basePartsAtom = atom(loadPartsFromStorage());

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
						type: prop,
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
			updPartListProps: (list) => {
				newState.parts = newState.parts.map((part) => {
					list.forEach((element, index) => {
						if (part.id === element.id) {
							if (element.pushTo) {
								for (let propertieName in element.pushTo) {
									const value = element.pushTo[propertieName];
									if (Array.isArray(value)) {
										value.forEach((arrElement) => {
											part = { ...part, ...part[propertieName].push(arrElement) };
										});
									} else {
										part = { ...part, ...part[propertieName].push(value) };
									}
								}
							} else if (element.filterByID) {
								for (let propertieName in element.filterByID) {
									const value = element.filterByID[propertieName];
									if (Array.isArray(value)) {
										value.forEach((arrElement) => {
											const filtered = part[propertieName].filter((f) => arrElement.id !== f.id);
											part = { ...part, [propertieName]: filtered };
										});
									} else {
										const filtered = part[propertieName].filter((f) => value.id !== f.id);
										part = { ...part, [propertieName]: filtered };
									}
								}
							} else if (element.properties) {
								part = { ...part, ...element.properties };
							}
							list[index] = part;
						}
					});
					return part;
				});
				updatedParts.push(...list);
				return list;
			},
			connectParts: (firstObject, attachTo, secondObject) => {
				const firstPartID = firstObject.userData.id;
				const secondPartID = secondObject.userData.id;
				if (firstPartID === secondPartID) return;
				const firstStatePartAttachedParts = {
					id: secondPartID,
					name: secondObject.userData.name,
					offsetMatrix: getOffsetMatrix(firstObject, secondObject),
					place: attachTo,
					root: secondObject.userData.root,
				};
				const secondStatePartAttachedToParts = {
					id: firstPartID,
					name: firstObject.userData.name,
					offsetMatrix: getOffsetMatrix(secondObject, firstObject),
					place: otherSide(attachTo),
					root: firstObject.userData.root,
				};
				const list = [
					{ id: firstPartID, pushTo: { attachedParts: firstStatePartAttachedParts } },
					{ id: secondPartID, pushTo: { attachedToParts: secondStatePartAttachedToParts } },
				];
				return api.updPartListProps(list);
			},
			disconnectPart: (partID) => {
				const statePart = newState.parts.find((p) => p.id === partID) || null;
				const list = [];
				statePart.attachedToParts.forEach((element) => {
					list.push({ id: element.id, filterByID: { attachedParts: { id: partID } } });
				});
				list.push({ id: partID, properties: { attachedToParts: [] } });
				return api.updPartListProps(list);
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
			deleteAttached: (id, id2) => {
				const statePart = newState.parts.find((p) => p.id === id);
				const newAttachedParts = statePart.attachedParts.filter((ap) => ap.id !== id2);
				api.updPartProperties(id, {
					attachedParts: newAttachedParts,
				});
			},
			deleteAttachedTo: (id, id2) => {
				const statePart = newState.parts.find((p) => p.id === id);
				const newAttachedToParts = statePart.attachedToParts.filter((ap) => ap.id !== id2);
				api.updPartProperties(id, {
					attachedToParts: newAttachedToParts,
				});
			},
			todo: (tasks) => {
				for (const key in tasks) {
					const value = tasks[key];
					const ret = api[key](value);
					//(key, "(", value, ")=>", ret);
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
