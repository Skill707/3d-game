import { SidebarUI } from "./SidebarUI/SidebarUI";
import { SideButtons } from "./SideButtons/SideButtons";
export function AircraftEditorUI() {
	return (
		<div className="AircraftEditorUI-container">
			<SidebarUI />
			<SideButtons />
		</div>
	);
}
