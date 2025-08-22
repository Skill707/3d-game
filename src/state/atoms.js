import { atom } from "jotai";
import { Part } from "../utils/partFactory";

// Функция для загрузки деталей из localStorage
const loadPartsFromStorage = () => {
	try {
		const stored = localStorage.getItem("craftParts");
		
		if (stored && stored != undefined) {
			return JSON.parse(stored);
		}
	} catch (e) {
		console.error("Error loading parts from localStorage:", e);
	}
	return { parts: [new Part({ id: 0, name: "fueltank" })], selectedID: 0 };
};

// Базовый атом с начальным значением из localStorage
const basePartsAtom = atom(loadPartsFromStorage());

// Производный атом с автоматическим сохранением
export const partsAtom = atom(
	(get) => get(basePartsAtom),
	(get, set, update) => {
		// Если update это функция, применяем её к текущему значению
		const currentValue = get(basePartsAtom);
		const newValue = typeof update === "function" ? update(currentValue) : update;

		set(basePartsAtom, newValue);
		try {
			localStorage.setItem("craftParts", JSON.stringify(newValue));
		} catch (e) {
			console.error("Error saving parts to localStorage:", e);
		}
		console.log("partsAtom update");
	}
);
