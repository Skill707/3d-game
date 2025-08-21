import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

import { AircraftEditorScene } from "./AircraftEditorScene";

export function Game() {
	console.log("function Game");
	
	return (
		<>
			<AircraftEditorScene />
		</>
	);
}

createRoot(document.getElementById("root")).render(
	<>
		<Game />
	</>
);
