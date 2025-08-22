import React, { useState } from "react";
import { Close as CloseIcon, Check as CheckIcon } from "@mui/icons-material";
import { motion } from "framer-motion";
import { Box, Paper, Typography, IconButton, Tooltip } from "@mui/material";
import "./styles/ActivationGroupsPanel.css";

const panelVariants = {
	hidden: { x: "-100%", opacity: 0, transition: { type: "tween", duration: 0.3, ease: "easeIn" } },
	visible: { x: 0, opacity: 1, transition: { type: "tween", duration: 0.3, ease: "easeOut" } },
	exit: { x: "-100%", opacity: 0, transition: { type: "tween", duration: 0.3, ease: "easeIn" } },
};

const IconStages = () => (
	<svg
		width="24"
		height="24"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="1.5"
		strokeLinecap="round"
		strokeLinejoin="round"
		style={{ transform: "scale(1.2)" }}
	>
		<polygon points="12 2 15.5 4 15.5 8 12 10 8.5 8 8.5 4 12 2"></polygon>
		<text x="10.5" y="7.5" fill="currentColor" stroke="none" style={{ fontSize: "5px", fontWeight: "bold" }}>
			1
		</text>
		<polygon points="12 8 15.5 10 15.5 14 12 16 8.5 14 8.5 10 12 8"></polygon>
		<text x="10.5" y="13.5" fill="currentColor" stroke="none" style={{ fontSize: "5px", fontWeight: "bold" }}>
			2
		</text>
		<polygon points="12 14 15.5 16 15.5 20 12 22 8.5 20 8.5 16 12 14"></polygon>
		<text x="10.5" y="19.5" fill="currentColor" stroke="none" style={{ fontSize: "5px", fontWeight: "bold" }}>
			3
		</text>
	</svg>
);

const IconBindings = () => (
	<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
		<rect x="9" y="4" width="6" height="8" rx="3"></rect>
		<rect x="9" y="12" width="6" height="8" rx="3"></rect>
	</svg>
);

const initialGroups = [
	{ id: 1, name: "Activation Group 1", active: false },
	{ id: 2, name: "Activation Group 2", active: false },
	{ id: 3, name: "Activation Group 3", active: false },
	{ id: 4, name: "Activation Group 4", active: false },
	{ id: 5, name: "Activation Group 5", active: false },
	{ id: 6, name: "Activation Group 6", active: false },
	{ id: 7, name: "Activation Group 7", active: false },
	{ id: 8, name: "Landing Gear", active: true },
	{ id: 9, name: "Solar Panels", active: false },
	{ id: 10, name: "RCS", active: true },
];

const subTools = [
	{ id: "STAGES", icon: <IconStages />, title: "Stages" },
	{ id: "BINDINGS", icon: <IconBindings />, title: "Bindings" },
	{ id: "ACTION_GROUPS", icon: <CheckIcon />, title: "Action Groups" },
];

export function ActivationGroupsPanel({ onClose }) {
	const [groups, setGroups] = useState(initialGroups);
	const [activeSubToolId, setActiveSubToolId] = useState("ACTION_GROUPS");

	const handleToggle = (id) => {
		setGroups((currentGroups) => currentGroups.map((group) => (group.id === id ? { ...group, active: !group.active } : group)));
	};

	return (
		<motion.div className="panel-wrapper activation-groups-panel-wrapper" variants={panelVariants} initial="hidden" animate="visible" exit="exit">
			<Paper className="panel-content">
				<Box className="panel-header">
					<Typography variant="h3" className="panel-title">
						ACTIVATION GROUPS
					</Typography>
					<IconButton onClick={onClose} className="panel-close-btn" aria-label="Close activation groups panel">
						<CloseIcon />
					</IconButton>
				</Box>
				<Box className="panel-body activation-groups-panel-body">
					<div className="internal-sidebar">
						{subTools.map((tool) => (
							<Tooltip key={tool.id} title={tool.title} placement="right" arrow>
								<IconButton
									className={`internal-tool-button ${tool.id === activeSubToolId ? "active" : ""}`}
									onClick={() => setActiveSubToolId(tool.id)}
									style={{ "--active-tool-color": "#00A8FC" }}
								>
									{tool.icon}
								</IconButton>
							</Tooltip>
						))}
					</div>
					<div className="groups-list-container">
						{groups.map((group) => {
							const isCustom = !group.name.startsWith("Activation Group");
							return (
								<div key={group.id} className="group-row">
									<span className="group-number">{group.id}</span>
									<span className={`group-name ${isCustom ? "custom" : ""}`}>{group.name}</span>
									<button
										className={`group-toggle ${group.active ? "active" : ""}`}
										onClick={() => handleToggle(group.id)}
										aria-pressed={group.active}
										aria-label={`Toggle ${group.name}`}
									>
										<div className="toggle-slot"></div>
										<div className="toggle-slot"></div>
									</button>
								</div>
							);
						})}
					</div>
				</Box>
			</Paper>
		</motion.div>
	);
}
