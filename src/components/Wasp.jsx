import { useGLTF } from "@react-three/drei";
import { ConvexHullCollider } from "@react-three/rapier";
import { useMemo } from "react";
import { MeshStandardMaterial } from "three";
export const WaspModel = ({ color = "white" }) => {
	const { nodes } = useGLTF("/xf707.glb");
	const material = useMemo(
		() =>
			new MeshStandardMaterial({
				color: color,
			}),
		[color]
	);

	const vertices = useMemo(() => {
		if (!nodes.Barrel_141001) return [];
		const pos = nodes.Barrel_141001.geometry.getAttribute("position");
		return Array.from(pos.array); // Float32Array → обычный массив
	}, [nodes]);

	return (
		<group dispose={null}>
			<mesh name="engine1" geometry={nodes.Barrel_141001.geometry} material={material} rotation={[Math.PI / 2, 0, 0]} scale={1} />
			<ConvexHullCollider args={[vertices]} rotation={[Math.PI / 2, 0, 0]} />
		</group>
	);
};

useGLTF.preload("/xf707.glb");
