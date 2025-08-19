import React, { useState } from "react";
import { Close as CloseIcon } from "@mui/icons-material";
import { motion } from "framer-motion";
import { Box, Paper, Typography, IconButton } from "@mui/material";
import { OptionStepper } from "../components/OptionStepper";
import { ToggleSwitch } from "../components/ToggleSwitch";
import "./styles/ViewOptionsPanel.css";

const panelVariants = {
	hidden: { x: "-100%", opacity: 0, transition: { type: "tween", duration: 0.3, ease: "easeIn" } },
	visible: { x: 0, opacity: 1, transition: { type: "tween", duration: 0.3, ease: "easeOut" } },
	exit: { x: "-100%", opacity: 0, transition: { type: "tween", duration: 0.3, ease: "easeIn" } },
};

// Custom SVG Icons based on the image
const TargetIcon = ({ color }) => (
	<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
		<circle cx="12" cy="12" r="3" fill={color} stroke="none" />
		<path d="M12 4V8" />
		<path d="M12 16V20" />
		<path d="M4 12H8" />
		<path d="M16 12H20" />
	</svg>
);

const CameraRocketsIcon = ({ color }) => (
	<svg width="28" height="28" viewBox="0 0 28 28" fill={color}>
		<path d="M9 6h4v14H9z" />
		<path d="M15 6h4v14h-4z" />
		<path d="M11 4l-2 2h8l-2-2z" />
		<path d="M9 20l4 4 4-4H9z" />
	</svg>
);
const CameraRocketIcon = ({ color }) => (
	<svg width="28" height="28" viewBox="0 0 28 28" fill={color}>
		<path d="M12 6h4v14h-4z" />
		<path d="M14 4l-2 2h4l-2-2z" />
		<path d="M12 20l2 4 2-4h-4z" />
	</svg>
);
const CameraFreeIcon = ({ color }) => (
	<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
		<path d="M17 7L7 17" />
		<path d="M7 7L17 17" />
	</svg>
);

export function ViewOptionsPanel({ onClose }) {
	const [activeIndicator, setActiveIndicator] = useState("red");
	const [stage, setStage] = useState("ALL");
	const [activeCamera, setActiveCamera] = useState("rockets");
	const [showLiftVectors, setShowLiftVectors] = useState(false);
	const [pilot, setPilot] = useState(false);

	const centerIndicators = [
		{ id: "red", color: "#D9534F" },
		{ id: "blue", color: "#4A90E2" },
		{ id: "yellow", color: "#F0AD4E" },
	];

	const cameraOptions = [
		{ id: "rockets", icon: <CameraRocketsIcon color={activeCamera === "rockets" ? "#4A90E2" : "currentColor"} /> },
		{ id: "rocket", icon: <CameraRocketIcon color={activeCamera === "rocket" ? "#4A90E2" : "currentColor"} /> },
		{ id: "free", icon: <CameraFreeIcon color={activeCamera === "free" ? "#4A90E2" : "currentColor"} /> },
	];

	return (
		<motion.div className="panel-wrapper view-options-panel-wrapper" variants={panelVariants} initial="hidden" animate="visible" exit="exit">
			<Paper className="panel-content">
				<Box className="panel-header">
					<Typography variant="h3" className="panel-title">
						VIEW OPTIONS
					</Typography>
					<IconButton onClick={onClose} className="panel-close-btn" aria-label="Close view options panel">
						<CloseIcon />
					</IconButton>
				</Box>
				<Box className="panel-body view-options-panel-body">
					{/* CENTER INDICATORS */}
					<div className="view-section">
						<h4 className="view-section-title">CENTER INDICATORS</h4>
						<div className="view-button-group">
							{centerIndicators.map((indicator) => (
								<IconButton
									key={indicator.id}
									className={`view-icon-button ${activeIndicator === indicator.id ? "active" : ""}`}
									onClick={() => setActiveIndicator(indicator.id)}
									style={{ "--active-color": indicator.color }}
								>
									<TargetIcon color={indicator.color} />
								</IconButton>
							))}
						</div>
						<OptionStepper label="Stage" value={stage} onChange={setStage} options={["ALL", "1", "2", "3"]} />
					</div>

					{/* CAMERA OPTIONS */}
					<div className="view-section">
						<h4 className="view-section-title">CAMERA OPTIONS</h4>
						<div className="view-button-group">
							{cameraOptions.map((cam) => (
								<IconButton
									key={cam.id}
									className={`view-icon-button camera-btn ${activeCamera === cam.id ? "active" : ""}`}
									onClick={() => setActiveCamera(cam.id)}
								>
									{cam.icon}
								</IconButton>
							))}
						</div>
					</div>

					{/* OTHER */}
					<div className="view-section">
						<h4 className="view-section-title">OTHER</h4>
						<ToggleSwitch label="Show Lift Vectors" checked={showLiftVectors} onChange={setShowLiftVectors} />
						<ToggleSwitch label="Pilot" checked={pilot} onChange={setPilot} />
						<button className="view-bg-button">Background Color</button>
					</div>
				</Box>
			</Paper>
		</motion.div>
	);
}
