import { useGLTF } from "@react-three/drei";
import GlowMesh from "./ShapedForm/GlowMesh";
import { Segment as SegmentModel } from "./ShapedForm/Segment";
import { ConvexHullCollider, interactionGroups } from "@react-three/rapier";
import { useMemo } from "react";

export const CockpitModel = ({ cockpit, color, selected, editor }) => {
	const { nodes, materials } = useGLTF("/cockpits.glb");

	// Собираем вершины для ConvexHullCollider
	const vertices = useMemo(() => {
		if (!nodes.Cockpit_1) return [];
		const pos = nodes.Cockpit_1.geometry.getAttribute("position");
		return Array.from(pos.array); // Float32Array → обычный массив
	}, [nodes]);

	if (cockpit.model === "Cockpit")
		return (
			<>
				<group rotation={[Math.PI / 2, 0, 0]} scale={2} position={[0, 0.42, 0]}>
					<mesh name="cockpit" geometry={nodes.Cockpit_1.geometry} material={materials["PartMaterial(Clone)"]} />
					<mesh geometry={nodes.Cockpit_2.geometry} material={materials["PartMaterial(Clone)(Clone) (Instance)"]} />
					<mesh geometry={nodes.Cockpit_5.geometry} material={materials["Part Material BDM"]} />
					<mesh geometry={nodes.Cockpit_6.geometry} material={materials["PartTransparent(Clone)"]} />
					<mesh name="cockpit" geometry={nodes.Cockpit_7.geometry} material={materials["PartTransparentZWrite(Clone)"]} />
					<mesh name="cockpit" geometry={nodes.Cockpit_8.geometry} material={materials["PartMaterial(Clone)"]} />
					{selected && editor && (
						<>
							<GlowMesh geometry={nodes.Cockpit_1.geometry} />
							<GlowMesh geometry={nodes.Cockpit_7.geometry} />
							<GlowMesh geometry={nodes.Cockpit_8.geometry} />
						</>
					)}
				</group>
				<SegmentModel segment={cockpit.rear} segmentName={"rear"} material={materials["PartMaterial(Clone)"]} selected={selected} editor={editor} />
				{!editor && (
					<ConvexHullCollider
						args={[vertices]}
						rotation={[Math.PI / 2, 0, 0]}
						scale={2}
						position={[0, 0.42, 0]}
						collisionGroups={interactionGroups([0], [1])}
					/>
				)}
			</>
		);
	else if (cockpit.model === "Chip") {
		<group dispose={null}>
			<mesh name="chip" geometry={nodes.Chip.geometry} material={materials["PartMaterial(Clone)"]} rotation={[Math.PI / 2, 0, 0]} />
		</group>;
	}
};

useGLTF.preload("/cockpits.glb");
