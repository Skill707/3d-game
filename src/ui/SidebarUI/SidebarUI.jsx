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
import { shapeRegistry } from "../../utils/partFactory";
import { PartIconView } from "./components/PartIconView";
import partsStorageAtom from "../../state/partsStorageAtom";
import { useKeyboardControls } from "@react-three/drei";

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
	};

	const pressedKey = useKeyboardControls((state) => state);
	const lastPressed = useRef(Object.fromEntries(Object.keys(pressedKey).map((k) => [k, false])));
	useEffect(() => {
		const actions = {
			nextTool: () => {
				const toolOrder = ["MOVE", "TRANSLATE", "ROTATE", "RESHAPE"];
				setSettingsStorage((prev) => {
					const currentTool = prev.activeSubToolId;
					const currentIndex = toolOrder.indexOf(currentTool);
					const newIndex = (currentIndex + 1) % toolOrder.length;
					return { ...prev, activeSubToolId: toolOrder[newIndex] };
				});
			},
			paintTool: () => {
				setSettingsStorage((prev) => {
					return { ...prev, activeSubToolId: "PAINT" };
				});
				if (activePanel !== "DESIGNER") setActivePanel("DESIGNER");
			},
			connections: () => {
				setSettingsStorage((prev) => {
					return { ...prev, activeSubToolId: "CONNECTIONS" };
				});
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
		};

		for (const [name, value] of Object.entries(pressedKey)) {
			const wasPressed = lastPressed.current[name];
			if (!wasPressed && value && actions[name]) actions[name]();
			lastPressed.current[name] = value;
		}
	}, [pressedKey, setSettingsStorage]);

	const handlePanelToggle = (panelId) => {
		setActivePanel((current) => (current === panelId ? null : panelId));
		if (panelId !== "DESIGNER") {
			setSettingsStorage((prev) => {
				return { ...prev, activeSubToolId: "MOVE" };
			});
		}
	};

	const handleMovePart = (posDelta) => {
		partsStorageAPI((api) => {
			api.translateParts([{ id: selectedPart.id, posDelta }]);
			api.selectPartID(selectedPart.id);
			api.commit();
		});
	};

	const handleRotatePart = (rotDelta) => {
		partsStorageAPI((api) => {
			api.rotateParts([{ id: selectedPart.id, rotDelta }]);
			api.selectPartID(selectedPart.id);
			api.commit();
		});
	};

	const otherSide = (side) => {
		if (side === "front") {
			return "back";
		} else if (side === "back") {
			return "front";
		} else {
			return null;
		}
	};

	const handleChangeSegmentProperties = (segmentName, newProperties) => {
		const list = [{ id: selectedPart.id, segmentName, newProperties }];

		if (settingsStorage.move.autoResizeParts) {
			selectedPart.attachedParts.forEach((ap) => {
				if (ap.name === segmentName) list.push({ id: ap.id, segmentName: otherSide(ap.name), newProperties });
			});
			if (selectedPart.attachedToPart && segmentName === otherSide(selectedPart.attachedToPart.name)) {
				list.push({ id: selectedPart.attachedToPart.id, segmentName: selectedPart.attachedToPart.name, newProperties });
			}
		}

		partsStorageAPI((api) => {
			api.updPartsSegmentNameProps(list);
			api.selectPartID(selectedPart.id);
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

		if (["length", "zOffset", "xOffset"].includes(key)) {
			// если меняем геометрию — пересчёт позиций
			const { length, zOffset, xOffset } = newProperties;
			const lengthDelta = selectedPart.shapeSegments.center.length - length;
			const zOffsetDelta = selectedPart.shapeSegments.center.zOffset - zOffset;
			const xOffsetDelta = selectedPart.shapeSegments.center.xOffset - xOffset;

			// основной part
			addUpdate(selectedPart.id, "front", { pos: [xOffset, zOffset, length / 2] });
			addUpdate(selectedPart.id, "back", { pos: [-xOffset, -zOffset, -length / 2] });

			selectedPart.attachedParts.forEach((ap) => {
				translateList.push({ id: ap.id, posDelta: [-xOffsetDelta, -zOffsetDelta, -lengthDelta / 2] });
			});
			if (selectedPart.attachedToPart) {
				translateList.push({ id: selectedPart.attachedToPart.id, posDelta: [xOffsetDelta, zOffsetDelta, lengthDelta / 2] });
			}
		} else {
			addUpdate(selectedPart.id, "front", newProperties);
			addUpdate(selectedPart.id, "back", newProperties);

			if (settingsStorage.move.autoResizeParts) {
				selectedPart.attachedParts.forEach((ap) => {
					addUpdate(ap.id, otherSide(ap.name), newProperties);
				});
				if (selectedPart.attachedToPart) {
					addUpdate(selectedPart.attachedToPart.id, selectedPart.attachedToPart.name, newProperties);
				}
			}
		}

		partsStorageAPI((api) => {
			api.translateParts(translateList);
			api.updShapeCenter(selectedPart.id, newProperties);
			api.updPartsSegmentNameProps(list);
			api.selectPartID(selectedPart.id);
			api.commit();
		});
	};

	const handlePrevPart = () => {
		selectedPart.attachedParts.forEach((attachedPart) => {
			if (attachedPart.name === "back") {
				partsStorageAPI((api) => {
					api.selectPartID(attachedPart.id);
					api.commit();
				});
				return;
			}
		});
		if (selectedPart.attachedToPart) {
			partsStorageAPI((api) => {
				api.selectPartID(selectedPart.attachedToPart);
				api.commit();
			});
		}
	};
	const handleNextPart = () => {
		selectedPart.attachedParts.forEach((attachedPart) => {
			if (attachedPart.name === "front") {
				partsStorageAPI((api) => {
					api.selectPartID(attachedPart.id);
					api.commit();
				});
			}
		});
	};

	const handleConnectionToggle = (partId) => {};

	const handleConnectionDelete = (partId) => {};

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
						handleChangeCenterProperties={handleChangeCenterProperties}
						handleRotatePart={handleRotatePart}
						handleConnectionToggle={handleConnectionToggle}
						handleConnectionDelete={handleConnectionDelete}
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
