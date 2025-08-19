import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { CreatePart, Part } from "../../../utils/partFactory";

export function PartIconView({ partName, size = 64 }) {
	return (
		<div style={{ width: size, height: size }}>
			<Canvas
				// orthographic
				camera={{ position: [2, 2, 2] }}
			>
				<OrbitControls />
				<ambientLight intensity={0.5} />
				<directionalLight position={[2, 2, 2]} intensity={0.8} />
				<CreatePart
					part={new Part({
						id: 0,
						name: partName,
						selected: false,
					})}
				/>
			</Canvas>
		</div>
	);
}
