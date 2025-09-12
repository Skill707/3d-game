import { useGLTF } from "@react-three/drei";
import GlowMesh from "./ShapedForm/GlowMesh";

export const CockpitModel = ({ name, scale, color, selected, editor }) => {
	const { nodes, materials } = useGLTF("/cockpits.glb");

	if (name === "Cockpit")
		return (
				<group rotation={[Math.PI / 2, 0, 0]} scale={scale}>
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
		);
	else if (name === "Chip") {
		<group dispose={null}>
			<mesh name="chip" geometry={nodes.Chip.geometry} material={materials["PartMaterial(Clone)"]} rotation={[Math.PI / 2, 0, 0]} />
		</group>;
	}
};

useGLTF.preload("/cockpits.glb");
