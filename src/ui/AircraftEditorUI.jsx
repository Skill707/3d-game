import { useAtom } from "jotai";
import { baseSceneAtom } from "../state/atoms";
import { hudDataAtom } from "../state/hudDataAtom";
import { SidebarUI } from "./SidebarUI/SidebarUI";
import { SideButtons } from "./SideButtons/SideButtons";
import HUD from "./HUD";
export function AircraftEditorUI() {
	const [scene] = useAtom(baseSceneAtom);
	const [hudData] = useAtom(hudDataAtom);

	return (
		<div className="AircraftEditorUI-container">
			<>
				<SidebarUI />
				<SideButtons />
				{scene !== "editor" && <HUD hudData={hudData} />}
			</>
		</div>
	);
}
