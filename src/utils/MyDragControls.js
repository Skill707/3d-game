import { Controls, Matrix4, Plane, Raycaster, Vector2, Vector3, MOUSE, TOUCH } from "three";
import { Part } from "./partFactory";

const _plane = new Plane();

const _pointer = new Vector2();
const _offset = new Vector3();
const _diff = new Vector2();
const _previousPointer = new Vector2();
const _intersection = new Vector3();
const _worldPosition = new Vector3();
const _inverseMatrix = new Matrix4();
let _drag = false;
let _button = -1;
let _hits = [];

const _up = new Vector3();
const _right = new Vector3();

let _hovered = null;
const _intersections = [];

class DragControls extends Controls {
	/**
	 * Constructs a new controls instance.
	 *
	 * @param {Array<Object3D>} objects - An array of draggable 3D objects.
	 * @param {Camera} camera - The camera of the rendered scene.
	 * @param {?HTMLDOMElement} [domElement=null] - The HTML DOM element used for event listeners.
	 */
	constructor(objects, camera, domElement = null) {
		super(camera, domElement);

		/**
		 * An array of draggable 3D objects.
		 *
		 * @type {Array<Object3D>}
		 */
		this.objects = objects;

		/**
		 * The raycaster used for detecting 3D objects.
		 *
		 * @type {Raycaster}
		 */
		this.raycaster = new Raycaster();

		// interaction

		this.mouseButtons = { LEFT: MOUSE.PAN, MIDDLE: MOUSE.PAN, RIGHT: MOUSE.ROTATE };
		this.touches = { ONE: TOUCH.PAN };

		// event listeners

		this._onPointerMove = onPointerMove.bind(this);
		this._onPointerDown = onPointerDown.bind(this);
		this._onPointerCancel = onPointerCancel.bind(this);
		this._onContextMenu = onContextMenu.bind(this);

		this.selected = null;
		this.enabled = true;
		this._raycast = raycast.bind(this);

		//

		if (domElement !== null) {
			this.connect(domElement);
		}
	}

	connect(element) {
		super.connect(element);

		this.domElement.addEventListener("pointermove", this._onPointerMove);
		this.domElement.addEventListener("pointerdown", this._onPointerDown);
		this.domElement.addEventListener("pointerup", this._onPointerCancel);
		this.domElement.addEventListener("pointerleave", this._onPointerCancel);
		this.domElement.addEventListener("contextmenu", this._onContextMenu);

		this.domElement.style.touchAction = "none"; // disable touch scroll
	}

	disconnect() {
		this.domElement.removeEventListener("pointermove", this._onPointerMove);
		this.domElement.removeEventListener("pointerdown", this._onPointerDown);
		this.domElement.removeEventListener("pointerup", this._onPointerCancel);
		this.domElement.removeEventListener("pointerleave", this._onPointerCancel);
		this.domElement.removeEventListener("contextmenu", this._onContextMenu);

		this.domElement.style.touchAction = "auto";
		this.domElement.style.cursor = "";
	}

	dispose() {
		this.disconnect();
	}

	_updatePointer(event) {
		const rect = this.domElement.getBoundingClientRect();

		_pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
		_pointer.y = (-(event.clientY - rect.top) / rect.height) * 2 + 1;
	}

	_updateState(event) {
		// determine action

		let action;

		if (event.pointerType === "touch") {
			action = this.touches.ONE;
		} else {
			switch (event.button) {
				case 0:
					action = this.mouseButtons.LEFT;
					break;

				case 1:
					action = this.mouseButtons.MIDDLE;
					break;

				case 2:
					action = this.mouseButtons.RIGHT;
					break;

				default:
					action = null;
			}
		}

		// determine state
	}
}

function raycast() {
	const intersections = [];
	this.raycaster.setFromCamera(_pointer, this.object);
	let objects = this.objects;

	objects = objects.filter((o) => o !== this.selected);

	objects = objects.filter((o) => {
		if (this.selected) {
			const part = this.selected.userData instanceof Part && this.selected.userData;
			const find = part.attachedParts.find((ap) => ap.id === o.userData.id);
			return find === undefined;
		}
		return true;
	});
	this.raycaster.intersectObjects(objects, true, intersections);
	const hits = intersections.filter((i) => i.object.name.includes("front") || i.object.name.includes("rear") || i.object.name.includes("side"));
	return hits;
}

function onPointerMove(event) {
	const camera = this.object;
	const domElement = this.domElement;
	const raycaster = this.raycaster;

	if (this.enabled === false) return;

	this._updatePointer(event);

	raycaster.setFromCamera(_pointer, camera);

	if (this.selected) {
		if (raycaster.ray.intersectPlane(_plane, _intersection)) {
			this.selected.position.copy(_intersection.sub(_offset).applyMatrix4(_inverseMatrix));
		}

		_hits = this._raycast();
		domElement.style.cursor = "move";
		if (_drag === false) {
			_drag = true;
			this.dispatchEvent({ type: "dragstart", object: this.selected, button: _button });
		}
		this.dispatchEvent({ type: "drag", object: this.selected, objects: this.objects, hit: _hits[0] ?? null });

		_previousPointer.copy(_pointer);
	} else {
		// hover support

		if (event.pointerType === "mouse" || event.pointerType === "pen") {
			_hits = this._raycast();
			if (_hits.length > 0) {
				const object = _hits[0].object;

				_plane.setFromNormalAndCoplanarPoint(camera.getWorldDirection(_plane.normal), _worldPosition.setFromMatrixPosition(object.matrixWorld));

				if (_hovered !== object && _hovered !== null) {
					this.dispatchEvent({ type: "hoveroff", object: _hovered });

					domElement.style.cursor = "auto";
					_hovered = null;
				}

				if (_hovered !== object) {
					this.dispatchEvent({ type: "hoveron", object: object });

					domElement.style.cursor = "pointer";
					_hovered = object;
				}
			} else {
				if (_hovered !== null) {
					this.dispatchEvent({ type: "hoveroff", object: _hovered });

					domElement.style.cursor = "auto";
					_hovered = null;
				}
			}
		}
	}

	_previousPointer.copy(_pointer);
}

function onPointerDown(event) {
	const camera = this.object;
	const domElement = this.domElement;
	const raycaster = this.raycaster;

	if (this.enabled === false) return;

	this._updatePointer(event);
	this._updateState(event);

	_hits = this._raycast();
	if (_hits.length > 0) {
		this.selected = findGroup(_hits[0].object);
		_plane.setFromNormalAndCoplanarPoint(camera.getWorldDirection(_plane.normal), _worldPosition.setFromMatrixPosition(this.selected.matrixWorld));

		if (raycaster.ray.intersectPlane(_plane, _intersection)) {
			_inverseMatrix.copy(this.selected.parent.matrixWorld).invert();
			_offset.copy(_intersection).sub(_worldPosition.setFromMatrixPosition(this.selected.matrixWorld));
		}

		//this.dispatchEvent({ type: "click", object: this.selected, button: event.button });

		_button = event.button;
	}

	_previousPointer.copy(_pointer);
}

function onPointerCancel() {
	if (this.enabled === false) return;

	if (this.selected) {
		const destroy = () => {
			this.disconnect();
			this.enabled = false;
		};
		if (_drag === true) {
			_drag = false;
			this.dispatchEvent({ type: "dragend", object: this.selected, objects: this.objects, lastHit: _hits[0] ?? null, destroy: destroy });
		}
		this.selected = null;
	}

	this.domElement.style.cursor = _hovered ? "pointer" : "auto";
}

function onContextMenu(event) {
	if (this.enabled === false) return;

	event.preventDefault();
}

function findGroup(obj, group = null) {
	if (obj.isGroup) group = obj;

	if (obj.parent === null || obj.parent.name === "craft") return group;

	return findGroup(obj.parent, group);
}

/**
 * Fires when the user drags a 3D object.
 *
 * @event DragControls#drag
 * @type {Object}
 */

/**
 * Fires when the user has finished dragging a 3D object.
 *
 * @event DragControls#dragend
 * @type {Object}
 */

/**
 * Fires when the pointer is moved onto a 3D object, or onto one of its children.
 *
 * @event DragControls#hoveron
 * @type {Object}
 */

/**
 * Fires when the pointer is moved out of a 3D object.
 *
 * @event DragControls#hoveroff
 * @type {Object}
 */

export { DragControls };
