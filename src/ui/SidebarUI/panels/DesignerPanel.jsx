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
	handleSettingChange,
	handleTranslatePart,
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

	const deg2rad = (value) => (value * Math.PI) / 180;
	const rad2deg = (value) => value * (180 / Math.PI);

	const handlePropertiesChange = (field) => (newValue) => {
		if (selectedSection === "center") {
			let newProps;
			if (field === "length" || field === "zOffset" || field === "xOffset") {
				console.log("newValue",newValue);
				
				let offset = [...selectedPart.fuselage.offset];
				offset[field === "length" ? 2 : field === "zOffset" ? 1 : 0] = newValue;
				newProps = { offset };
			} else {
				newProps = { [field]: newValue / 100 };
			}
			handleChangeCenterProperties(newProps);
		} else if (selectedSection === "front" || selectedSection === "rear") {
			let newProps;
			if (field === "corners") {
				newProps = {
					corners: new Array(4).fill(newValue / 100),
				};
			} else if (field.includes("corner")) {
				let corners = selectedPart.fuselage[selectedSection].corners;
				corners[parseInt(field.split("corner")[1]) - 1] = newValue / 100;
				newProps = { corners };
			} else if (field == "height" || field == "width") {
				let scale = selectedPart.fuselage[selectedSection].scale;
				scale[field === "height" ? 1 : 0] = newValue;
				newProps = { scale };
			} else if (field == "pointsCount") {
				newProps = { [field]: newValue };
			} else {
				newProps = { [field]: newValue / 100 };
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
		if (pos[field] !== undefined) posDelta[pos[field]] += newValue - selectedPart.position[pos[field]];

		if (settingsStorage.translate.direction === "Local") {
			handleTranslatePart(localPosDelta(posDelta, selectedPart.rotation));
		} else {
			handleTranslatePart(posDelta);
		}
	};

	const handleRotateChange = (field) => (newValue) => {
		let rotDelta = [0, 0, 0];
		const rot = {
			xAngle: 0,
			yAngle: 1,
			zAngle: 2,
		};
		if (rot[field] !== undefined) rotDelta[rot[field]] += deg2rad(newValue - rad2deg(selectedPart.rotation[rot[field]]));

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

		switch (activeSubToolId) {
			case "MOVE": {
				const settings = settingsStorage.move;
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
				const settings = settingsStorage.translate;
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
							value={selectedPart.position[0]}
							onChange={handleTranslateChange("xPos")}
							step={settings.gridSize}
							precision={3}
							labelColor="#ED4245"
						/>
						<NumericStepper
							label="Y-Pos"
							value={selectedPart.position[1]}
							onChange={handleTranslateChange("yPos")}
							step={settings.gridSize}
							precision={3}
							labelColor="#3BA55D"
						/>
						<NumericStepper
							label="Z-Pos"
							value={selectedPart.position[2]}
							onChange={handleTranslateChange("zPos")}
							step={settings.gridSize}
							precision={3}
							labelColor="#3B82F6"
						/>
					</>
				);
			}
			case "ROTATE": {
				const settings = settingsStorage.rotate;
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
							value={rad2deg(selectedPart.rotation[0])}
							onChange={handleRotateChange("xAngle")}
							step={settings.angleStep}
							precision={0}
							labelColor="#ED4245"
						/>
						<NumericStepper
							label="Y-Angle"
							value={rad2deg(selectedPart.rotation[1])}
							onChange={handleRotateChange("yAngle")}
							step={settings.angleStep}
							precision={0}
							labelColor="#3BA55D"
						/>
						<NumericStepper
							label="Z-Angle"
							value={rad2deg(selectedPart.rotation[2])}
							onChange={handleRotateChange("zAngle")}
							step={settings.angleStep}
							precision={0}
							labelColor="#3B82F6"
						/>
					</>
				);
			}
			case "RESHAPE": {
				const settings = settingsStorage.reshape;
				const fuselage = selectedPart.fuselage;
				if (!fuselage) return null;
				const segment = fuselage[selectedSection];
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

						{selectedSection === "center" ? (
							<>
								<NumericStepper
									label="Length"
									value={fuselage.offset[2]}
									onChange={handlePropertiesChange("length")}
									step={settings.gridSize}
									precision={2}
									min={0}
									max={100}
								/>
								<NumericStepper
									label="X-Offset"
									value={fuselage.offset[0]}
									onChange={handlePropertiesChange("xOffset")}
									step={settings.gridSize}
									precision={2}
									min={-50}
									max={50}
								/>
								<NumericStepper
									label="Z-Offset"
									value={fuselage.offset[1]}
									onChange={handlePropertiesChange("zOffset")}
									step={settings.gridSize}
									precision={2}
									min={-50}
									max={50}
								/>
								<SensitivitySlider
									label="Pinch X"
									value={fuselage.pinchXAvg * 100}
									onChange={handlePropertiesChange("pinchX")}
									min={-100}
									displayTransformer={(v) => (v === 0 ? "None" : `${v}%`)}
								/>
								<SensitivitySlider
									label="Pinch Y"
									value={fuselage.pinchYAvg * 100}
									onChange={handlePropertiesChange("pinchY")}
									min={-100}
									displayTransformer={(v) => (v === 0 ? "None" : `${v}%`)}
								/>
								<SensitivitySlider
									label="Angle"
									value={fuselage.angleAvg * 100}
									onChange={handlePropertiesChange("angle")}
									min={-100}
									displayTransformer={(v) => (v === 0 ? "None" : `${v}%`)}
								/>
							</>
						) : (
							<>
								<NumericStepper
									label="Points"
									value={segment.pointsCount}
									onChange={handlePropertiesChange("pointsCount")}
									step={segment.pointsCount * 1.06}
									precision={0}
									min={4}
									max={32}
									readOnly
								/>
								<NumericStepper
									label="Width"
									value={segment.scale[0]}
									onChange={handlePropertiesChange("width")}
									step={settings.gridSize}
									precision={2}
									min={0}
								/>
								<NumericStepper
									label="Height"
									value={segment.scale[1]}
									onChange={handlePropertiesChange("height")}
									step={settings.gridSize}
									precision={2}
									min={0}
								/>
								<SensitivitySlider label="Corner Radius" value={segment.cornersAvg * 100} onChange={handlePropertiesChange("corners")} />

								{segment.corners.map((c, i) => (
									<SensitivitySlider key={i} label={`Corner ${i + 1}`} value={c * 100} onChange={handlePropertiesChange(`corner${i + 1}`)} />
								))}

								{segment.clamps.map((c, i) => (
									<SensitivitySlider
										key={i}
										label={`Clamp ${i + 1}`}
										value={c * 100}
										onChange={handlePropertiesChange(`clamp${i}`)}
										displayTransformer={(v) => (v === 0 ? "None" : `${v}%` + 1)}
									/>
								))}

								<SensitivitySlider
									label="Pinch X"
									value={segment.pinchX * 100}
									onChange={handlePropertiesChange("pinchX")}
									min={-100}
									displayTransformer={(v) => (v === 0 ? "None" : `${v}%`)}
								/>
								<SensitivitySlider
									label="Pinch Y"
									value={segment.pinchY * 100}
									onChange={handlePropertiesChange("pinchY")}
									min={-100}
									displayTransformer={(v) => (v === 0 ? "None" : `${v}%`)}
								/>
								<SensitivitySlider
									label="Slant"
									value={segment.slant * 100}
									onChange={handlePropertiesChange("slant")}
									min={-100}
									displayTransformer={(v) => (v === 0 ? "None" : `${v}%`)}
								/>
								<SensitivitySlider
									label="Angle"
									value={segment.angle * 100}
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
				const settings = settingsStorage.paint;
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
				//const { partName, attachPoints } = settingsStorage.connections;
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
