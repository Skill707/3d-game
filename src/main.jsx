import { StrictMode, Suspense, useEffect, useMemo, useRef } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { useAtom } from "jotai";
import { baseSceneAtom } from "./state/atoms";
import { GizmoHelper, GizmoViewport, Grid, KeyboardControls, Loader, OrbitControls, Sky, Stats } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { AircraftEditorUI } from "./ui/AircraftEditorUI";
import { Physics } from "@react-three/rapier";
import { Ground } from "./components/Ground";
import { Craft } from "./components/Craft";

export function Game() {
	console.log("function Game");
	const [scene] = useAtom(baseSceneAtom);
	const orbitControlsRef = useRef();

	const map = useMemo(() => {
		switch (scene) {
			case "game":
				return [
					{ name: "pitchDown", keys: ["KeyW"] },
					{ name: "pitchUp", keys: ["KeyS"] },
					{ name: "rollLeft", keys: ["KeyA"] },
					{ name: "rollRight", keys: ["KeyD"] },
					{ name: "yawLeft", keys: ["KeyQ"] },
					{ name: "yawRight", keys: ["KeyE"] },
					{ name: "throttleUp", keys: ["Shift"] },
					{ name: "throttleDown", keys: ["Control"] },
					{ name: "shoot", keys: ["Space"] },
					{ name: "menu", keys: ["Escape", "`"] },
				];

			case "editor":
				return [
					{ name: "nextTool", keys: ["KeyM"] },
					{ name: "reshapeTool", keys: ["KeyF"] },
					{ name: "paintTool", keys: ["KeyP"] },
					{ name: "connections", keys: ["KeyC"] },
					{ name: "addPart", keys: ["KeyA"] },
					{ name: "properties", keys: ["KeyB"] },
					{ name: "searchParts", keys: ["KeyS"] },
					{ name: "menu", keys: ["Escape", "`"] },
					{ name: "start", keys: ["Space"] },
				];

			default:
				break;
		}
	}, [scene]);

	const toggleFullScreen = async () => {
		try {
			if (!document.fullscreenElement) {
				await document.documentElement.requestFullscreen();

				// после входа в fullscreen пробуем зафиксировать ориентацию
				if (screen.orientation && screen.orientation.lock) {
					await screen.orientation.lock("landscape");
				}
			}
		} catch (err) {
			console.error(`Error: ${err.message} (${err.name})`);
		}
	};

	const OrientationMessage = () => (
		<div className="orientation-message">
			<div className="orientation-message-content">
				<svg className="orientation-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
					<path d="M0 0h24v24H0V0z" fill="none" />
					<path d="M15.55 5.55L11 1v3.07C7.06 4.56 4 7.92 4 12s3.06 7.44 7 7.93v-2.02c-2.83-.48-5-2.94-5-5.91s2.17-5.43 5-5.91V11l4.55-4.55zM19.93 11c-.17-1.39-.72-2.73-1.62-3.89l-1.42 1.42c.54.75.88 1.6 1.02 2.47h2.02zM13 17.93v2.02c1.39-.17 2.74-.71 3.9-1.61l-1.44-1.44c-.75.54-1.59.89-2.46 1.03z" />
				</svg>
				<h2>Please rotate your device</h2>
				<p>This application is best viewed in landscape mode.</p>
			</div>
		</div>
	);

	useEffect(() => {
		const lockOrientation = async () => {
			// Check for mobile user agent and availability of screen.orientation.lock
			const isMobile = /Mobi|Android/i.test(navigator.userAgent);
			// FIX: Cast `screen.orientation` to `any` to access the experimental `lock` method, which may not be defined in standard TypeScript types.
			if (isMobile && screen.orientation && typeof screen.orientation.lock === "function") {
				try {
					// Note: This might not work on all browsers/OSes without user interaction
					// or specific browser settings (e.g., iOS). The CSS is a reliable fallback.
					await screen.orientation.lock("landscape");
				} catch (error) {
					console.error("Failed to lock orientation:", error);
					// The CSS fallback will handle prompting the user.
				}
			}
		};
		lockOrientation();
	}, []);

	return (
		<KeyboardControls map={map}>
			<AircraftEditorUI />
			<Canvas shadows camera={{ position: [8, 5, 10], fov: 60 }} flat onClick={toggleFullScreen}>
				<ambientLight intensity={0.5} />
				<directionalLight
					castShadow
					position={[100, 100, 0]}
					intensity={0.5}
					shadow-mapSize-width={4096}
					shadow-mapSize-height={4096}
					shadow-camera-left={-100}
					shadow-camera-right={100}
					shadow-camera-top={100}
					shadow-camera-bottom={-100}
					shadow-bias={-0.0001}
				/>
				<Sky sunPosition={[100, 100, 0]} distance={1000} />
				<OrbitControls
					ref={orbitControlsRef}
					enablePan={scene === "editor"}
					minDistance={5}
					maxDistance={20}
					maxPolarAngle={Math.PI / 2 - 0.1}
					makeDefault
				/>
				{scene === "editor" && (
					<>
						<Grid
							position={[0, 2, 0]}
							args={[20, 20]}
							cellSize={0.5}
							cellThickness={1}
							cellColor={"#6f6f6f"}
							sectionSize={2.5}
							sectionThickness={1.5}
							sectionColor={"#0d79f2"}
							fadeDistance={30}
							infiniteGrid
							name="grid"
						/>
						<GizmoHelper alignment="bottom-right" margin={[80, 80]}>
							<GizmoViewport axisColors={["#9d4b4b", "#2f7f4f", "#3b5b9d"]} labelColor="white" />
						</GizmoHelper>
					</>
				)}
				<Suspense>
					<Physics gravity={[0, -9.81, 0]}  >
						<Craft orbitControlsRef={orbitControlsRef} editor={scene === "editor"} />
						<Ground width={2000} height={2000} segX={100} segY={100} amplitude={3} frequency={5} />
					</Physics>
				</Suspense>
			</Canvas>
			<Stats className="stats" />
			<Loader />
		</KeyboardControls>
	);
}

createRoot(document.getElementById("root")).render(
	<>
		<Game />
	</>
);

document.addEventListener("keydown", function (e) {
	// Проверяем Ctrl+S (или Cmd+S на Mac)
	if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === "s" || e.key.toLowerCase() === "w")) {
		e.preventDefault();
	}
});
