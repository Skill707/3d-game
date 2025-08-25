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
	const newPart = new Part({ id: 0, name: "fueltank", root: true });
	return { parts: [newPart], selectedPart: null };
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
		//console.log("partsAtom update");
	}
);

const loadSettingsFromStorage = () => {
	try {
		const stored = localStorage.getItem("settings");

		if (stored && stored != undefined) {
			return JSON.parse(stored);
		}
	} catch (e) {
		console.error("Error loading settings from localStorage:", e);
	}
	return {
		addParts: {
			selectedPartType: null,
			pointerOut: true,
		},
	};
};

const baseSettingsAtom = atom(loadSettingsFromStorage());

export const settingsAtom = atom(
	(get) => get(baseSettingsAtom),
	(get, set, update) => {
		// Если update это функция, применяем её к текущему значению
		const currentValue = get(baseSettingsAtom);
		const newValue = typeof update === "function" ? update(currentValue) : update;

		set(baseSettingsAtom, newValue);
		try {
			localStorage.setItem("settings", JSON.stringify(newValue));
		} catch (e) {
			console.error("Error saving settings to localStorage:", e);
		}
		//console.log("SettingsAtom update");
	}
);
