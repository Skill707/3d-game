import { atom } from "jotai";
import { Part } from "../utils/partFactory";

// Функция для загрузки деталей из localStorage
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
	const newPart = new Part({ id: 0, name: "fueltank", root: true });
	return { parts: [newPart], selectedPart: null };
};

const baseSettingsAtom = atom({
	activeSubToolId: "MOVE",
	move: {
		gridSize: 0.05,
		attachmentAngle: 15,
		showResizeGizmos: true,
		autoRotateParts: true,
		showAttachPoints: true,
		attachToSurfaces: true,
		autoResizeParts: true,
	},
	translate: {
		gridSize: 0.25,
		mode: "Connected",
		direction: "Local",
	},
	rotate: {
		angleStep: 15,
		mode: "Connected",
		direction: "Local",
		sensitivity: 50,
	},
	reshape: {
		gridSize: 0.25,
	},
	paint: {
		target: "Primary",
		theme: "Custom",
	},
	connections: {
		partName: "FUEL TANK #502",
		viewMode: "all",
		attachPoints: [
			{ id: 1, type: "surface", name: "Surface", connectedTo: "Fuel Tank #503 - Rotate", enabled: true },
			{ id: 2, type: "fuel", name: "Bottom", connectedTo: "Griffin Engine #501 - Top", enabled: true },
			{ id: 3, type: "fuel", name: "Top", connectedTo: "Fuel Tank #497 - Bottom", enabled: true },
			{ id: 4, type: "rotate", name: "Rotate", connectedTo: null, enabled: true },
			{ id: 5, type: "shell", name: "Top(Shell)", connectedTo: "Fuel Tank #497 - Bottom(She", enabled: true },
			{ id: 6, type: "shell", name: "Bottom(Shell)", connectedTo: "Griffin Engine #501 - Top(She", enabled: false },
		],
	},
	addParts: {
		selectedPartType: null,
		pointerOut: true,
	},
});

export const settingsAtom = atom(
	(get) => get(baseSettingsAtom),
	(get, set, update) => {
		// Если update это функция, применяем её к текущему значению
		const currentValue = get(baseSettingsAtom);
		const newValue = typeof update === "function" ? update(currentValue) : update;
		set(baseSettingsAtom, newValue);
	}
);
