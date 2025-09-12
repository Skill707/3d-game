import { atom } from "jotai";
import { Part } from "../utils/partFactory";
import { getOffsetMatrix } from "../utils/transformUtils";

const initialState = { parts: [new Part({ id: 0, partType: "fuselage", root: true })], selectedPart: null, lastUpdate: new Date().getTime() };

const loadPartsFromStorage = () => {
	try {
		const stored = localStorage.getItem("craftParts");
		if (stored && stored != undefined) {
			let parsedParts = JSON.parse(stored);
			if (parsedParts.length > 0) {
				const parts = parsedParts.map((p) => new Part(p));
				return { ...initialState, parts: parts };
			}
		}
	} catch (e) {
		console.error("Error loading parts from localStorage:", e);
	}
	return initialState;
};

const otherSide = (side) => {
	if (side === "front") {
		return "rear";
	} else if (side === "rear") {
		return "front";
	} else {
		return side;
	}
};

const basePartsAtom = atom(loadPartsFromStorage());

export default atom(
	(get) => get(basePartsAtom),
	(get, set, update) => {
		//let newState = structuredClone(get(basePartsAtom));
		let prev = get(basePartsAtom);
		let newState = { ...prev, lastUpdate: Date.now() };
		newState.lastUpdate = new Date().getTime();
		let updatedParts = [];

		function updateParts(list, op) {
			newState.parts = newState.parts.map((p) => {
				list.forEach((element) => {
					if (p.id === element.id) op(p, element);
				});
				return p;
			});
		}

		/**
		 * API для управления частями.
		 * @typedef {Object} PartsAPI
		 * @property {(type: string|object) => Part} addPart Добавляет новую деталь, делает её выбранной и возвращает её.
		 * @property {(prop: number|Part|string) => void} selectPart Выбирает часть по ID.
		 * @property {() => void} commit Применяет все изменения в состояние.
		 */

		/** @type {PartsAPI} */
		const api = {
			restart: () => set(basePartsAtom, initialState),
			loadCraft: () => set(basePartsAtom, loadPartsFromStorage()),
			saveCraft: () => localStorage.setItem("craftParts", JSON.stringify(newState.parts)),
			addPart: (prop) => {
				const parts = newState.parts;
				const newID = Math.max(-1, ...parts.map((p) => p.id)) + 1; // Генерируем уникальный ID
				let parameters = {};
				if (typeof prop === "string") {
					parameters = {
						id: newID,
						partType: prop,
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
			selectPart: (prop) => {
				if (typeof prop === "string") {
					const selectedPart = newState.parts.find((p) => p.editor.objectName === prop) || null;
					newState.selectedPart = selectedPart;
				} else if (prop instanceof Part) {
					newState.selectedPart = prop;
				} else if (typeof prop === "number") {
					const selectedPart = newState.parts.find((p) => p.id === prop) || null;
					newState.selectedPart = selectedPart;
				} else {
					newState.selectedPart = null;
				}
			},
			updPartProperties: (id, properties) => {
				let updatedPart = null;
				newState.parts = newState.parts.map((part) => {
					if (part.id === id) {
						return part;
					}
					return part;
				});
				updatedParts.push(updatedPart);
				return updatedPart;
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
				newState.parts = newState.parts.map((p) => {
					if (p.id === firstPartID) p.editor.attachedParts.push(firstStatePartAttachedParts);
					if (p.id === secondPartID) p.editor.attachedToParts.push(secondStatePartAttachedToParts);
					return p;
				});
			},
			disconnectPart: (part) => {
				const list = part.editor.attachedToParts;
				newState.parts = newState.parts.map((p) => {
					list.forEach((element, index) => {
						if (p.id === element.id) p.removeAttachedPartByID(part.id);
					});
					if (p.id === part.id) p.clearAttachedToParts();
					return p;
				});
			},
			translateParts: (list) => {
				updateParts(list, (p, element) => {
					p.position = p.position.map((v, i) => v + element.posDelta[i]);
				});
			},
			rotateParts: (list) => {
				updateParts(list, (p, element) => {
					p.rotation = [p.rotation[0] + element.rotDelta[0], p.rotation[1] + element.rotDelta[1], p.rotation[2] + element.rotDelta[2]];
				});
			},
			updShapeCenter: (id, newProperties) => {
				newState.parts = newState.parts.map((p) => {
					if (p.id === id) p.updateFuselageProperties(newProperties);
					return p;
				});
			},
			updPartsSegmentNameProps: (list) => {
				updateParts(list, (p, element) => {
					p.updateSegmentProperties(element.segmentName, element.newProperties);
				});
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
