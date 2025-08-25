//import { DragControls } from "three/examples/jsm/Addons.js";
import { DragControls } from "../utils/MyDragControls.js";
import { onDragStart, onDrag, onDragEnd, onClick } from "../utils/DragEvents.js";

export const initDragControls = (objects, threeStuff, setPartsStorage) => {
	const [camera, domElement, orbit] = threeStuff;
	const controls = new DragControls(objects, camera, domElement);

	controls.transformGroup = true;
	controls.mouseButtons = {
		LEFT: 1,
		RIGHT: 1,
	};
	controls.addEventListener("click", (e) => onClick(e, setPartsStorage));
	controls.addEventListener("dragstart", (e) => onDragStart(e, orbit, setPartsStorage));
	controls.addEventListener("drag", onDrag);
	controls.addEventListener("dragend", (e) => onDragEnd(e, orbit, setPartsStorage));
	return controls;
};
