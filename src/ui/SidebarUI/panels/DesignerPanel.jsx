import { useState } from "react";
import {
	Close as CloseIcon,
	NearMe as CursorIcon,
	OpenWith as TranslateIcon,
	Sync as RotateIcon,
	AspectRatio as ReshapeIcon,
	Colorize as PaintIcon,
	Link as ConnectionsIcon,
	LinkOff as LinkOffIcon,
	ViewList as ViewListIcon,
	ViewModule as ViewModuleIcon,
	Add as AddIcon,
} from "@mui/icons-material";
import { motion } from "framer-motion";
import { Paper, IconButton, Switch, FormControlLabel, Box, Typography } from "@mui/material";
import { NumericStepper } from "../components/NumericStepper";
import { OptionStepper } from "../components/OptionStepper";
import { SensitivitySlider } from "../components/SensitivitySlider";
import { SelectionChanger } from "../components/SelectionChanger";
import { ConnectionItem } from "../components/ConnectionItem";
import "./styles/DesignerPanel.css";
import { localPosDelta } from "../../../utils/transformUtils";

// eslint-disable-next-line react-refresh/only-export-components
export const subTools = [
	{ id: "MOVE", icon: <CursorIcon />, title: "MOVE PART TOOL", color: "#00A8FC" },
	{ id: "TRANSLATE", icon: <TranslateIcon />, title: "TRANSLATE PART TOOL", color: "#3BA55D" },
	{ id: "ROTATE", icon: <RotateIcon />, title: "ROTATE PART TOOL", color: "#ED4245" },
	{ id: "RESHAPE", icon: <ReshapeIcon />, title: "PART SHAPE TOOL", color: "#00A8FC" },
	{ id: "PAINT", icon: <PaintIcon />, title: "PAINT TOOL", color: "#FAA61A" },
	{ id: "CONNECTIONS", icon: <ConnectionsIcon />, title: "PART CONNECTIONS", color: "#A970FF" },
];

const panelVariants = {
	hidden: { x: "-100%", opacity: 0, transition: { type: "tween", duration: 0.3, ease: "easeIn" } },
	visible: { x: 0, opacity: 1, transition: { type: "tween", duration: 0.3, ease: "easeOut" } },
	exit: { x: "-100%", opacity: 0, transition: { type: "tween", duration: 0.3, ease: "easeIn" } },
};

const MuiToggleSwitch = ({ label, checked = false, onChange }) => (
	<FormControlLabel
		control={<Switch defaultChecked={checked} onChange={(e) => onChange(e.target.checked)} />}
		label={label}
		sx={{
			justifyContent: "space-between",
			flexDirection: "row-reverse",
			width: "100%",
			ml: 0,
			mr: 0,
			color: "var(--text-color)",
			".MuiFormControlLabel-label": { fontSize: "0.9rem" },
		}}
	/>
);

export function DesignerPanel({
	onClose,
	activeSubToolId,
	setActiveSubToolId,
	selectedPart,
	handleChangeSegmentProperties,
	settingsStorage,
	setSettingsStorage,
	handleMovePart,
	handlePrevPart,
	handleNextPart,
	handleChangeCenterProperties,
	handleRotatePart,
	handleDeleteAttached,
	handleClickAttached,
	handleColorChange,
}) {
	const activeTool = subTools.find((t) => t.id === activeSubToolId) || subTools[0];
	const [selectedSection, selectSection] = useState("center");

	const toolSettings = settingsStorage;

	const deg2rad = (value) => (value * Math.PI) / 180;
	const rad2deg = (value) => value * (180 / Math.PI);

	const handleSettingChange = (tool) => (field) => (newValue) => {
		setSettingsStorage((prev) => ({
			...prev,
			[tool]: {
				...prev[tool],
				[field]: newValue,
			},
		}));
	};

	const handlePropertiesChange = (field) => (newValue) => {
		if (selectedSection === "center") {
			let newProps;
			if (field === "length" || field === "zOffset" || field === "xOffset") {
				const segments = selectedPart.shapeSegments;
				newProps = {
					length: segments.center.length,
					zOffset: segments.center.zOffset,
					xOffset: segments.center.xOffset,
					[field]: newValue,
				};
			} else {
				newProps = { [field]: newValue };
			}
			handleChangeCenterProperties(newProps);
		} else if (selectedSection === "front" || selectedSection === "back") {
			let newProps;
			if (field === "corners") {
				newProps = {
					corners: newValue,
					corner1: newValue,
					corner2: newValue,
					corner3: newValue,
					corner4: newValue,
				};
			} else {
				newProps = { [field]: newValue };
			}
			handleChangeSegmentProperties(selectedSection, newProps);
		}
	};

	const handleTranslateChange = (field) => (newValue) => {
		let posDelta = [0, 0, 0];
		const pos = {
			xPos: 0,
			yPos: 1,
			zPos: 2,
		};
		if (pos[field] !== undefined) posDelta[pos[field]] += newValue - selectedPart.pos[pos[field]];

		if (settingsStorage.translate.direction === "Local") {
			handleMovePart(localPosDelta(posDelta, selectedPart.rot));
		} else {
			handleMovePart(posDelta);
		}
	};

	const handleRotateChange = (field) => (newValue) => {
		let rotDelta = [0, 0, 0];

		const rot = {
			xAngle: 0,
			yAngle: 1,
			zAngle: 2,
		};

		if (rot[field] !== undefined) rotDelta[rot[field]] += deg2rad(newValue - rad2deg(selectedPart.rot[rot[field]]));

		handleRotatePart(rotDelta);
	};

	const handleSeclectSection = (name) => selectSection(name);

	const ColorPalette = () => {
		const colors = ["#FFFFFF", "#C0C0C0", "#808080", "#000000", "#F97316", "#EF4444", "#22C55E", "#3B82F6", "#A955F7", "#1E3A8A", "#FDE047", "green"];
		return (
			<div className="color-grid">
				{colors.map((c, i) => (
					<div key={i} className="color-swatch" style={{ backgroundColor: c }} onClick={() => handleColorChange(c)}></div>
				))}
			</div>
		);
	};

	const renderContent = () => {
		if (!selectedPart && activeSubToolId !== "PAINT") {
			return (
				<Box className="part-properties-empty">
					<Typography>Select a part to view its customizable properties.</Typography>
				</Box>
			);
		}
		const segments = selectedPart?.shapeSegments;

		switch (activeSubToolId) {
			case "MOVE": {
				const settings = toolSettings.move;
				const handleChange = handleSettingChange("move");
				return (
					<>
						<NumericStepper label="Grid Size" value={settings.gridSize} onChange={handleChange("gridSize")} step={0.05} min={0} precision={2} />
						<NumericStepper
							label="Attachment Angle"
							value={settings.attachmentAngle}
							onChange={handleChange("attachmentAngle")}
							step={5}
							min={0}
							max={90}
							precision={0}
						/>
						<MuiToggleSwitch label="Show Resize Gizmos" checked={settings.showResizeGizmos} onChange={handleChange("showResizeGizmos")} />
						<MuiToggleSwitch label="Auto Rotate Parts" checked={settings.autoRotateParts} onChange={handleChange("autoRotateParts")} />
						<MuiToggleSwitch label="Show Attach Points" checked={settings.showAttachPoints} onChange={handleChange("showAttachPoints")} />
						<MuiToggleSwitch label="Attach To Surfaces" checked={settings.attachToSurfaces} onChange={handleChange("attachToSurfaces")} />
						<MuiToggleSwitch label="Auto Resize Parts" checked={settings.autoResizeParts} onChange={handleChange("autoResizeParts")} />
					</>
				);
			}
			case "TRANSLATE": {
				const settings = toolSettings.translate;
				const handleChange = handleSettingChange("translate");
				return (
					<>
						<NumericStepper label="Grid Size" value={settings.gridSize} onChange={handleChange("gridSize")} step={0.05} min={0} precision={2} />
						<OptionStepper label="Mode" value={settings.mode} onChange={handleChange("mode")} options={["Connected", "Free"]} />
						<OptionStepper label="Direction" value={settings.direction} onChange={handleChange("direction")} options={["Local", "World"]} />
						<hr className="tool-separator" />
						<h3 className="tool-sub-header">POSITION</h3>
						<NumericStepper
							label="X-Pos"
							value={selectedPart.pos[0]}
							onChange={handleTranslateChange("xPos")}
							step={settings.gridSize}
							precision={3}
							labelColor="#ED4245"
						/>
						<NumericStepper
							label="Y-Pos"
							value={selectedPart.pos[1]}
							onChange={handleTranslateChange("yPos")}
							step={settings.gridSize}
							precision={3}
							labelColor="#3BA55D"
						/>
						<NumericStepper
							label="Z-Pos"
							value={selectedPart.pos[2]}
							onChange={handleTranslateChange("zPos")}
							step={settings.gridSize}
							precision={3}
							labelColor="#3B82F6"
						/>
					</>
				);
			}
			case "ROTATE": {
				const settings = toolSettings.rotate;
				const handleChange = handleSettingChange("rotate");
				return (
					<>
						<NumericStepper
							label="Angle Step"
							value={settings.angleStep}
							onChange={handleChange("angleStep")}
							step={5}
							min={0.01}
							max={90}
							precision={0}
						/>
						<OptionStepper label="Mode" value={settings.mode} onChange={handleChange("mode")} options={["Connected", "Self"]} />
						<OptionStepper label="Direction" value={settings.direction} onChange={handleChange("direction")} options={["Local", "World"]} />
						<SensitivitySlider label="Sensitivity" value={settings.sensitivity} onChange={handleChange("sensitivity")} />
						<hr className="tool-separator" />
						<h3 className="tool-sub-header">ROTATION</h3>
						<NumericStepper
							label="X-Angle"
							value={rad2deg(selectedPart.rot[0])}
							onChange={handleRotateChange("xAngle")}
							step={settings.angleStep}
							precision={0}
							labelColor="#ED4245"
						/>
						<NumericStepper
							label="Y-Angle"
							value={rad2deg(selectedPart.rot[1])}
							onChange={handleRotateChange("yAngle")}
							step={settings.angleStep}
							precision={0}
							labelColor="#3BA55D"
						/>
						<NumericStepper
							label="Z-Angle"
							value={rad2deg(selectedPart.rot[2])}
							onChange={handleRotateChange("zAngle")}
							step={settings.angleStep}
							precision={0}
							labelColor="#3B82F6"
						/>
					</>
				);
			}
			case "RESHAPE": {
				const settings = toolSettings.reshape;
				const handleChange = handleSettingChange("reshape");
				return (
					<>
						<NumericStepper label="Grid Size" value={settings.gridSize} onChange={handleChange("gridSize")} step={0.05} min={0} precision={2} />
						<SelectionChanger
							label={selectedPart.objectName + selectedSection}
							handlePrevPart={handlePrevPart}
							handleSeclectSection={handleSeclectSection}
							handleNextPart={handleNextPart}
						/>
						<hr className="tool-separator" />

						{selectedSection === "center" && (
							<>
								<NumericStepper
									label="Length"
									value={segments.center.length}
									onChange={handlePropertiesChange("length")}
									step={settings.gridSize}
									precision={2}
									min={0}
									max={100}
								/>
								<NumericStepper
									label="X-Offset"
									value={segments.center.xOffset}
									onChange={handlePropertiesChange("xOffset")}
									step={settings.gridSize}
									precision={2}
									min={-50}
									max={50}
								/>
								<NumericStepper
									label="Z-Offset"
									value={segments.center.zOffset}
									onChange={handlePropertiesChange("zOffset")}
									step={settings.gridSize}
									precision={2}
									min={-50}
									max={50}
								/>
								<SensitivitySlider
									label="Pinch X"
									value={segments.center.pinchX}
									onChange={handlePropertiesChange("pinchX")}
									min={-100}
									displayTransformer={(v) => (v === 0 ? "None" : `${v}%`)}
								/>
								<SensitivitySlider
									label="Pinch Y"
									value={segments.center.pinchY}
									onChange={handlePropertiesChange("pinchY")}
									min={-100}
									displayTransformer={(v) => (v === 0 ? "None" : `${v}%`)}
								/>
								<SensitivitySlider
									label="Angle"
									value={segments.center.angle}
									onChange={handlePropertiesChange("angle")}
									min={-100}
									displayTransformer={(v) => (v === 0 ? "None" : `${v}%`)}
								/>
							</>
						)}

						{selectedSection !== "center" && (
							<>
								<NumericStepper
									label="Points"
									value={segments[selectedSection].pointsCount}
									onChange={handlePropertiesChange("pointsCount")}
									step={segments[selectedSection].pointsCount * 1.06}
									precision={0}
									min={4}
									max={32}
									readOnly
								/>
								<NumericStepper
									label="Width"
									value={segments[selectedSection].width}
									onChange={handlePropertiesChange("width")}
									step={settings.gridSize}
									precision={2}
									min={0}
								/>
								<NumericStepper
									label="Height"
									value={segments[selectedSection].height}
									onChange={handlePropertiesChange("height")}
									step={settings.gridSize}
									precision={2}
									min={0}
								/>
								<SensitivitySlider
									label="Corner Radius"
									value={segments[selectedSection].corners}
									onChange={handlePropertiesChange("corners")}
								/>
								<SensitivitySlider label="Corner 1" value={segments[selectedSection].corner1} onChange={handlePropertiesChange("corner1")} />
								<SensitivitySlider label="Corner 2" value={segments[selectedSection].corner2} onChange={handlePropertiesChange("corner2")} />
								<SensitivitySlider label="Corner 3" value={segments[selectedSection].corner3} onChange={handlePropertiesChange("corner3")} />
								<SensitivitySlider label="Corner 4" value={segments[selectedSection].corner4} onChange={handlePropertiesChange("corner4")} />

								<SensitivitySlider
									label="Clamp 1"
									value={segments[selectedSection].clamp1}
									onChange={handlePropertiesChange("clamp1")}
									displayTransformer={(v) => (v === 0 ? "None" : `${v}%`)}
								/>
								<SensitivitySlider
									label="Clamp 2"
									value={segments[selectedSection].clamp2}
									onChange={handlePropertiesChange("clamp2")}
									displayTransformer={(v) => (v === 0 ? "None" : `${v}%`)}
								/>
								<SensitivitySlider
									label="Clamp 3"
									value={segments[selectedSection].clamp3}
									onChange={handlePropertiesChange("clamp3")}
									displayTransformer={(v) => (v === 0 ? "None" : `${v}%`)}
								/>
								<SensitivitySlider
									label="Clamp 4"
									value={segments[selectedSection].clamp4}
									onChange={handlePropertiesChange("clamp4")}
									displayTransformer={(v) => (v === 0 ? "None" : `${v}%`)}
								/>
								<SensitivitySlider
									label="Pinch X"
									value={segments[selectedSection].pinchX}
									onChange={handlePropertiesChange("pinchX")}
									min={-100}
									displayTransformer={(v) => (v === 0 ? "None" : `${v}%`)}
								/>
								<SensitivitySlider
									label="Pinch Y"
									value={segments[selectedSection].pinchY}
									onChange={handlePropertiesChange("pinchY")}
									min={-100}
									displayTransformer={(v) => (v === 0 ? "None" : `${v}%`)}
								/>
								<SensitivitySlider
									label="Slant"
									value={segments[selectedSection].slant}
									onChange={handlePropertiesChange("slant")}
									min={-100}
									displayTransformer={(v) => (v === 0 ? "None" : `${v}%`)}
								/>
								<SensitivitySlider
									label="Angle"
									value={segments[selectedSection].angle}
									onChange={handlePropertiesChange("angle")}
									min={-100}
									displayTransformer={(v) => (v === 0 ? "None" : `${v}%`)}
								/>
							</>
						)}
					</>
				);
			}
			case "PAINT": {
				const settings = toolSettings.paint;
				const handleChange = handleSettingChange("paint");
				return (
					<>
						<OptionStepper
							label="Target"
							value={settings.target}
							onChange={handleChange("target")}
							options={["Primary", "Secondary", "Tertiary"]}
						/>
						<OptionStepper label="Theme" value={settings.theme} onChange={handleChange("theme")} options={["Custom", "Stock", "Classic"]} />
						<ColorPalette />
					</>
				);
			}
			case "CONNECTIONS": {
				//const { partName, attachPoints } = toolSettings.connections;
				return (
					<>
						<h3 className="connection-part-name">{selectedPart.name}</h3>
						<div className="connection-view-filters">
							<IconButton className="connection-filter-btn active">
								<ConnectionsIcon sx={{ color: "#A970FF" }} />
							</IconButton>
							<IconButton className="connection-filter-btn">
								<LinkOffIcon />
							</IconButton>
							<IconButton className="connection-filter-btn">
								<ViewListIcon />
							</IconButton>
							<IconButton className="connection-filter-btn">
								<ViewModuleIcon />
							</IconButton>
						</div>
						<h4 className="connection-attach-points">{selectedPart.attachedParts.length} x ATTACH POINTS</h4>
						<div className="connection-list">
							{selectedPart.attachedToParts.map((ap) => (
								<ConnectionItem
									key={ap.id}
									connection={{ id: ap.id, type: ap.place, name: ap.name }}
									onClick={handleClickAttached}
									onDelete={handleDeleteAttached}
								/>
							))}
							{selectedPart.attachedParts.map((ap) => (
								<ConnectionItem
									key={ap.id}
									connection={{ id: ap.id, type: ap.place, name: ap.name }}
									onClick={handleClickAttached}
									onDelete={handleDeleteAttached}
								/>
							))}
							<button className="add-connection-btn" onClick={null}>
								<AddIcon />
								<span>Add New Connection</span>
							</button>
						</div>
					</>
				);
			}
			default:
				return null;
		}
	};

	return (
		<motion.div className="panel-wrapper designer-panel-wrapper" variants={panelVariants} initial="hidden" animate="visible" exit="exit">
			<Paper className="panel-content">
				<div className="panel-header">
					<h3 className="panel-title">{activeTool.title}</h3>
					<IconButton onClick={onClose} className="panel-close-btn" aria-label="Close designer panel">
						<CloseIcon />
					</IconButton>
				</div>
				<div className="panel-body designer-panel-body">
					<div className="sub-tool-sidebar">
						{subTools.map((tool) => (
							<IconButton
								key={tool.id}
								className={`sub-tool-button ${tool.id === activeSubToolId ? "active" : ""}`}
								onClick={() => setActiveSubToolId(tool.id)}
								style={{ "--active-tool-color": tool.color }}
							>
								{tool.icon}
							</IconButton>
						))}
					</div>
					<div className="tool-content">{renderContent()}</div>
				</div>
			</Paper>
		</motion.div>
	);
}
