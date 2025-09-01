import { atom } from "jotai";

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
		selected: "#FFFFFF",
	},
	connections: {},
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
