import { Billboard, Sparkles, Text } from "@react-three/drei";
import { FuselageModel } from "../components/Fuselage";
import { Cockpit } from "../components/Cockpit";

// eslint-disable-next-line react-refresh/only-export-components
export const partTypeRegistry = {
	fuselage: {},
	engine: {},
};

export class Part {
	constructor(parameters) {
		this.id = parameters.id;
		this.name = parameters.partType.charAt(0).toUpperCase() + parameters.partType.slice(1);
		this.partType = parameters.partType;
		this.position = parameters.position || [0, 0, 0];
		this.rotation = parameters.rotation || [0, 0, 0];
		this.materials = parameters.materials || [0];
		this.health = parameters.health || 1;
		this.calculateDrag = parameters.calculateDrag || true;
		this.partCollisionResponse = parameters.partCollisionResponse || true;
		this.editor = new Editor(parameters);
		if (parameters.partType === "fuselage") {
			this.fuselage = new Fuselage(parameters.fuselage || {});
		}
		if (parameters.partType === "engine") {
			this.engine = new Engine(parameters.engine || {});
		}
		this.clearAttachedToParts = () => {
			this.editor.attachedToParts = [];
		};
		this.removeAttachedPartByID = (id) => {
			this.editor.attachedParts = this.editor.attachedParts.filter((ap) => ap.id !== id);
		};

		this.updateSegmentProperties = (segmentName, newProps) => {
			if (segmentName === "front" || segmentName === "rear") {
				let segment = this.fuselage[segmentName];
				const newSegment = new Segment({ ...segment, ...newProps });
				this.fuselage[segmentName] = newSegment;
			}
		};

		this.updateFuselageProperties = (newProps) => {
			const newFuselage = new Fuselage({ ...this.fuselage, ...newProps });
			this.fuselage = newFuselage;
		};
	}

	get attachedParts() {
		return this.editor.attachedParts;
	}

	get attachedToParts() {
		return this.editor.attachedToParts;
	}

	set setFrontPinchX(a) {
		this.fuselage.front.pinchX = a;
	}
}

class Editor {
	constructor(parameters) {
		this.root = parameters.root || false;
		this.drag = false;
		this.objectName = parameters.objectName || "dragPart" + parameters.id;
		this.attachedParts = parameters.attachedParts || [];
		this.attachedToParts = parameters.attachedToParts || [];
	}
}

class Segment {
	#points;
	constructor(parameters) {
		this.scale = parameters.scale || [2, 2];
		this.pointsCount = parameters.pointsCount || 32;
		this.corners = parameters.corners || [1, 1, 1, 1];
		this.pinchX = parameters.pinchX || 0;
		this.pinchY = parameters.pinchY || 0;
		this.slant = parameters.slant || 0;
		this.angle = parameters.angle || 0;
		this.clamps = parameters.clamps || [0, 0, 0, 0];
		this.#points = this.generatePoints();
	}

	generatePoints() {
		let { pointsCount, scale, pinchX, pinchY, slant, angle, corners, clapms } = this;
		const center = [0, 0, 0];
		const [cx, cy, cz] = center;
		const w = scale[0] || 2;
		const h = scale[1] || 2;

		// углы ограничиваем половиной сторон
		const [rw1, rw2, rw3, rw4] = corners.map((r) => (r * w) / 2);
		const [rh1, rh2, rh3, rh4] = corners.map((r) => (r * h) / 2);

		const rawPoints = [];
		const cornerSegments = Math.floor(pointsCount / 4);

		// центры дуг для каждого угла
		const cornersCenters = [
			[cx + w / 2 - rw1, cy + h / 2 - rh1, rw1, rh1, 0], // top-right
			[cx - w / 2 + rw2, cy + h / 2 - rh2, rw2, rh2, Math.PI / 2], // top-left
			[cx - w / 2 + rw3, cy - h / 2 + rh3, rw3, rh3, Math.PI], // bottom-left
			[cx + w / 2 - rw4, cy - h / 2 + rh4, rw4, rh4, (3 * Math.PI) / 2], // bottom-right
		];

		for (let c = 0; c < 4; c++) {
			const [cxCorner, cyCorner, rw, rh, startAngle] = cornersCenters[c];
			if (rw === 0 || rh === 0) {
				// прямой угол
				rawPoints.push([cxCorner, cyCorner, cz]);
			} else {
				// дуга
				for (let i = 0; i <= cornerSegments; i++) {
					const a = startAngle + (i / cornerSegments) * (Math.PI / 2);
					rawPoints.push([cxCorner + Math.cos(a) * rw, cyCorner + Math.sin(a) * rh, cz]);
				}
			}
		}

		let points = rawPoints.map(([x, y, z]) => {
			let t;
			if (pinchX >= 0) t = (y + h / 2) / h;
			else t = (h / 2 - y) / h;
			let scaleX = 1 - t * Math.abs(pinchX);
			return [x * scaleX, y, z];
		});

		points = points.map(([x, y, z]) => {
			let t;
			if (pinchY >= 0) t = (x + w / 2) / w;
			else t = (w / 2 - x) / w;
			let scaleY = 1 - t * Math.abs(pinchY);
			return [x, y * scaleY, z];
		});

		points = points.map(([x, y, z]) => {
			let t = Math.abs(x / w);
			y += Math.cos((t * h * Math.PI) / 2) * angle;
			return [x, y, z];
		});

		/*points = points.map(([x, y, z]) => {
		y = Math.min(y, (h / 2) * (1 - clapms[2]));
		y = Math.max(y, (-h / 2) * (1 - clapms[3]));
		x = Math.min(x, (w / 2) * (1 - clapms[0]));
		x = Math.max(x, (-w / 2) * (1 - clapms[1]));
		return [x, y, z];
	});*/

		const deg2rad = (value) => (value * Math.PI) / 180;

		points = points.map(([x, y, z]) => {
			const addZ = -y * Math.sin(deg2rad(slant * 45));
			return [x, y * Math.cos(deg2rad(slant * 45)), z + addZ];
		});

		return points;
	}

	get cornersAvg() {
		return this.corners.reduce((sum, val) => sum + val, 0) / 4;
	}

	get points() {
		return this.#points;
	}
}

class Fuselage {
	constructor(parameters) {
		this.version = parameters.version || 1;
		this.front = new Segment(parameters.front || {});
		this.rear = new Segment(parameters.rear || {});
		this.offset = parameters.offset || [0, 0, 2];
		this.deadWeight = parameters.deadWeight || 0;
		this.closed = parameters.closed || false;
		this.doubleSided = parameters.doubleSided || false;
	}

	get frontHeight() {
		return this.front.scale[1];
	}

	get frontWidth() {
		return this.front.scale[0];
	}

	get rearHeight() {
		return this.rear.scale[1];
	}

	get rearWidth() {
		return this.rear.scale[0];
	}

	get frontSegmentPos() {
		const fuselageXOffset = this.offset[0];
		const fuselageZOffset = this.offset[1];
		const fuselageLength = this.offset[2];
		return [fuselageXOffset / 2, fuselageZOffset / 2, fuselageLength / 2];
	}

	get rearSegmentPos() {
		const fuselageXOffset = this.offset[0];
		const fuselageZOffset = this.offset[1];
		const fuselageLength = this.offset[2];
		return [-fuselageXOffset / 2, -fuselageZOffset / 2, -fuselageLength / 2];
	}

	get pinchXAvg() {
		return (this.front.pinchX + this.rear.pinchX) / 2;
	}

	get pinchYAvg() {
		return (this.front.pinchY + this.rear.pinchY) / 2;
	}

	get angleAvg() {
		return (this.front.angle + this.rear.angle) / 2;
	}
}

class FuelTank {
	constructor(parameters) {
		this.fuel = parameters.fuel;
		this.capacity = parameters.capacity;
	}
}

class Wing {
	constructor(parameters) {
		this.angleOfAttack = 0;
		this.airfoil = "";
		this.inverted = false;
		this.wingPhysicsEnabled = true;
	}
}

class ControlSurface {
	constructor(parameters) {
		this.input = 0;
		this.invert = false;
		this.maxDeflectionDegree = false;
	}
}

class Engine {
	constructor(parameters) {
		this.powerMultiplier = parameters.powerMultiplier;
		this.throttleResponse = parameters.throttleResponse;
		this.model = "";
	}
}

class Variables {
	constructor(parameters) {}
}

class Inputs {
	constructor(parameters) {
		this.input = parameters.input;
		this.max = parameters.max;
		this.min = parameters.min;
		this.invert = parameters.invert;
		this.activationGroup = parameters.activationGroup;
	}
}

export const CreatePart = ({ part, selected = false, editor }) => {
	return (
		<group name={part.editor.objectName} position={part.position} rotation={part.rotation} userData={part}>
			{part.fuselage && <FuselageModel fuselage={part.fuselage} color={"white"} selected={selected} editor={editor} />}

			{editor && (
				<Text name="text" position={[0, 2, 0]} fontSize={0.2} color="white" anchorX="center" anchorY="middle">
					{part.editor.objectName +
						"|" +
						" [" +
						part.editor.attachedParts.map((ap) => ap.id) +
						"]" +
						" to [" +
						part.editor.attachedToParts.map((ap) => ap.id) +
						"]\n"}
				</Text>
			)}
		</group>
	);
};
