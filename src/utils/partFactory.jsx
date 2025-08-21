import { Text, Billboard } from "@react-three/drei";
import { ShapedPart } from "../components/ShapedForm/ShapedPart";

// Регистрируем все доступные детали здесь

const blockShape = {
	segments: [
		{
			points: [
				[-0.5, 0.5, 0],
				[0.5, 0.5, 0],
				[0.5, -0.5, 0],
				[-0.5, -0.5, 0],
			],
			pos: [0, 0, -0.5],
			radius: 0.5,
			closed: true,
		},
		{
			points: [
				[-0.5, 0.5, 0],
				[0.5, 0.5, 0],
				[0.5, -0.5, 0],
				[-0.5, -0.5, 0],
			],
			pos: [0, 0, 0.5],
			radius: 0.5,
			closed: true,
		},
	],
};

const fuselageShape = {
	segments: [
		{ points: generateCirclePoints([0, 0, 0], 16, 1), pos: [0, 0, -1], radius: 1, closed: false, extendeble: true },
		{ points: generateCirclePoints([0, 0, 0], 16, 1), pos: [0, 0, 1], radius: 1, closed: false },
	],
};

const fueltankShape = {
	segments: [
		{ points: generateCirclePoints([0, 0, 0], 16, 1), pos: [0, 0, -1], radius: 1, closed: true },
		{ points: generateCirclePoints([0, 0, 0], 16, 1), pos: [0, 0, 1], radius: 1, closed: true },
	],
};

const shapeRegistry = {
	fueltank: { size: [2, 2, 2], shape: fueltankShape },
	block: { size: [1, 1, 1], shape: blockShape },
	fuselage: { size: [2, 2, 2], shape: fuselageShape },
};

export class Part {
	constructor(parameters) {
		this.id = parameters.id;
		this.name = parameters.name;
		this.pos = parameters.pos || [0, 0, 0];
		this.rot = parameters.rot || [0, 0, 0];
		this.size = parameters.size || shapeRegistry[parameters.name].size;
		this.mass = parameters.mass || 1;
		this.color = parameters.color || "gray";
		this.selected = parameters.selected || true;
		this.attachedPartIDs = parameters.attachedPartIDs || {
			front: [],
			back: [],
			side: [],
		};
		this.shape = shapeRegistry[parameters.name].shape || null;
		this.drag = false;
		this.objectName = "dragPart" + parameters.id;
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
				<Text name="text" position={[0, 2, 0]} fontSize={0.25} color="white" anchorX="center" anchorY="middle">
					{part.name + part.id}
				</Text>
			</Billboard>
		</group>
	);
}

function generateCirclePoints(center, count = 8, radius = 1) {
	const points = [];
	for (let i = 0; i < count; i++) {
		const angle = (i / count) * Math.PI * 2;
		points.push([center[0] + Math.cos(angle) * radius, center[1] + Math.sin(angle) * radius, center[2]]);
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

/*<DragControls
			name={part.objectName}
			matrix={matrix}
			autoTransform={false}
			onDragStart={() => {
				console.log("start ", part.name + part.id);
				if (button.current === 2) {
					handleCopyPart(part.id);
				} else if (button.current === 0) {
					handleStartDragPart(part.id);
				}
			}}
			onDrag={
				part.selected &&
				((localMat) => {
					matrix.copy(localMat);
				})
			}
			onDragEnd={() => {
				const vector3 = matrix4ToVector3(matrix);
				const euler = matrix4ToEuler(matrix);
				handleEndDragPart(part.id, vector3.toArray(), euler.toArray());
				console.log("end ", part.name + part.id);
			}}
			dragConfig={{
				pointer: {
					buttons: [0, 1, 2],
				},
			}}
		>*/
