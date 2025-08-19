import React, { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Menu } from './panels/Menu';
import { DesignerPanel } from './panels/DesignerPanel';
import { AddPartsPanel } from './panels/AddPartsPanel';
import { PartPropertiesPanel } from './panels/PartPropertiesPanel';
import { SearchPartsPanel } from './panels/SearchPartsPanel';
import { SymmetryPanel } from './panels/SymmetryPanel';
import { ActivationGroupsPanel } from './panels/ActivationGroupsPanel';
import { ViewOptionsPanel } from './panels/ViewOptionsPanel';
import { AnimatePresence } from "framer-motion";

const mockPart = {
  name: 'Fuel Tank',
  mass: '1.67t',
  price: '$5,047',
  sections: ['RESIZABLE PART', 'FUEL TANK', 'ADDITIONAL SETTINGS', 'TINKER PANEL', 'PART STYLE']
};

export function SidebarUI() {
	const [activePanel, setActivePanel] = useState(null);
	const [activeSubToolId, setActiveSubToolId] = useState("MOVE");
	const [selectedPart, setSelectedPart] = useState(null);

	const handlePanelToggle = (panelId) => {
		setActivePanel((current) => (current === panelId ? null : panelId));
	};

  React.useEffect(() => {
    if (activePanel === 'PART_PROPERTIES') {
        // Initially show empty state
        setSelectedPart(null);
        // After 2 seconds, simulate selecting a part to show the full panel
        const timer = setTimeout(() => {
            setSelectedPart(mockPart);
        }, 2000);
        return () => clearTimeout(timer);
    } else {
        // Clear selection when panel is closed
        setSelectedPart(null);
    }
  }, [activePanel]);

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
