import { useRef, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { CameraControls, OrbitControls } from "@react-three/drei";
import { Euler, Quaternion, Vector3 } from "three";

function ThirdPersonCameraControls() {
	const { camera } = useThree();
	const yaw = useRef(Math.PI);
	const pitch = useRef(-Math.PI / 6);
	const sensitivity = 0.005;

	useEffect(() => {
		const handleMouseMove = (e) => {
			if (e.buttons === 1) {
				yaw.current -= e.movementX * sensitivity;
				pitch.current -= e.movementY * sensitivity;
				pitch.current = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, pitch.current));
			}
		};

		document.addEventListener("mousemove", handleMouseMove);
		return () => document.removeEventListener("mousemove", handleMouseMove);
	}, []);

	useFrame((_, delta) => {
		const rotation = new Quaternion().setFromEuler(new Euler(pitch.current, yaw.current, 0, "YXZ"));
		const camOffset = new Vector3(0, 0, 25).applyQuaternion(rotation);
		camera.position.lerp(camOffset, delta * 4);
		camera.quaternion.slerp(rotation, delta * 4);
	});

	return null;
}

export function CameraController({ sceneName, cameraControlsRef, craftRBRef }) {
	return (
		<>
			<OrbitControls ref={cameraControlsRef} makeDefault={sceneName === "editor"} enabled={sceneName === "editor"} />
			{sceneName === "game" && <ThirdPersonCameraControls craftRBRef={craftRBRef} />}
		</>
	);
}

/*const [mode, setMode] = useState("orbit"); // "orbit" | "third"
	useEffect(() => {
		const toggle = (e) => {
			if (e.code === "KeyC") {
				setMode((m) => (m === "orbit" ? "third" : "orbit"));
			}
		};
		window.addEventListener("keydown", toggle);
		return () => window.removeEventListener("keydown", toggle);
	}, []);*/
