import { Billboard, Text } from "@react-three/drei";
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
		this.front = new Segment({ shapeName: parameters.shapeName, pos: [0, 0, parameters.length || 1], closed: parameters.closed });
		this.back = new Segment({ shapeName: parameters.shapeName, pos: [0, 0, -parameters.length || -1], closed: parameters.closed });
		this.center = { length: parameters.length || 2, xOffset: 0, zOffset: 0, pinchX: 0, pinchY: 0 };
	}
}

// Регистрируем все доступные детали здесь

const blockShape = new shapeSegments({
	shapeName: "rectangle",
	length: 1,
	closed: true,
});

const fuselageShape = new shapeSegments({
	shapeName: "circle16",
	closed: false,
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
		this.name = parameters.name;
		this.pos = parameters.pos || [0, 0, 0];
		this.rot = parameters.rot || [0, 0, 0];
		this.mass = parameters.mass || 1;
		this.color = parameters.color || "gray";
		this.attachedParts = parameters.attachedParts || [];
		this.attachedToPart = parameters.attachedToPart || null;
		this.shapeSegments = parameters.shapeSegments || shapeRegistry[parameters.name] || null;
		this.drag = false;
		this.objectName = parameters.objectName || "dragPart" + parameters.id;
		this.root = false;
	}
}

export const CreatePart = ({ part, selected = false }) => {
	return (
		<group name={part.objectName} position={part.pos} rotation={part.rot} userData={part}>
			<ShapedPart part={part} selected={selected} />
			<Billboard
				follow={true}
				lockX={false}
				lockY={false}
				lockZ={false} // Lock the rotation on the z axis (default=false)
			>
				<Text name="text" position={[0, 2, 0]} fontSize={0.2} color="white" anchorX="center" anchorY="middle">
					{part.objectName +
						"|" +
						" [" +
						part.attachedParts.map((ap) => ap.name + ap.id) +
						"]" +
						" (" +
						(part.attachedToPart?.name + part.attachedToPart?.id) +
						")\n" +
						part.rot.map((r) => (r * 57.2958).toFixed(2))}
				</Text>
			</Billboard>
		</group>
	);
};

// eslint-disable-next-line react-refresh/only-export-components
export function generatePoints(segment) {
	let { pointsCount, width, height, pinchX, pinchY, slant, angle } = segment;
	const corners = [segment.corner1, segment.corner2, segment.corner3, segment.corner4].map((c) => c / 100);
	const clapms = [segment.clamp1, segment.clamp2, segment.clamp3, segment.clamp4].map((c) => c / 100);
	const center = [0, 0, 0];
	const [cx, cy, cz] = center;
	const w = width || 2;
	const h = height || 2;
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
		const scaleX = w / 2 - y * pinchX;

		//const addZ = -y * slant;

		return [x * scaleX, y, z];
	});

	points = points.map(([x, y, z]) => {
		const scaleY = h / 2 - x * pinchY;

		return [x, y * scaleY, z];
	});

	points = points.map(([x, y, z]) => {
		const addZ = -y * slant;
		return [x, y, z + addZ];
	});

	points = points.map(([x, y, z]) => {
		y += Math.cos(Math.abs(x) * 2) * angle;
		//Math.cos(Math.abs(x)*2)
		return [x, y, z];
	});

	points = points.map(([x, y, z]) => {
		y = Math.min(y, (h / 2) * (1 - clapms[0]));
		y = Math.max(y, (-h / 2) * (1 - clapms[1]));
		x = Math.min(x, (w / 2) * (1 - clapms[2]));
		x = Math.max(x, (-w / 2) * (1 - clapms[3]));
		return [x, y, z];
	});

	return points;
}
