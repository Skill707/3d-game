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
import { Paper, IconButton, Switch, FormControlLabel } from "@mui/material";
import { NumericStepper } from "../components/NumericStepper";
import { OptionStepper } from "../components/OptionStepper";
import { SensitivitySlider } from "../components/SensitivitySlider";
import { SelectionChanger } from "../components/SelectionChanger";
import { ConnectionItem } from "../components/ConnectionItem";
import "./styles/DesignerPanel.css";

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

const MuiToggleSwitch = ({ label, defaultChecked = false }) => (
	<FormControlLabel
		control={<Switch defaultChecked={defaultChecked} />}
		label={label}
		sx={{ justifyContent: "space-between", width: "100%", ml: 0, mr: 0, color: "var(--text-color)", ".MuiFormControlLabel-label": { fontSize: "0.9rem" } }}
	/>
);

const ColorPalette = () => {
	const colors = [
		"#FFFFFF",
		"#3B82F6",
		"#C0C0C0",
		"#808080",
		"#000000",
		"#FFFFFF",
		"#C0C0C0",
		"#FFFFFF",
		"#C0C0C0",
		"#FFFFFF",
		"#000000",
		"#F97316",
		"#EF4444",
		"#22C55E",
		"#FFFFFF",
		"#000000",
		"#3B82F6",
		"#C0C0C0",
		"#EF4444",
		"#A955F7",
		"#1E3A8A",
		"#FDE047",
		"#FFFFFF",
		"#C0C0C0",
		"#808080",
	];
	return (
		<div className="color-grid">
			{colors.map((c, i) => (
				<div key={i} className="color-swatch" style={{ backgroundColor: c }}></div>
			))}
		</div>
	);
};

export function DesignerPanel({ onClose, activeSubToolId, setActiveSubToolId, selectedPart, handleChangeSegmentProperties }) {
	const activeTool = subTools.find((t) => t.id === activeSubToolId) || subTools[0];
	const [seclectedSection, seclectSection] = useState("center");

	const selectedPartPos = selectedPart ? selectedPart.pos : [0, 0, 0];

	const [toolSettings, setToolSettings] = useState({
		move: {
			gridSize: 0.05,
			attachmentAngle: 15,
		},
		translate: {
			gridSize: 0.05,
			mode: "Connected",
			direction: "Local",
			xPos: selectedPart.pos[0],
			yPos: selectedPart.pos[1],
			zPos: selectedPart.pos[2],
		},
		rotate: {
			angleStep: 15,
			mode: "Connected",
			direction: "Local",
			sensitivity: 50,
			xAngle: selectedPart.rot[0],
			yAngle: selectedPart.rot[1],
			zAngle: selectedPart.rot[2],
		},
		reshape: {
			gridSize: 0.25,
		},
		paint: {
			target: "Primary",
			theme: "Custom",
		},
		connections: {
			partName: "FUEL TANK #502",
			viewMode: "all",
			attachPoints: [
				{ id: 1, type: "surface", name: "Surface", connectedTo: "Fuel Tank #503 - Rotate", enabled: true },
				{ id: 2, type: "fuel", name: "Bottom", connectedTo: "Griffin Engine #501 - Top", enabled: true },
				{ id: 3, type: "fuel", name: "Top", connectedTo: "Fuel Tank #497 - Bottom", enabled: true },
				{ id: 4, type: "rotate", name: "Rotate", connectedTo: null, enabled: true },
				{ id: 5, type: "shell", name: "Top(Shell)", connectedTo: "Fuel Tank #497 - Bottom(She", enabled: true },
				{ id: 6, type: "shell", name: "Bottom(Shell)", connectedTo: "Griffin Engine #501 - Top(She", enabled: false },
			],
		},
	});

	const segments = selectedPart.shapeSegments;

	const handleSettingChange = (tool) => (field) => (newValue) => {
		setToolSettings((prev) => ({
			...prev,
			[tool]: {
				...prev[tool],
				[field]: newValue,
			},
		}));
	};

	const handlePropertiesChange = (field) => (newValue) => {
		const newProps = { [field]: newValue };
		handleChangeSegmentProperties(seclectedSection, newProps);
	};

	// setCurrentShapeIndex((prev) => (prev - 1 + shapeTypes.length) % shapeTypes.length)
	//const currentShapeType = shapeTypes[currentShapeIndex];
	const handleSeclectSection = (name) => seclectSection(name);
	const handlePrevPart = () => {};
	const handleNextPart = () => {};

	const handleConnectionToggle = (id) => {
		setToolSettings((prev) => ({
			...prev,
			connections: {
				...prev.connections,
				attachPoints: prev.connections.attachPoints.map((p) => (p.id === id ? { ...p, enabled: !p.enabled } : p)),
			},
		}));
	};

	const handleConnectionDelete = (id) => {
		setToolSettings((prev) => ({
			...prev,
			connections: {
				...prev.connections,
				attachPoints: prev.connections.attachPoints.filter((p) => p.id !== id),
			},
		}));
	};

	const handleAddConnection = () => {
		const newConnection = {
			id: Date.now(),
			type: "rotate",
			name: "New Connection",
			connectedTo: null,
			enabled: true,
		};
		setToolSettings((prev) => ({
			...prev,
			connections: {
				...prev.connections,
				attachPoints: [...prev.connections.attachPoints, newConnection],
			},
		}));
	};

	const renderContent = () => {
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
						<MuiToggleSwitch label="Show Resize Gizmos" defaultChecked />
						<MuiToggleSwitch label="Auto Rotate Parts" defaultChecked />
						<MuiToggleSwitch label="Show Attach Points" defaultChecked />
						<MuiToggleSwitch label="Attach To Surfaces" defaultChecked />
						<MuiToggleSwitch label="Auto Resize Parts" defaultChecked />
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
							value={selectedPartPos[0]}
							onChange={handleChange("xPos")}
							step={0.001}
							precision={3}
							labelColor="#ED4245"
						/>
						<NumericStepper
							label="Y-Pos"
							value={selectedPartPos[1]}
							onChange={handleChange("yPos")}
							step={0.001}
							precision={3}
							labelColor="#3BA55D"
						/>
						<NumericStepper
							label="Z-Pos"
							value={selectedPartPos[2]}
							onChange={handleChange("zPos")}
							step={0.001}
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
							step={1}
							min={1}
							max={90}
							precision={0}
						/>
						<OptionStepper label="Mode" value={settings.mode} onChange={handleChange("mode")} options={["Connected", "Free"]} />
						<OptionStepper label="Direction" value={settings.direction} onChange={handleChange("direction")} options={["Local", "World"]} />
						<SensitivitySlider label="Sensitivity" value={settings.sensitivity} onChange={handleChange("sensitivity")} />
						<hr className="tool-separator" />
						<h3 className="tool-sub-header">ROTATION</h3>
						<NumericStepper label="X-Angle" value={settings.xAngle} onChange={handleChange("xAngle")} step={1} precision={0} labelColor="#ED4245" />
						<NumericStepper label="Y-Angle" value={settings.yAngle} onChange={handleChange("yAngle")} step={1} precision={0} labelColor="#3BA55D" />
						<NumericStepper label="Z-Angle" value={settings.zAngle} onChange={handleChange("zAngle")} step={1} precision={0} labelColor="#3B82F6" />
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
							label="Change part selection"
							handlePrevPart={handlePrevPart}
							handleSeclectSection={handleSeclectSection}
							handleNextPart={handleNextPart}
						/>
						<hr className="tool-separator" />

						{seclectedSection === "center" && (
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
								<SensitivitySlider label="Slant F" value={segments.center.slantF} onChange={handlePropertiesChange("slantF")} min={-100} />
								<SensitivitySlider label="Slant B" value={segments.center.slantB} onChange={handlePropertiesChange("slantB")} min={-100} />
							</>
						)}

						{seclectedSection !== "center" && (
							<>
								<NumericStepper
									label="Points"
									value={segments[seclectedSection].pointsCount}
									onChange={handlePropertiesChange("pointsCount")}
									step={segments[seclectedSection].pointsCount * 1.06}
									precision={0}
									min={4}
									max={32}
									readOnly
								/>
								<NumericStepper
									label="Width"
									value={segments[seclectedSection].width}
									onChange={handlePropertiesChange("width")}
									step={settings.gridSize}
									precision={2}
									min={0}
								/>
								<NumericStepper
									label="Height"
									value={segments[seclectedSection].height}
									onChange={handlePropertiesChange("height")}
									step={settings.gridSize}
									precision={2}
									min={0}
								/>
								<SensitivitySlider
									label="Corner Radius"
									value={segments[seclectedSection].corners}
									onChange={handlePropertiesChange("corners")}
								/>
								<SensitivitySlider label="Corner 1" value={segments[seclectedSection].corner1} onChange={handlePropertiesChange("corner1")} />
								<SensitivitySlider label="Corner 2" value={segments[seclectedSection].corner2} onChange={handlePropertiesChange("corner2")} />
								<SensitivitySlider label="Corner 3" value={segments[seclectedSection].corner3} onChange={handlePropertiesChange("corner3")} />
								<SensitivitySlider label="Corner 4" value={segments[seclectedSection].corner4} onChange={handlePropertiesChange("corner4")} />
								{/*
								<SensitivitySlider label="Clamp 1" value={segments[seclectedSection].clamp1} onChange={handleChange("clamp1")} min={-100} />
								<SensitivitySlider label="Clamp 2" value={segments[seclectedSection].clamp2} onChange={handleChange("clamp2")} min={-100} />
								<SensitivitySlider label="Clamp 3" value={segments[seclectedSection].clamp3} onChange={handleChange("clamp3")} min={-100} />
								<SensitivitySlider label="Clamp 4" value={segments[seclectedSection].clamp4} onChange={handleChange("clamp4")} min={-100} />
								*/}
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
				const { partName, attachPoints } = toolSettings.connections;
				return (
					<>
						<h3 className="connection-part-name">{partName}</h3>
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
						<h4 className="connection-attach-points">{attachPoints.length} x ATTACH POINTS</h4>
						<div className="connection-list">
							{selectedPart.attachedPartIDs.map((id) => {
								//const part = parts.find((p) => p.id === id);
								//return <ConnectionItem key={id} connection={part} onToggle={handleConnectionToggle} onDelete={handleConnectionDelete} />;
							})}
							<button className="add-connection-btn" onClick={handleAddConnection}>
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
