import { useGLTF } from "@react-three/drei";

export const Cockpit = ({ name }) => {
	const { nodes, materials } = useGLTF("/cockpits.glb");

	if (name === "Cockpit")
		return (
			<group dispose={null}>
				<group rotation={[Math.PI / 2, 0, 0]}>
					<mesh geometry={nodes.Cockpit_1.geometry} material={materials["PartMaterial(Clone)"]} />
					<mesh geometry={nodes.Cockpit_2.geometry} material={materials["PartMaterial(Clone)(Clone) (Instance)"]} />
					<mesh geometry={nodes.Cockpit_3.geometry} material={materials["LiberationSans SDF Material Instance"]} />
					<mesh geometry={nodes.Cockpit_4.geometry} material={materials["Jefferies Atlas Material Instance"]} />
					<mesh geometry={nodes.Cockpit_5.geometry} material={materials["Part Material BDM"]} />
					<mesh geometry={nodes.Cockpit_6.geometry} material={materials["PartTransparent(Clone)"]} />
					<mesh geometry={nodes.Cockpit_7.geometry} material={materials["PartTransparentZWrite(Clone)"]} />
					<mesh geometry={nodes.Cockpit_8.geometry} material={materials["DesignerPartSelected(Clone) (Instance)"]} />
					<mesh geometry={nodes.Cockpit_9.geometry} material={materials["LiberationSans SDF Material (Instance)"]} />
				</group>
			</group>
		);
	else if (name === "Chip") {
		<group dispose={null}>
			<mesh geometry={nodes.Chip.geometry} material={materials["PartMaterial(Clone)"]} rotation={[Math.PI / 2, 0, 0]} />
		</group>;
	}
};

useGLTF.preload("/cockpits.glb");
