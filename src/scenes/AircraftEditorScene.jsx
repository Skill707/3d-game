import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid, GizmoHelper, GizmoViewport, Stats, Loader, KeyboardControls } from "@react-three/drei";
import { Bloom, DepthOfField, EffectComposer, Noise, Outline, Vignette } from "@react-three/postprocessing";
import { AircraftEditorUI } from "../ui/AircraftEditorUI";
import Craft from "../components/Craft";

export function AircraftEditorScene() {
	const orbit = useRef();

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

	const Controls = {
		nextTool: "nextTool",
		reshapeTool: "reshapeTool",
		paintTool: "paintTool",
		connections: "connections",
		addPart: "addPart",
		properties: "properties",
		searchParts: "searchParts",
		menu: "menu",
	};

	const map = useMemo(
		() => [
			{ name: Controls.nextTool, keys: ["KeyM"] },
			{ name: Controls.reshapeTool, keys: ["KeyF"] },
			{ name: Controls.paintTool, keys: ["KeyP"] },
			{ name: Controls.connections, keys: ["KeyC"] },
			{ name: Controls.addPart, keys: ["KeyA"] },
			{ name: Controls.properties, keys: ["KeyB"] },
			{ name: Controls.searchParts, keys: ["KeyS"] },
			{ name: Controls.menu, keys: ["Escape", "`"] },
			{ name: Controls.start, keys: ["Space"] },
		],
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[]
	);

	return (
		<KeyboardControls map={map}>
			<OrientationMessage />
			<AircraftEditorUI />
			<Canvas shadows camera={{ position: [8, 5, 10], fov: 60 }} flat onClick={toggleFullScreen}>
				<Suspense
					fallback={() => {
						console.log("fallback");
					}}
				>
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
					<Craft orbit={orbit} />
					<EffectComposer multisampling={8}></EffectComposer>
					<OrbitControls ref={orbit} enablePan={true} minDistance={5} maxDistance={20} maxPolarAngle={Math.PI / 2 - 0.1} makeDefault />
					<GizmoHelper alignment="bottom-right" margin={[80, 80]}>
						<GizmoViewport axisColors={["#9d4b4b", "#2f7f4f", "#3b5b9d"]} labelColor="white" />
					</GizmoHelper>
				</Suspense>
			</Canvas>
			<Stats className="stats" />

			<Loader />
		</KeyboardControls>
	);
}
