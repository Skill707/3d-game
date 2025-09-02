import { Billboard, Sparkles, Text } from "@react-three/drei";
import { ShapedPart } from "../components/ShapedForm/ShapedPart";

const segmentShapeRegistry = {
	rectangle: { pointsCount: 4, corners: [0, 0, 0, 0] },
	circle8: { pointsCount: 8, corners: [100, 100, 100, 100] },
	circle16: { pointsCount: 16, corners: [100, 100, 100, 100] },
	circle32: { pointsCount: 32, corners: [100, 100, 100, 100] },
	airfoil: { pointsCount: 32, corners: [100, 100, 100, 100], width: 2, height: 0.5 },
};
export class Segment {
	constructor(parameters) {
		let shape = segmentShapeRegistry[parameters.shapeName];
		this.name = parameters.pos[2] > 0 ? "front" : "back";
		this.pos = parameters.pos;
		this.width = shape.width || 2;
		this.height = shape.height || 2;
		this.closed = parameters.closed || false;
		this.pointsCount = shape.pointsCount;
		this.extendeble = true;
		this.corners = shape.corners.reduce((sum, val) => sum + val, 0) / shape.corners.length;
		this.corner1 = shape.corners[0];
		this.corner2 = shape.corners[1];
		this.corner3 = shape.corners[2];
		this.corner4 = shape.corners[3];
		this.pinchX = 0;
		this.pinchY = 0;
		this.slant = 0;
		this.angle = 0;
		this.clamp1 = 0;
		this.clamp2 = 0;
		this.clamp3 = 0;
		this.clamp4 = 0;
		this.points = generatePoints(this);
	}
}

export class shapeSegments {
	constructor(parameters) {
		this.front = new Segment({ shapeName: parameters.shapeName, pos: [0, 0, parameters.length/2 || 1], closed: parameters.closed });
		this.back = new Segment({ shapeName: parameters.shapeName, pos: [0, 0, -parameters.length/2 || -1], closed: parameters.closed });
		this.center = { length: parameters.length || 2, xOffset: 0, zOffset: 0, pinchX: 0, pinchY: 0, angle: 0 };
		this.doubleSided = parameters.doubleSided || false;
	}
}

// Регистрируем все доступные детали здесь

const blockShape = new shapeSegments({
	shapeName: "rectangle",
	closed: true,
});

const fuselageShape = new shapeSegments({
	shapeName: "circle16",
	closed: false,
	doubleSided: true,
});

const fueltankShape = new shapeSegments({
	shapeName: "circle32",
	closed: true,
});

const wingShape = new shapeSegments({
	shapeName: "airfoil",
	closed: true,
});

// eslint-disable-next-line react-refresh/only-export-components
export const shapeRegistry = {
	fueltank: fueltankShape,
	block: blockShape,
	fuselage: fuselageShape,
	wing: wingShape,
};

export class Part {
	constructor(parameters) {
		this.id = parameters.id;
		this.name = parameters.type.charAt(0).toUpperCase() + parameters.type.slice(1);
		this.type = parameters.type;
		this.pos = parameters.pos || [0, 0, 0];
		this.rot = parameters.rot || [0, 0, 0];
		this.mass = parameters.mass || 1;
		this.color = parameters.color || "gray";
		this.attachedParts = parameters.attachedParts || [];
		this.attachedToParts = parameters.attachedToParts || [];
		this.shapeSegments = parameters.shapeSegments || shapeRegistry[parameters.type] || null;
		this.drag = false;
		this.objectName = parameters.objectName || "dragPart" + parameters.id;
		this.root = parameters.root || false;
	}
}

export const CreatePart = ({ part, selected = false }) => {
	return (
		<group name={part.objectName} position={part.pos} rotation={part.rot} userData={part}>
			{selected && <Sparkles scale={[5]} size={5} castShadow />}
			<ShapedPart part={part} selected={selected} />

			<Text name="text" position={[0, 2, 0]} fontSize={0.2} color="white" anchorX="center" anchorY="middle">
				{part.objectName + "|" + " [" + part.attachedParts.map((ap) => ap.id) + "]" + " to [" + part.attachedToParts.map((ap) => ap.id) + "]\n"}
			</Text>
		</group>
	);
};

const rad2deg = (value) => value * (180 / Math.PI);

// eslint-disable-next-line react-refresh/only-export-components
export function generatePoints(segment) {
	let { pointsCount, width, height, pinchX, pinchY, slant, angle } = segment;
	const corners = [segment.corner1, segment.corner2, segment.corner3, segment.corner4].map((c) => c / 100);
	const clapms = [segment.clamp1, segment.clamp2, segment.clamp3, segment.clamp4].map((c) => c / 100);
	const center = [0, 0, 0];
	const [cx, cy, cz] = center;
	const w = width || 2;
	const h = height || 2;
	const aspectRatio = w / h;

	pinchY *= 0.01;
	pinchX *= 0.01;
	slant *= 0.01;
	angle *= 0.01;

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
