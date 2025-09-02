import { Segment } from "../ShapedForm/Segment";
import { ConnectingSurface } from "../ShapedForm/ConnectingSurface";
import { useMemo } from "react";
import * as THREE from "three";
import { Billboard } from "@react-three/drei";
export function ShapedPart({ part, selected, editor }) {
	const segments = part.shapeSegments;

	const material = useMemo(
		() =>
			new THREE.MeshStandardMaterial({
				color: part.color,
				side: segments.doubleSided ? THREE.DoubleSide : THREE.FrontSide,
				transparent: true,
				opacity: selected ? 0.9 : 1,
			}),
		[part.color, selected, segments]
	);

	const centerHeight = (part.shapeSegments.front.height + part.shapeSegments.back.height) / 4;
	return (
		<>
			<Segment segment={segments.front} material={material} selected={selected} editor={editor} />
			<Segment segment={segments.back} material={material} selected={selected} editor={editor} />
			<ConnectingSurface segmentA={segments.front} segmentB={segments.back} material={material} part={part} selected={selected} editor={editor} />
			{selected && editor && (
				<>
					{segments.front.extendeble && <AddButton pos={segments.front.pos} rot={part.rot} name={"front"} data={segments.front} />}
					{segments.back.extendeble && <AddButton pos={segments.back.pos} rot={part.rot} name={"back"} data={segments.back} />}
					{part.drag && (
						<>
							<AttachPoint position={segments.front.pos} />
							<AttachPoint position={segments.back.pos} />
							<AttachPoint position={[0, -centerHeight, 0]} />
						</>
					)}
				</>
			)}
		</>
	);
}

export const AttachPoint = ({ position }) => {
	return (
		<mesh name="attachPoint" position={position}>
			<sphereGeometry args={[0.1, 16, 16]} />
			<meshStandardMaterial color="cyan" />
		</mesh>
	);
};

function AddButton({ pos, name, data }) {
	return (
		<Billboard position={[pos[0], pos[1], pos[2] + (name === "front" ? 0.5 : -0.5)]}>
			<mesh name={"extender"} userData={data}>
				<circleGeometry args={[0.3, 16]} />
				<meshBasicMaterial color="green" />
			</mesh>
		</Billboard>
	);
}
