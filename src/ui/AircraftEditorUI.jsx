import { SidebarUI } from "./SidebarUI";
import { SideButtons } from "./SideButtons/index";

export function AircraftEditorUI() {
	return (
		<div className="AircraftEditorUI-container">
			<SidebarUI />
			<SideButtons />
		</div>
	);
}
