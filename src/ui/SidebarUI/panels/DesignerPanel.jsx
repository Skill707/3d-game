import React from "react";
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
import { Box, Paper, Typography, IconButton, Switch, FormControlLabel } from "@mui/material";
import { NumericStepper } from "../components/NumericStepper";
import { OptionStepper } from "../components/OptionStepper";
import { SensitivitySlider } from "../components/SensitivitySlider";
import { SelectionChanger } from "../components/SelectionChanger";
import { ConnectionItem } from "../components/ConnectionItem";
import "./styles/DesignerPanel.css";
import { useAtom } from "jotai";
import { partsAtom } from "../../../state/atoms";

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

export function DesignerPanel({ onClose, activeSubToolId, setActiveSubToolId }) {
	const activeTool = subTools.find((t) => t.id === activeSubToolId) || subTools[0];
	const shapeTypes = ["Profile", "Corners"];
	const [currentShapeIndex, setCurrentShapeIndex] = React.useState(0);
	const [partsStorage, setPartsStorage] = useAtom(partsAtom);
	const parts = partsStorage.parts;
	const selectedID = partsStorage.selectedID;
	const selectedPart = parts.find((p) => p.id === selectedID) || null;
	const selectedPartPos = selectedPart ? selectedPart.pos : [0, 0, 0];

	const [toolSettings, setToolSettings] = React.useState({
		move: {
			gridSize: 0.05,
			attachmentAngle: 15,
		},
		translate: {
			gridSize: 0.05,
			mode: "Connected",
			direction: "Local",
			xPos: 0,
			yPos: 0,
			zPos: 0,
		},
		rotate: {
			angleStep: 15,
			mode: "Connected",
			direction: "Local",
			sensitivity: 50,
			xAngle: 90,
			yAngle: 0,
			zAngle: 0,
		},
		reshape: {
			gridSize: 0.05,
			// Profile Shape
			length: 2,
			xOffset: 0,
			zOffset: 0,
			pinch: 0, // 0 will be displayed as 'None'
			slant: 0,
			// Corners Shape
			width: 1.45,
			depth: 1.5,
			cornerRadius: 100,
			corner1: 100,
			corner2: 100,
			corner3: 100,
			corner4: 100,
			clamp1: -100,
			clamp2: 100,
			clamp3: -100,
			clamp4: 100,
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

	const handleSettingChange = (tool) => (field) => (newValue) => {
		setToolSettings((prev) => ({
			...prev,
			[tool]: {
				...prev[tool],
				[field]: newValue,
			},
		}));
	};

	const handlePrevShape = () => setCurrentShapeIndex((prev) => (prev - 1 + shapeTypes.length) % shapeTypes.length);
	const handleNextShape = () => setCurrentShapeIndex((prev) => (prev + 1) % shapeTypes.length);
	const currentShapeType = shapeTypes[currentShapeIndex];

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
						<SelectionChanger label="Change part selection" onPrev={handlePrevShape} onNext={handleNextShape} />
						<hr className="tool-separator" />

						{currentShapeType === "Profile" && (
							<>
								<NumericStepper label="Length" value={settings.length} onChange={handleChange("length")} step={0.1} precision={2} />
								<NumericStepper label="X-Offset" value={settings.xOffset} onChange={handleChange("xOffset")} step={0.1} precision={2} />
								<NumericStepper label="Z-Offset" value={settings.zOffset} onChange={handleChange("zOffset")} step={0.1} precision={2} />
								<SensitivitySlider
									label="Pinch"
									value={settings.pinch}
									onChange={handleChange("pinch")}
									min={-100}
									displayTransformer={(v) => (v === 0 ? "None" : `${v}%`)}
								/>
								<SensitivitySlider label="Slant" value={settings.slant} onChange={handleChange("slant")} min={-100} />
							</>
						)}

						{currentShapeType === "Corners" && (
							<>
								<NumericStepper label="Width" value={settings.width} onChange={handleChange("width")} step={0.05} precision={2} />
								<NumericStepper label="Depth" value={settings.depth} onChange={handleChange("depth")} step={0.1} precision={2} />
								<SensitivitySlider label="Corner Radius" value={settings.cornerRadius} onChange={handleChange("cornerRadius")} />
								<SensitivitySlider label="Corner 1" value={settings.corner1} onChange={handleChange("corner1")} />
								<SensitivitySlider label="Corner 2" value={settings.corner2} onChange={handleChange("corner2")} />
								<SensitivitySlider label="Corner 3" value={settings.corner3} onChange={handleChange("corner3")} />
								<SensitivitySlider label="Corner 4" value={settings.corner4} onChange={handleChange("corner4")} />
								<SensitivitySlider label="Clamp 1" value={settings.clamp1} onChange={handleChange("clamp1")} min={-100} />
								<SensitivitySlider label="Clamp 2" value={settings.clamp2} onChange={handleChange("clamp2")} min={-100} />
								<SensitivitySlider label="Clamp 3" value={settings.clamp3} onChange={handleChange("clamp3")} min={-100} />
								<SensitivitySlider label="Clamp 4" value={settings.clamp4} onChange={handleChange("clamp4")} min={-100} />
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
								const part = parts.find((p) => p.id === id);
								return <ConnectionItem key={id} connection={part} onToggle={handleConnectionToggle} onDelete={handleConnectionDelete} />;
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
