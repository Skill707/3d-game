import React from "react";
import {
	Menu as MenuIcon,
	NearMe as CursorIcon,
	AddCircle as AddIcon,
	Tune as SettingsIcon,
	Tonality as CompareIcon,
	AssignmentTurnedIn as ActivationIcon,
	Search as SearchIcon,
	Visibility as ViewIcon,
	Build as ToolsIcon,
} from "@mui/icons-material";
import { IconButton, Tooltip } from "@mui/material";
import { subTools } from "./panels/DesignerPanel";
import './Sidebar.css';

export function Sidebar({ onIconClick, activePanel, activeSubToolId }) {
	const activeSubTool = subTools.find((tool) => tool.id === activeSubToolId) || subTools[0];

	const icons = [
		{ id: "MENU", name: "Menu", component: <MenuIcon />, type: "brand" },
		{
			id: "DESIGNER",
			name: activePanel === "DESIGNER" ? activeSubTool.title : "Designer Tools",
			component: activePanel === "DESIGNER" ? activeSubTool.icon : <CursorIcon />,
			activeColor: activeSubTool.color,
		},
		{ id: "ADD_PARTS", name: "Add Parts", component: <AddIcon /> },
		{ id: "PART_PROPERTIES", name: "Part Properties", component: <SettingsIcon /> },
		{ id: "SYMMETRY", name: "Symmetry", component: <CompareIcon /> },
		{ id: "ACTIVATION_GROUPS", name: "Activation Groups", component: <ActivationIcon /> },
		{ id: "SEARCH", name: "Search", component: <SearchIcon /> },
		{ id: "VIEW", name: "View", component: <ViewIcon /> },
		{ id: "TOOLS", name: "Tools", component: <ToolsIcon />, type: "special" },
	];

	return (
		<nav className="sidebar" aria-label="Main tools">
			<ul>
				{icons.map((icon) => (
					<React.Fragment key={icon.id}>
						<li>
							<Tooltip title={icon.name} placement="right" arrow enterDelay={500}>
								<IconButton
									className={`sidebar-button ${icon.type || ""} ${activePanel === icon.id ? "active" : ""}`}
									aria-label={icon.name}
									onClick={() => onIconClick(icon.id)}
									aria-expanded={activePanel === icon.id}
									data-id={icon.id}
									style={{ "--active-color": activePanel === "ACTIVATION_GROUPS" ? "#00A8FC" : icon.activeColor }}
								>
									{icon.component}
								</IconButton>
							</Tooltip>
						</li>
						{icon.type === "brand" && <hr className="sidebar-separator" />}
					</React.Fragment>
				))}
			</ul>
		</nav>
	);
}
