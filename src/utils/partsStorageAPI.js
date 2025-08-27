import { Object3D } from "three";
import { Part } from "./partFactory";
import { clonePosWithOffset } from "./transformUtils";

function updatePartProperties(part, properties) {
	return { ...part, ...properties };
}

export default function (partsStorage, setPartsStorage) {
	let draft = null;
	let returnChanges = [];

	function initDraft(prev) {
		draft = structuredClone(partsStorage);
		return draft;
	}

	function updatePartsOne(id, properties) {
		let updatedPart = null;
		const updatedPartsList = draft.parts.map((part) => {
			updatedPart = updatePartProperties(part, properties);
			if (part.id === id) return updatedPart;
			return part;
		});
		draft.parts = updatedPartsList;
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
		const updatedPartsList = draft.parts.map((part) => {
			for (let index = 0; index < list.length; index++) {
				const element = list[index];
				const updatedPart = updatePartProperties(part, element.properties);
				updatedParts[index] = updatedPart;
				if (part.id === element.id) return updatedPart;
				return part;
			}
		});
		draft.parts = updatedPartsList;
		return updatedParts;
	}

	const api = {
		/**
		 * Загружает текущее состояние в draft.
		 * @returns {object} api - для цепочки вызовов
		 */
		start() {
			initDraft();
			returnChanges = [];
			return api;
		},
		/**
		 * Добавляет новую деталь в draft.
		 * @param {string} type - имя детали (ключ из shapeRegistry)
		 * @returns {object} api - для цепочки вызовов
		 */
		addPart: (type) => {
			let newPart = null;
			const parts = draft.parts;
			const newID = Math.max(0, ...parts.map((p) => p.id)) + 1; // Генерируем уникальный ID
			newPart = new Part({
				id: newID,
				name: type,
			});
			parts.push(newPart);
			draft.selectedPart = newPart;
			returnChanges.push(newPart);
			return api;
		},
		/**
		 * Обновляет трансформации всех деталей в draft.
		 * @param {string} objectName - объект
		 * @returns {object} api - для цепочки вызовов
		 */
		selectPart: (objectName) => {
			const selectedPart = draft.parts.find((p) => p.objectName === objectName) || null;
			draft.selectedPart = selectedPart;
			returnChanges.push(selectedPart);
			return api;
		},
		/**
		 * Обновляет трансформации всех деталей в draft.
		 * @param {Object3D} Object3D - объект
		 * @returns {object} api - для цепочки вызовов
		 */
		saveTransformation: (object3D) => {
			const updatedPart = updatePartsOne(object3D.userData.id, {
				drag: false,
				pos: [object3D.position.x, object3D.position.y, object3D.position.z],
				rot: [object3D.rotation.x, object3D.rotation.y, object3D.rotation.z],
			});
			draft.selectedPart = updatedPart;
			returnChanges.push(updatedPart);
			return api;
		},
		/**
		 * Обновляет трансформации всех деталей в draft.
		 * @param {Object3D} Object3D - объект
		 * @returns {object} api - для цепочки вызовов
		 */
		changePartsProperties: (list) => {
			const updatedParts = updatePartsList(list);
			returnChanges.push(updatedParts);
			return api;
		},
		/**
		 * Обновляет трансформации всех деталей в draft.
		 * @param {Part} part - деталь
		 * @param {Object3D[]} - объекты со сцены
		 * @returns {object} api - для цепочки вызовов
		 */
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
		/**
		 * Сохраняет draft в jotai-состояние и очищает его.
		 * @returns {object|null} новое состояние после всех изменений
		 */
		commit() {
			if (draft) {
				setPartsStorage(draft);
				draft = null;
			}
			return returnChanges;
		},
	};
	return api;
}
