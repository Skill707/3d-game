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
import { partsAtom, settingsAtom } from "../../state/atoms";
import { produce } from "immer";
import { generatePoints, shapeRegistry } from "../../utils/partFactory";
import { PartIconView } from "./components/PartIconView";

export function SidebarUI() {
	const [activePanel, setActivePanel] = useState(null);
	const partsIconsRef = useRef(null);
	const [partsStorage, setPartsStorage] = useAtom(partsAtom);
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
		setPartsStorage(
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

	const handleChangeSegmentProperties = (segmentName, newProperties) => {
		setPartsStorage(
			produce((draft) => {
				const part = draft.parts.find((p) => p.id === draft.selectedPart.id);
				part.shapeSegments[segmentName] = { ...part.shapeSegments[segmentName], ...newProperties };
				let props = [];
				for (const key in newProperties) {
					props.push(key);
				}

				if (props[0] === "corners") {
					part.shapeSegments[segmentName].corner1 = part.shapeSegments[segmentName].corners;
					part.shapeSegments[segmentName].corner2 = part.shapeSegments[segmentName].corners;
					part.shapeSegments[segmentName].corner3 = part.shapeSegments[segmentName].corners;
					part.shapeSegments[segmentName].corner4 = part.shapeSegments[segmentName].corners;
				} else if (props[0] === "length") {
					part.shapeSegments.front.pos[2] = part.shapeSegments.center.length / 2;
					part.shapeSegments.back.pos[2] = -part.shapeSegments.center.length / 2;
				} else if (props[0] === "xOffset") {
					part.shapeSegments.front.pos[0] = part.shapeSegments.center.xOffset / 2;
					part.shapeSegments.back.pos[0] = -part.shapeSegments.center.xOffset / 2;
				} else if (props[0] === "zOffset") {
					part.shapeSegments.front.pos[1] = part.shapeSegments.center.zOffset / 2;
					part.shapeSegments.back.pos[1] = -part.shapeSegments.center.zOffset / 2;
				} else if (props[0] === "pinchX" || props[0] === "pinchY" || props[0] === "slantF" || props[0] === "slantB" || props[0] === "angle") {
					part.shapeSegments.front.points = generatePoints(
						part.shapeSegments.front.pointsCount,
						[part.shapeSegments.front.width, part.shapeSegments.front.height],
						[
							part.shapeSegments.front.corner1 * 0.01,
							part.shapeSegments.front.corner2 * 0.01,
							part.shapeSegments.front.corner3 * 0.01,
							part.shapeSegments.front.corner4 * 0.01,
						],
						part.shapeSegments.center.pinchX * 0.01,
						part.shapeSegments.center.pinchY * 0.01,
						part.shapeSegments.center.slantF * 0.01,
						part.shapeSegments.center.angle * 0.01
					);
					part.shapeSegments.back.points = generatePoints(
						part.shapeSegments.back.pointsCount,
						[part.shapeSegments.back.width, part.shapeSegments.back.height],
						[
							part.shapeSegments.back.corner1 * 0.01,
							part.shapeSegments.back.corner2 * 0.01,
							part.shapeSegments.back.corner3 * 0.01,
							part.shapeSegments.back.corner4 * 0.01,
						],
						part.shapeSegments.center.pinchX * 0.01,
						part.shapeSegments.center.pinchY * 0.01,
						part.shapeSegments.center.slantB * 0.01,
						part.shapeSegments.center.angle * 0.01
					);
				}

				if (segmentName !== "center") {
					part.shapeSegments[segmentName].points = generatePoints(
						part.shapeSegments[segmentName].pointsCount,
						[part.shapeSegments[segmentName].width, part.shapeSegments[segmentName].height],
						[
							part.shapeSegments[segmentName].corner1 * 0.01,
							part.shapeSegments[segmentName].corner2 * 0.01,
							part.shapeSegments[segmentName].corner3 * 0.01,
							part.shapeSegments[segmentName].corner4 * 0.01,
						],
						part.shapeSegments.center.pinchX * 0.01,
						part.shapeSegments.center.pinchY * 0.01,
						segmentName === "back " ? part.shapeSegments.center.slantB * 0.01 : part.shapeSegments.center.slantF * 0.01,
						part.shapeSegments.center.angle * 0.01
					);
				}
				draft.selectedPart = part;
			})
		);
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
				{activePanel === "MENU" && <Menu key="menu" onClose={() => handlePanelToggle("MENU")} />}
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

/*
 <ScenePartsList
                parts={partsOnScene}
                onPartSelect={handlePartSelect}
                selectedPartId={selectedPart?.id}
              />
              <PartsLibraryUI />

                    <div className={css.toolSelectionBar}>
        <Button
          className={`${css.toolButton} ${currentTool === 'editor' ? css.active : ''}`}
          onClick={() => handleToolChange('editor')}
          variant="secondary"
        >
          Editor
        </Button>
        <Button
          className={`${css.toolButton} ${currentTool === 'movePart' ? css.active : ''}`}
          onClick={() => handleToolChange('movePart')}
          variant="secondary"
        >
          Move Part
        </Button>
        <Button
          className={`${css.toolButton} ${currentTool === 'partList' ? css.active : ''}`}
          onClick={() => handleToolChange('partList')}
          variant="secondary"
        >
          Part List
        </Button>
        <Button
          className={`${css.toolButton} ${currentTool === 'searchParts' ? css.active : ''}`}
          onClick={() => handleToolChange('searchParts')}
          variant="secondary"
        >
          Search Parts
        </Button>
        <Button
          className={`${css.toolButton} ${currentTool === 'partProperties' ? css.active : ''}`}
          onClick={() => handleToolChange('partProperties')}
          variant="secondary"
        >
          Part Properties
        </Button>
      </div>
*/
