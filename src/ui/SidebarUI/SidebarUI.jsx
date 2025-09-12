import { useEffect, useRef, useState } from "react";
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
import { PartIconView } from "./components/PartIconView";
import partsStorageAtom from "../../state/partsStorageAtom";
import { useKeyboardControls } from "@react-three/drei";
import { localPosDelta } from "../../utils/transformUtils";
import { partTypeRegistry } from "../../utils/partFactory";

export function SidebarUI() {
	const [activePanel, setActivePanel] = useState(null);
	const partsIconsRef = useRef(null);
	const [partsStorage, partsStorageAPI] = useAtom(partsStorageAtom);
	const [settingsStorage, setSettingsStorage] = useAtom(settingsAtom);

	const selectedPart = partsStorage.selectedPart;

	let activeSubToolId = settingsStorage.activeSubToolId;

	const setActiveSubToolId = (id) => {
		setSettingsStorage({
			...settingsStorage,
			activeSubToolId: id,
		});
		if (id === "PAINT") {
			partsStorageAPI((api) => {
				api.selectPart(null);
				api.commit();
			});
		}
	};

	const pressedKey = useKeyboardControls((state) => state);
	const lastPressed = useRef(Object.fromEntries(Object.keys(pressedKey).map((k) => [k, false])));
	useEffect(() => {
		const actions = {
			nextTool: () => {
				const toolOrder = ["MOVE", "TRANSLATE", "ROTATE"];
				setSettingsStorage((prev) => {
					const currentTool = prev.activeSubToolId;
					const currentIndex = toolOrder.indexOf(currentTool);
					const newIndex = (currentIndex + 1) % toolOrder.length;
					return { ...prev, activeSubToolId: toolOrder[newIndex] };
				});
				if (activePanel !== "DESIGNER") setActivePanel("DESIGNER");
			},
			reshapeTool: () => {
				setActiveSubToolId("RESHAPE");
				if (activePanel !== "DESIGNER") setActivePanel("DESIGNER");
			},
			paintTool: () => {
				setActiveSubToolId("PAINT");
				if (activePanel !== "DESIGNER") setActivePanel("DESIGNER");
			},
			connections: () => {
				setActiveSubToolId("CONNECTIONS");
				if (activePanel !== "DESIGNER") setActivePanel("DESIGNER");
			},
			addPart: () => {
				setActivePanel("ADD_PARTS");
			},
			searchParts: () => {
				setActivePanel("SEARCH");
			},
			properties: () => {
				setActivePanel("PART_PROPERTIES");
			},
			menu: () => {
				setActivePanel("MENU");
			},
		};

		for (const [name, value] of Object.entries(pressedKey)) {
			const wasPressed = lastPressed.current[name];
			if (!wasPressed && value && actions[name]) actions[name]();
			lastPressed.current[name] = value;
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [pressedKey, setSettingsStorage]);

	const handlePanelToggle = (panelId) => {
		setActivePanel((current) => (current === panelId ? null : panelId));
		if (panelId !== "DESIGNER") {
			setSettingsStorage((prev) => ({ ...prev, activeSubToolId: "MOVE" }));
		}
	};

	const handleSettingChange = (tool) => (field) => (newValue) => {
		setSettingsStorage((prev) => ({
			...prev,
			[tool]: {
				...prev[tool],
				[field]: newValue,
			},
		}));
	};

	const handleTranslatePart = (posDelta) => {
		partsStorageAPI((api) => {
			api.translateParts([{ id: selectedPart.id, posDelta }]);
			api.selectPart(selectedPart.id);
			api.commit();
		});
	};

	const handleRotatePart = (rotDelta) => {
		partsStorageAPI((api) => {
			api.rotateParts([{ id: selectedPart.id, rotDelta }]);
			api.selectPart(selectedPart.id);
			api.commit();
		});
	};

	const otherSide = (side) => {
		if (side === "front") {
			return "rear";
		} else if (side === "rear") {
			return "front";
		} else {
			return null;
		}
	};

	const handleChangeSegmentProperties = (segmentName, newProperties) => {
		const list = [{ id: selectedPart.id, segmentName, newProperties }];

		if (settingsStorage.move.autoResizeParts) {
			selectedPart.attachedParts.forEach((ap) => {
				if (ap.place === segmentName) list.push({ id: ap.id, segmentName: otherSide(ap.place), newProperties });
			});
			selectedPart.attachedToParts.forEach((atp) => {
				if (atp.place === segmentName) list.push({ id: atp.id, segmentName: otherSide(atp.place), newProperties });
			});
		}

		partsStorageAPI((api) => {
			api.updPartsSegmentNameProps(list);
			api.selectPart(selectedPart.id);
			api.commit();
		});
	};

	const handleChangeCenterProperties = (newProperties) => {
		const list = [];
		const translateList = [];

		// === Вспомогательная функция: добавляет обновление сегмента ===
		const addUpdate = (id, segmentName, newProperties) => {
			list.push({ id, segmentName, newProperties });
		};

		const key = Object.keys(newProperties)[0]; // берём первый изменённый ключ

		if (key === "offset") {
			const { offset } = newProperties;
			const xOffsetDelta = selectedPart.fuselage.offset[0] - offset[0];
			const zOffsetDelta = selectedPart.fuselage.offset[1] - offset[1];
			const lengthDelta = selectedPart.fuselage.offset[2] - offset[2];
			selectedPart.attachedParts.forEach((ap) => {
				translateList.push({ id: ap.id, posDelta: localPosDelta([-xOffsetDelta, -zOffsetDelta, -lengthDelta / 2], selectedPart.rot) });
			});
			selectedPart.attachedToParts.forEach((atp) => {
				translateList.push({ id: atp.id, posDelta: localPosDelta([xOffsetDelta, zOffsetDelta, lengthDelta / 2], selectedPart.rot) });
			});
		} else {
			const prev = { pinchX: selectedPart.fuselage.pinchXAvg, pinchY: selectedPart.fuselage.pinchYAvg, angle: selectedPart.fuselage.angleAvg };
			newProperties = { ...prev, ...newProperties };
			addUpdate(selectedPart.id, "front", newProperties);
			addUpdate(selectedPart.id, "rear", newProperties);

			if (settingsStorage.move.autoResizeParts) {
				selectedPart.attachedParts.forEach((ap) => {
					addUpdate(ap.id, otherSide(ap.place), newProperties);
				});
				selectedPart.attachedToParts.forEach((atp) => {
					addUpdate(atp.id, otherSide(atp.place), newProperties);
				});
			}
		}

		partsStorageAPI((api) => {
			api.translateParts(translateList);
			api.updShapeCenter(selectedPart.id, newProperties);
			api.updPartsSegmentNameProps(list);
			api.selectPart(selectedPart.id);
			api.commit();
		});
	};

	const handlePrevPart = () => {
		selectedPart.attachedParts.forEach((attachedPart) => {
			if (attachedPart.place === "rear") {
				partsStorageAPI((api) => {
					api.selectPart(attachedPart.id);
					api.commit();
				});
				return;
			}
		});
	};
	const handleNextPart = () => {
		selectedPart.attachedParts.forEach((attachedPart) => {
			if (attachedPart.place === "front") {
				partsStorageAPI((api) => {
					api.selectPart(attachedPart.id);
					api.commit();
				});
			}
		});
	};

	const handleClickAttached = (apID) => {
		partsStorageAPI((api) => {
			api.selectPart(apID);
			api.commit();
		});
	};

	const handleDeleteAttached = (apID) => {
		partsStorageAPI((api) => {
			api.disconnectPart(apID);
			api.selectPart(selectedPart.id);
			api.commit();
		});
	};

	const handleColorChange = (color) => {
		setSettingsStorage((prev) => ({
			...prev,
			paint: {
				...prev.paint,
				selected: color,
			},
		}));
	};

	if (!partsIconsRef.current) {
		const arr = [];
		for (let partType in partTypeRegistry) {
			arr.push({
				type: partType,
				name: partType.charAt(0).toUpperCase() + partType.slice(1),
				icon: <PartIconView partType={partType} size={128} />,
				description: `Description for ${partType}`,
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
						handleSettingChange={handleSettingChange}
						handleTranslatePart={handleTranslatePart}
						handlePrevPart={handlePrevPart}
						handleNextPart={handleNextPart}
						handleChangeCenterProperties={handleChangeCenterProperties}
						handleRotatePart={handleRotatePart}
						handleDeleteAttached={handleDeleteAttached}
						handleClickAttached={handleClickAttached}
						handleColorChange={handleColorChange}
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
