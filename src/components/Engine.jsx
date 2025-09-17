import { useGLTF } from "@react-three/drei";
import GlowMesh from "./ShapedForm/GlowMesh";
import { ConvexHullCollider } from "@react-three/rapier";
import { useMemo } from "react";

export const EngineModel = ({ name, scale, color, selected, editor }) => {
	const { nodes, materials } = useGLTF("/engines.glb");

	if (name === "engine1") {
		const vertices = () => {
			if (!nodes.Engine1) return [];
			const pos = nodes.Engine1.geometry.getAttribute("position");
			return Array.from(pos.array); // Float32Array → обычный массив
		};
		return (
			<group dispose={null}>
				<mesh
					name="engine1"
					geometry={nodes.Engine1.geometry}
					material={materials["DesignerPartDisconnected(Clone) (Instance)"]}
					rotation={[Math.PI / 2, 0, 0]}
					scale={scale}
				/>
				{!editor && <ConvexHullCollider args={[vertices]} rotation={[Math.PI / 2, 0, 0]} scale={2} position={[0, 0.42, 0]} />}
				{selected && editor && <GlowMesh geometry={nodes.Engine1.geometry} rotation={[Math.PI / 2, 0, 0]} scale={scale} />}
			</group>
		);
	} else if (name === "engine2") {
			const vertices = () => {
			if (!nodes.Body_7) return [];
			const pos = nodes.Body_7.geometry.getAttribute("position");
			return Array.from(pos.array); // Float32Array → обычный массив
		};
		return (
			<group dispose={null}>
				<group rotation={[Math.PI / 2, 0, 0]} scale={scale}>
					<mesh name="engine2" geometry={nodes.Body_7.geometry} material={materials["DesignerPartSelected(Clone) (Instance)"]} />
					<mesh name="engine2" geometry={nodes.Body_7_1.geometry} material={materials["DesignerSubPartSelected(Clone) (Instance)"]} />
					{selected && editor && <GlowMesh geometry={nodes.Body_7.geometry} />}
				</group>
				{!editor && <ConvexHullCollider args={[vertices()]} rotation={[Math.PI / 2, 0, 0]} scale={scale}/>}
			</group>
		);
	} else if (name === "engine3") {
		return (
			<group dispose={null}>
				<mesh
					name="engine3"
					geometry={nodes.Engine3.geometry}
					material={materials["DesignerPartDisconnected(Clone) (Instance)"]}
					rotation={[Math.PI / 2, 0, 0]}
					scale={scale}
				/>
				{selected && editor && <GlowMesh geometry={nodes.Engine3.geometry} rotation={[Math.PI / 2, 0, 0]} scale={scale} />}
			</group>
		);
	}
};

useGLTF.preload("/engines.glb");
