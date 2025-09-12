import { useGLTF } from "@react-three/drei";

export const Engine = ({ name }) => {
	const { nodes, materials } = useGLTF("/engines.glb");

	if (name === "Engine1")
		return (
			<group dispose={null}>
				<mesh geometry={nodes.Engine1.geometry} material={materials["DesignerPartDisconnected(Clone) (Instance)"]} rotation={[Math.PI / 2, 0, 0]} />
			</group>
		);
	else if (name === "Engine2") {
		return (
			<group dispose={null}>
				<group rotation={[Math.PI / 2, 0, 0]}>
					<mesh geometry={nodes.Body_7.geometry} material={materials["DesignerPartSelected(Clone) (Instance)"]} />
					<mesh geometry={nodes.Body_7_1.geometry} material={materials["DesignerSubPartSelected(Clone) (Instance)"]} />
				</group>
			</group>
		);
	} else if (name === "Engine3") {
		return (
			<group dispose={null}>
				<mesh geometry={nodes.Engine3.geometry} material={materials["DesignerPartDisconnected(Clone) (Instance)"]} rotation={[Math.PI / 2, 0, 0]} />
			</group>
		);
	}
};

useGLTF.preload("/engines.glb");
