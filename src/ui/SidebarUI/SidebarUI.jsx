import { useRef, useState } from "react";
import { Sidebar } from "./Sidebar";
import { Menu } from "./panels/Menu";
import { DesignerPanel } from "./panels/DesignerPanel";
import { AddPartsPanel } from "./panels/AddPartsPanel";
import { PartPropertiesPanel } from "./panels/PartPropertiesPanel";
import { SearchPartsPanel } from "./panels/SearchPartsPanel";
import { SymmetryPanel } from "./panels/SymmetryPanel";
import { ActivationGroupsPanel } from "./panels/ActivationGroupsPanel";
import { ViewOptionsPanel } from "./panels/ViewOptionsPanel";
import { AnimatePresence } from "framer-motion";
import { useAtom } from "jotai";
import { settingsAtom } from "../../state/atoms";
import { produce } from "immer";
import { shapeRegistry } from "../../utils/partFactory";
import { PartIconView } from "./components/PartIconView";
import partsStorageAtom from "../../state/partsStorageAtom";

export function SidebarUI() {
	const [activePanel, setActivePanel] = useState(null);
	const partsIconsRef = useRef(null);
	const [partsStorage, partsStorageAPI] = useAtom(partsStorageAtom);
	const [settingsStorage, setSettingsStorage] = useAtom(settingsAtom);

	const selectedPart = partsStorage.selectedPart;
	const activeSubToolId = settingsStorage.activeSubToolId;

	const setActiveSubToolId = (id) => {
		setSettingsStorage(
			produce((draft) => {
				draft.activeSubToolId = id;
			})
		);
	};

	const handlePanelToggle = (panelId) => {
		setActivePanel((current) => (current === panelId ? null : panelId));
	};

	const handleMovePart = (field, value) => {
		const pos = {
			xPos: 0,
			yPos: 1,
			zPos: 2,
		};
		const rot = {
			xAngle: 0,
			yAngle: 1,
			zAngle: 2,
		};
		partsStorageAPI(
			produce((draft) => {
				const part = draft.parts.find((p) => p.id === draft.selectedPart.id);

				if (pos[field] !== undefined) {
					part.pos[pos[field]] = value;
				} else if (rot[field] !== undefined) {
					part.rot[rot[field]] = (value * Math.PI) / 180;
				}
				draft.selectedPart = part;
			})
		);
	};

	const otherSide = (side) => {
		if (side === "front") return "back";
		return "front";
	};

	const handleChangeSegmentProperties = (part, segmentName, newProperties) => {
		let parts = null;
		let tasks = {};
		if (segmentName === "center") {
			parts = [
				{ id: part.id, segmentName: "front" },
				{ id: part.id, segmentName: "back" },
			];
			tasks = { updatePartCenter: { part, newProperties } };
		} else {
			parts = [{ id: part.id, segmentName: segmentName }];
		}

		part.attachedParts.forEach((attachedPart) => {
			if (attachedPart.name === segmentName) {
				parts.push({ id: attachedPart.id, segmentName: otherSide(attachedPart.name) });
			}
		});

		/*let KEY = ""
		for (const key in newProperties){
			KEY = key
			break
		}

		if (KEY === "length"){
			newProperties = {
				...newProperties,
				pos: []
			}
		}*/

		

		tasks = {
			...tasks,
			updatePartsSegmentProps: { parts, newProperties },
			commit: 0,
		};

		partsStorageAPI(tasks);
	};

	const handlePrevPart = () => {
		selectedPart.attachedParts.forEach((attachedPart) => {
			if (attachedPart.name === "back") {
				partsStorageAPI({
					selectPartbyID: attachedPart.id,
					commit: 0,
				});
				return;
			}
		});
		if (selectedPart.attachedToPart) {
			partsStorageAPI({
				selectPartbyID: selectedPart.attachedToPart,
				commit: 0,
			});
		}
	};
	const handleNextPart = () => {
		selectedPart.attachedParts.forEach((attachedPart) => {
			if (attachedPart.name === "front") {
				partsStorageAPI({
					selectPartbyID: attachedPart.id,
					commit: 0,
				});
			}
		});
	};

	if (!partsIconsRef.current) {
		const arr = [];
		for (let shape in shapeRegistry) {
			arr.push({
				type: shape,
				name: shape.charAt(0).toUpperCase() + shape.slice(1),
				icon: <PartIconView partName={shape} size={128} />,
				description: `Description for ${shape}`,
			});
		}
		partsIconsRef.current = [...arr];
	}

	return (
		<div className="SidebarUI-container">
			<Sidebar onIconClick={handlePanelToggle} activePanel={activePanel} activeSubToolId={activeSubToolId} />
			<AnimatePresence>
				{activePanel === "MENU" && <Menu partsStorageAPI={partsStorageAPI} key="menu" onClose={() => handlePanelToggle("MENU")} />}
				{activePanel === "DESIGNER" && (
					<DesignerPanel
						key="designer"
						onClose={() => handlePanelToggle("DESIGNER")}
						activeSubToolId={activeSubToolId}
						setActiveSubToolId={setActiveSubToolId}
						selectedPart={selectedPart}
						handleChangeSegmentProperties={handleChangeSegmentProperties}
						settingsStorage={settingsStorage}
						setSettingsStorage={setSettingsStorage}
						handleMovePart={handleMovePart}
						handlePrevPart={handlePrevPart}
						handleNextPart={handleNextPart}
					/>
				)}
				{activePanel === "ADD_PARTS" && (
					<AddPartsPanel key="add-parts" partIcons={partsIconsRef.current} onClose={() => handlePanelToggle("ADD_PARTS")} />
				)}
				{activePanel === "SEARCH" && <SearchPartsPanel key="search-parts" onClose={() => handlePanelToggle("SEARCH")} />}
				{activePanel === "PART_PROPERTIES" && (
					<PartPropertiesPanel key="part-props" onClose={() => handlePanelToggle("PART_PROPERTIES")} selectedPart={selectedPart} />
				)}
				{activePanel === "SYMMETRY" && <SymmetryPanel key="symmetry" onClose={() => handlePanelToggle("SYMMETRY")} />}
				{activePanel === "ACTIVATION_GROUPS" && (
					<ActivationGroupsPanel key="activation-groups" onClose={() => handlePanelToggle("ACTIVATION_GROUPS")} />
				)}
				{activePanel === "VIEW" && <ViewOptionsPanel key="view-options" onClose={() => handlePanelToggle("VIEW")} />}
			</AnimatePresence>
		</div>
	);
}
