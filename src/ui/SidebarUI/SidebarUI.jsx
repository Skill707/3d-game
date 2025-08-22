import React, { useState } from "react";
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
import { partsAtom } from "../../state/atoms";
import { produce } from "immer";
import { segmentPoinsRegistry } from "../../utils/partFactory";

export function SidebarUI() {
	const [activePanel, setActivePanel] = useState(null);
	const [activeSubToolId, setActiveSubToolId] = useState("MOVE");

	const [partsStorage, setPartsStorage] = useAtom(partsAtom);
	const selectedPart = partsStorage.parts.find((p) => p.id === partsStorage.selectedID) || null;

	const handlePanelToggle = (panelId) => {
		setActivePanel((current) => (current === panelId ? null : panelId));
	};

	/*const handleChangeMode = (id, newName, newSize, newShape) => {
		setPartsStorage(
			produce((draft) => {
				const part = draft.parts.find((p) => p.id === id);
				if (!part) {
					console.warn("part not found");
					return;
				}
				part.name = newName;
				part.size = newSize;
				part.shape = newShape;
			})
		);
	};*/

	const handleChangeMode = (id, segmentName, newShapeName) => {
		setPartsStorage(
			produce((draft) => {
				const part = draft.parts.find((p) => p.id === id);
				if (!part) {
					console.warn("part not found");
					return;
				}
				if (segmentName === "front") {
					part.shape.segments[1] = { ...part.shape.segments[1], shapeName: newShapeName, points: segmentPoinsRegistry[newShapeName] };
					part.attachedParts.forEach((par) => {
						const found = draft.parts.find((p) => p.id === par.id);
						if (found) {
							found.shape.segments[0] = { ...found.shape.segments[0], shapeName: newShapeName, points: segmentPoinsRegistry[newShapeName] };
						}
					});
				} else if (segmentName === "back") {
					const newSegment = { ...part.shape.segments[0], shapeName: newShapeName, points: segmentPoinsRegistry[newShapeName] };
					part.shape.segments[0] = newSegment;
					part.attachedParts.forEach((par) => {
						const found = draft.parts.find((p) => p.id === par.id);
						if (found) {
							found.shape.segments[1] = { ...found.shape.segments[1], shapeName: newShapeName, points: segmentPoinsRegistry[newShapeName] };
						}
					});
				}
			})
		);
		/*
			(prev) => {
			const parts = prev.parts.map((p) => {
				if (p.id === id) {
					if (segmentName === "front") {
						const segments = [...p.shape.segments];
						//segments[1] = { ...segments[1], ...segmentShape, shapeName: newShapeName };
						p.shape = { ...p.shape, segments: segments };
					} else if (segmentName === "back") {
						//p.shape.segments[0] = { ...p.shape.segments[0], ...segmentShape, shapeName: newShapeName };
					}
				}
			});

			return { ...prev, parts, selectedID: selectedPart.id };
		};
		*/
	};

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
					/>
				)}
				{activePanel === "ADD_PARTS" && <AddPartsPanel key="add-parts" onClose={() => handlePanelToggle("ADD_PARTS")} />}
				{activePanel === "SEARCH" && <SearchPartsPanel key="search-parts" onClose={() => handlePanelToggle("SEARCH")} />}
				{activePanel === "PART_PROPERTIES" && (
					<PartPropertiesPanel
						key="part-props"
						onClose={() => handlePanelToggle("PART_PROPERTIES")}
						selectedPart={selectedPart}
						handleChangeMode={handleChangeMode}
					/>
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
