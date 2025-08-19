import { Suspense, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, Grid, TransformControls, GizmoHelper, GizmoViewport, Stats, KeyboardControls } from "@react-three/drei";

import { AircraftEditorUI } from "./ui/AircraftEditorUI";
import Craft from "./components/Craft";

export function AircraftEditorScene() {
	const orbit = useRef()
	return (
		<>
			<AircraftEditorUI />
			<Canvas shadows camera={{ position: [8, 5, 10], fov: 60 }}>
				<Suspense fallback={null}>
					<ambientLight intensity={0.7} />
					<directionalLight position={[10, 10, 5]} intensity={1.5} castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} />
					<Grid
						position={[0, -3, 0]}
						args={[20, 20]}
						cellSize={0.5}
						cellThickness={1}
						cellColor={"#6f6f6f"}
						sectionSize={2.5}
						sectionThickness={1.5}
						sectionColor={"#0d79f2"}
						fadeDistance={30}
						infiniteGrid
					/>

					<KeyboardControls
						map={[
							{ name: "lmb", keys: ["Mouse0"] },
							{ name: "mmb", keys: ["Mouse1"] },
							{ name: "rmb", keys: ["Mouse2"] },
						]}
					>
						<Craft orbit={orbit} />
					</KeyboardControls>
					{/*<TransformControls enabled={true} ref={null} object={null} onMouseUp={() => {}} mode={"rotate"} /> */}
					<Environment preset="city" />
					<OrbitControls ref={orbit} enablePan={true} minDistance={5} maxDistance={20} maxPolarAngle={Math.PI / 2 - 0.1} makeDefault />
					<GizmoHelper alignment="bottom-right" margin={[80, 80]}>
						<GizmoViewport axisColors={["#9d4b4b", "#2f7f4f", "#3b5b9d"]} labelColor="white" />
					</GizmoHelper>
					<Stats />
				</Suspense>
			</Canvas>
		</>
	);
}
