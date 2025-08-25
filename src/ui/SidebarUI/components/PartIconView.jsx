import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { CreatePart, Part } from "../../../utils/partFactory";
import { useEffect, useState } from "react";

export function PartIconView({ partName, size = 64 }) {
	const [frameloop, SetFrameloop] = useState("always");
	useEffect(() => {
		//SetFrameloop("never");
	}, []);
	return (
		<div style={{ width: size, height: size }}>
			<Canvas
				// orthographic
				camera={{ position: [2, 2, 2] }}
				frameloop={frameloop}
				gl={()=>{
					
				}}
			>
				<OrbitControls />
				<ambientLight intensity={1} />
				<directionalLight position={[20, 20, 20]} intensity={0.8} />
				<CreatePart
					part={
						new Part({
							id: "view",
							name: partName,
						})
					}
				/>
			</Canvas>
		</div>
	);
}
