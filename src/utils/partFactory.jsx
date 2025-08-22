import { Text, Billboard } from "@react-three/drei";
import { ShapedPart } from "../components/ShapedForm/ShapedPart";

// eslint-disable-next-line react-refresh/only-export-components
export const segmentPoinsRegistry = {
	rectangle: [
		[-1, 1, 0],
		[1, 1, 0],
		[1, -1, 0],
		[-1, -1, 0],
	],
	circle8: generateCirclePoints([0, 0, 0], 8),
	circle16: generateCirclePoints([0, 0, 0], 16),
	circle32: generateCirclePoints([0, 0, 0], 32),
	airfoil: generateCirclePoints([0, 0, 0], 32, [1, 0.25]),
};

export class Segment {
	constructor(parameters) {
		this.shapeName = parameters.shapeName;
		this.pos = parameters.pos;
		this.name = parameters.pos[2] > 0 ? "front" : "back";
		this.rot = parameters.rot || [0, 0, 0];
		this.size = parameters.size || [1, 1];
		this.closed = parameters.closed || true;
		this.points = parameters.points || segmentPoinsRegistry[parameters.shapeName];
		this.extendeble = true;
	}
}

// Регистрируем все доступные детали здесь

const blockShape = {
	segments: [
		new Segment({
			shapeName: "rectangle",
			pos: [0, 0, -1],
			closed: true,
		}),
		new Segment({
			shapeName: "rectangle",
			pos: [0, 0, 1],
			closed: true,
		}),
	],
};

const fuselageShape = {
	segments: [new Segment({ shapeName: "circle16", pos: [0, 0, -1], closed: false }), new Segment({ shapeName: "circle16", pos: [0, 0, 1], closed: false })],
};

const fueltankShape = {
	segments: [new Segment({ shapeName: "circle32", pos: [0, 0, -1], closed: true }), new Segment({ shapeName: "circle32", pos: [0, 0, 1], closed: true })],
};

const wingShape = {
	segments: [new Segment({ shapeName: "airfoil1", pos: [0, 0, -1], closed: true }), new Segment({ shapeName: "airfoil1", pos: [0, 0, 1], closed: true })],
};

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
		this.selected = parameters.selected || true;
		this.attachedParts = parameters.attachedParts || [];
		this.attachedToPart = parameters.attachedToPart || null;
		this.shape = shapeRegistry[parameters.name] || null;
		this.drag = false;
		this.objectName = parameters.objectName || "dragPart" + parameters.id;
	}
}

export function CreatePart({ part }) {
	//console.log("CreatePart update");

	return (
		<group name={part.objectName} position={part.pos} rotation={part.rot}>
			{part.shape && <ShapedPart part={part} />}
			<Billboard
				follow={true}
				lockX={false}
				lockY={false}
				lockZ={false} // Lock the rotation on the z axis (default=false)
			>
				<Text name="text" position={[0, 2, 0]} fontSize={0.2} color="white" anchorX="center" anchorY="middle">
					{part.id + "|" + part.objectName + " [" + part.attachedParts.map((part) => part.id) + "]" + " (" + part.attachedToPart + ")"}
				</Text>
			</Billboard>
		</group>
	);
}

function generateCirclePoints(center, count = 8, size = [1, 1]) {
	const points = [];
	for (let i = 0; i < count; i++) {
		const angle = (i / count) * Math.PI * 2;
		points.push([center[0] + Math.cos(angle) * size[0], center[1] + Math.sin(angle) * size[1], center[2]]);
	}
	return points;
}

/*
	const button = useRef(null);

onClick={(e) => {
					if (!handleClickPart) return;
					//e.stopPropagation();
					handleClickPart(part.id);
					console.log(`Part clicked: ${part.name} with ID: ${part.id}`);
				}}
			onPointerDown={(e) => {
				button.current = typeof e.button === "number" ? e.button : e.nativeEvent && e.nativeEvent.button;
			}}
			onPointerUp={(e) => {
				button.current = null;
			}}*/

/*
, handleClickPart, handleStartDragPart, handleCopyPart, handleEndDragPart 
	const euler = new THREE.Euler().fromArray(part.rot);
	const quaternion = new THREE.Quaternion().setFromEuler(euler);
	const matrix = new THREE.Matrix4().compose(new THREE.Vector3().fromArray(part.pos), quaternion, new THREE.Vector3(1, 1, 1));
*/
