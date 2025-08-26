import { Billboard, Text } from "@react-three/drei";
import { ShapedPart } from "../components/ShapedForm/ShapedPart";
import { PartIconView } from "../ui/SidebarUI/components/PartIconView";

const segmentShapeRegistry = {
	rectangle: { pointsCount: 4, corners: 0 },
	circle8: { pointsCount: 8, corners: 100 },
	circle16: { pointsCount: 16, corners: 100 },
	circle32: { pointsCount: 32, corners: 100 },
	airfoil: { pointsCount: 32, corners: 100, size: [2, 0.5] },
};
export class Segment {
	constructor(parameters) {
		this.name = parameters.pos[2] > 0 ? "front" : "back";
		this.pos = parameters.pos;
		this.width = 2;
		this.height = 2;
		this.closed = parameters.closed || false;
		this.pointsCount = segmentShapeRegistry[parameters.shapeName].pointsCount;
		this.points = generatePoints(
			segmentShapeRegistry[parameters.shapeName].pointsCount,
			[2, 2],
			[
				segmentShapeRegistry[parameters.shapeName].corners * 0.01,
				segmentShapeRegistry[parameters.shapeName].corners * 0.01,
				segmentShapeRegistry[parameters.shapeName].corners * 0.01,
				segmentShapeRegistry[parameters.shapeName].corners * 0.01,
			]
		);
		this.extendeble = true;
		this.corners = segmentShapeRegistry[parameters.shapeName].corners;
		this.corner1 = segmentShapeRegistry[parameters.shapeName].corner1 || segmentShapeRegistry[parameters.shapeName].corners;
		this.corner2 = segmentShapeRegistry[parameters.shapeName].corner2 || segmentShapeRegistry[parameters.shapeName].corners;
		this.corner3 = segmentShapeRegistry[parameters.shapeName].corner3 || segmentShapeRegistry[parameters.shapeName].corners;
		this.corner4 = segmentShapeRegistry[parameters.shapeName].corner4 || segmentShapeRegistry[parameters.shapeName].corners;
	}
}

export class shapeSegments {
	constructor(parameters) {
		this.front = new Segment({ shapeName: parameters.shapeName, pos: [0, 0, parameters.length || 1], closed: parameters.closed });
		this.back = new Segment({ shapeName: parameters.shapeName, pos: [0, 0, -parameters.length || -1], closed: parameters.closed });
		this.center = { length: parameters.length || 2, xOffset: 0, zOffset: 0, pinchX: 0, pinchY: 0, slantF: 0, slantB: 0, angle: 0 };
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
		this.shapeSegments = shapeRegistry[parameters.name] || null;
		this.drag = false;
		this.objectName = parameters.objectName || "dragPart" + parameters.id;
		this.root = false;
	}
}

export const CreatePart = ({ part, selected = false }) => {
	return (
		<group name={part.objectName} position={part.pos} rotation={part.rot} userData={part}>
			<ShapedPart part={part} selected={selected} />
		</group>
	);
};



// eslint-disable-next-line react-refresh/only-export-components
export function generatePoints(count = 32, size = [1, 1], corners = [0, 0, 0, 0], pinchX = 0, pinchY = 0, slant = 0, angle = 0, center = [0, 0, 0]) {
	const [w, h] = size;
	const [cx, cy, cz] = center;

	// углы ограничиваем половиной сторон
	const [rw1, rw2, rw3, rw4] = corners.map((r) => (r * w) / 2);
	const [rh1, rh2, rh3, rh4] = corners.map((r) => (r * h) / 2);

	const rawPoints = [];
	const cornerSegments = Math.floor(count / 4);

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
		if (x > w / 2) y += (x - w / 2) * angle;
		//Math.cos(Math.abs(x)*2)
		return [x, y, z];
	});

	return points;
}

/*

<Billboard
	follow={true}
	lockX={false}
	lockY={false}
	lockZ={false} // Lock the rotation on the z axis (default=false)
>
	<Text name="text" position={[0, 2, 0]} fontSize={0.2} color="white" anchorX="center" anchorY="middle">
		{part.id + "|" + " [" + part.attachedParts.map((part) => part.id) + "]" + " (" + part.attachedToPart + ")\n" + part.pos}
	</Text>
</Billboard>
*/
