import { Canvas, useThree } from "@react-three/fiber";
import { CreatePart, Part } from "../../../utils/partFactory";
import { useEffect, useState } from "react";

function Snapshot({ partType, onRendered }) {
	const { gl } = useThree();
	
	useEffect(() => {
		// ждём кадр
		const id = requestAnimationFrame(() => {
			const url = gl.domElement.toDataURL("image/png");
			onRendered(url);
		});
		return () => cancelAnimationFrame(id);
	}, [gl, onRendered]);

	return (
		<>
			<ambientLight intensity={0.5} />
			<directionalLight position={[-20, 20, 20]} intensity={0.8} />
			<CreatePart part={new Part({ id: "view", partType: partType, color:"white" })} editor={true}/>
		</>
	);
}

export function PartIconView({ partType, size = 64 }) {
	const [img, setImg] = useState(null);
	return (
		<div style={{ width: size, height: size, userSelect: "none" }}>
			{img ? (
				<img src={img} width={size} height={size} draggable={false} />
			) : (
				<Canvas shadows frameloop="demand" camera={{ position: [1.5, 1.5, 3] }}>
					<Snapshot partType={partType} onRendered={setImg} />
				</Canvas>
			)}
		</div>
	);
}
