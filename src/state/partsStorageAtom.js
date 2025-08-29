import { atom } from "jotai";
import { generatePoints, Part } from "../utils/partFactory";
import { clonePosWithOffset } from "../utils/transformUtils";

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

function updatePartProperties(part, newProperties) {
	return { ...part, ...newProperties };
}
function updateShapeSegment(shapeSegments, newSegment) {
	newSegment.points = generatePoints(newSegment);
	return { ...shapeSegments, [newSegment.name]: newSegment };
}
function updateShapeSegmentProperties(segment, newProperties) {
	return { ...segment, ...newProperties };
}

const initialState = { parts: [new Part({ id: 0, name: "fueltank", root: true })], selectedPart: null, root: true };

const basePartsAtom = atom(initialState);

export default atom(
	(get) => get(basePartsAtom),
	(get, set, tasks) => {
		let newState = structuredClone(get(basePartsAtom));
		let returnChanges = [];
		let objects = null;

		if (typeof tasks === "function") {
			//console.log("action is function");
			const newValue = tasks(newState);
			set(basePartsAtom, newValue);
			return "function";
		}

		function updatePart(id, properties) {
			let updatedPart = null;
			const updatedPartsList = newState.parts.map((part) => {
				updatedPart = updatePartProperties(part, properties);
				if (part.id === id) return updatedPart;
				return part;
			});
			newState.parts = updatedPartsList;
			return updatedPart;
		}

		const api = {
			current: () => {
				return get(basePartsAtom);
			},
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
			addPart: (type) => {
				const parts = newState.parts;
				const newID = Math.max(0, ...parts.map((p) => p.id)) + 1; // Генерируем уникальный ID
				const newPart = new Part({
					id: newID,
					name: type,
				});
				parts.push(newPart);
				newState.selectedPart = newPart;
				return newPart;
			},
			selectPart: (objectName) => {
				const selectedPart = newState.parts.find((p) => p.objectName === objectName) || null;
				newState.selectedPart = selectedPart;
				return selectedPart;
			},
			selectPartbyID: (id) => {
				const selectedPart = newState.parts.find((p) => p.id === id) || null;
				newState.selectedPart = selectedPart;
				return selectedPart;
			},
			updatePartShape: (id, newShapeSegments) => {
				const updatedPart = updatePart(id, {
					shapeSegments: newShapeSegments,
				});
				return updatedPart;
			},
			updatePartCenter: (props) => {
				const { part, newProperties } = props;
				let newShapeSegments = structuredClone(part.shapeSegments);
				const newSegment = updateShapeSegmentProperties(newShapeSegments.center, newProperties);
				newShapeSegments.center = newSegment;
				api.updatePartShape(part.id, newShapeSegments);
			},
			updatePartsSegmentProps: (list) => {
				list.forEach((part) => {
					const statePart = newState.parts.find((p) => p.id === part.id);
					const newSegment = updateShapeSegmentProperties(statePart.shapeSegments[part.segmentName], part.newProperties);
					const newShapeSegments = updateShapeSegment(statePart.shapeSegments, newSegment);
					api.updatePartShape(part.id, newShapeSegments);
				});
			},
			commit: () => {
				set(basePartsAtom, newState);
			},
		};

		for (const key in tasks) {
			if (typeof api[key] === "function") {
				const ret = api[key](tasks[key]);
				returnChanges.push(ret);
				console.log(key, "(", tasks[key], ") =>", ret);
			}
		}

		return returnChanges;
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

	saveAttached: (part) => {
				if ((part && part.attachedParts) || !objects) return api;
				const recursive = (part, objects) => {
					const id = part.id;
					const attachedParts = part.attachedParts;
					attachedParts.forEach((attach) => {
						console.log(attach);
						const selObj = objects.find((obj) => "dragPart" + id === obj.name);

						const newPos = clonePosWithOffset(selObj, attach.offset);

						const updatedPart = updatePartsOne(attach.id, {
							pos: [newPos.x, newPos.y, newPos.z],
							rot: [selObj.rotation.x, selObj.rotation.y, selObj.rotation.z],
						});
						returnChanges.push(updatedPart);
						//recursive(updatedPart, objects);
					});
				};

				return api;
			},
*/
