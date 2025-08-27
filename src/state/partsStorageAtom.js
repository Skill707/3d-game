import { atom } from "jotai";
import { Part } from "../utils/partFactory";
import { clonePosWithOffset } from "../utils/transformUtils";

const newPart = new Part({ id: 0, name: "fueltank", root: true });
const basePartsAtom = atom({ parts: [newPart], selectedPart: null, root: true });

function updatePartProperties(part, properties) {
	return { ...part, ...properties };
}

export default atom(
	(get) => get(basePartsAtom),
	(get, set, tasks) => {
		let newState = structuredClone(get(basePartsAtom));
		let returnChanges = [];

		if (typeof tasks === "function") {
			console.log("action is function");
			const newValue = tasks(newState);
			set(basePartsAtom, newValue);
			return "function";
		}

		function updatePartsOne(id, properties) {
			let updatedPart = null;
			const updatedPartsList = newState.parts.map((part) => {
				updatedPart = updatePartProperties(part, properties);
				if (part.id === id) return updatedPart;
				return part;
			});
			newState.parts = updatedPartsList;
			return updatedPart;
		}

		/*
	const list = [].push({
		id: ,
		properties: {},
	});;
	*/
		function updatePartsList(list) {
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

		const api = {
			current: () => {
				return get(basePartsAtom);
			},
			restart: () => {
				set(basePartsAtom, { parts: [newPart], selectedPart: null, root: true });
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
			saveAttached: (part, objects) => {
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
			commit: () => {
				set(basePartsAtom, newState);
			},
		};

		for (const key in tasks) {
			if (typeof api[key] === "function") {
				const ret = api[key](tasks[key]);
				returnChanges.push(ret);
				console.log("action", key, "(", tasks[key], ") =>", ret);
			}
		}

		return returnChanges;
	}
);
