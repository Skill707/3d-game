import { Segment } from "../ShapedForm/Segment";
import { ConnectingSurface } from "../ShapedForm/ConnectingSurface";
import { useMemo } from "react";
import * as THREE from "three";
export function ShapedPart({ part, selected }) {
	const material = useMemo(() => new THREE.MeshStandardMaterial({ color: selected ? "orange" : part.color, side: THREE.DoubleSide }), [selected, part.color]);
	const segments = part.shapeSegments;
	const centerHeight = (part.shapeSegments.front.height + part.shapeSegments.back.height) / 4;
	return (
		<>
			<Segment segment={segments.front} material={material} />
			<Segment segment={segments.back} material={material} />
			<ConnectingSurface segmentA={segments.front} segmentB={segments.back} material={material} part={part} />
			{part.selected && (
				<>
					{segments.front.extendeble && <AddButton position={segments.front.pos} name={"+"} />}
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

function AddButton({ position = [0, 0, 0], name }) {
	return (
		<group position={position}>
			<mesh>
				<boxGeometry args={[0.5, 0.5, 0.05]} />
				<meshBasicMaterial color="green" />
			</mesh>
		</group>
	);
}
