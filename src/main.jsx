import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

import { AircraftEditorScene } from "./scenes/AircraftEditorScene";
import GameScene from "./scenes/GameScene";
import { useAtom } from "jotai";
import { baseSceneAtom } from "./state/atoms";

export function Game() {
	console.log("function Game");

	const [scene] = useAtom(baseSceneAtom);

	return (
		<>
			{scene === "editor" && <AircraftEditorScene />}
			{scene === "game" && <GameScene />}
		</>
	);
}

createRoot(document.getElementById("root")).render(
	<>
		<Game />
	</>
);
