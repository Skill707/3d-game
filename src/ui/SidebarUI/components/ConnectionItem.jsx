import React from "react";
import { Close as CloseIcon, LocalGasStation as FuelIcon } from "@mui/icons-material";
import "./ConnectionItem.css";

const ConnectionTypeIcon = ({ type }) => {
	switch (type) {
		case "surface":
			return <div className="connection-icon-shape circle" />;
		case "fuel":
			return <FuelIcon sx={{ fontSize: "1.2rem", color: "var(--icon-color)" }} />;
		case "rotate":
			return <div className="connection-icon-shape square" />;
		case "shell":
			return <div className="connection-icon-shape triangle" />;
		default:
			return null;
	}
};

export function ConnectionItem({ connection, onToggle, onDelete }) {
	return (
		<div className="connection-item">
			<div className="connection-info">
				<div className="connection-icon">
					<ConnectionTypeIcon type={connection.type} />
				</div>
				<div className="connection-text">
					<span className="connection-name">{connection.name + connection.id}</span>
					{connection.connectedTo && <span className="connection-target">{connection.connectedTo}</span>}
				</div>
			</div>
			<div className="connection-controls">
				<button
					className={`connection-toggle ${connection.enabled ? "on" : ""}`}
					onClick={() => onToggle(connection.id)}
					aria-label={`Toggle connection ${connection.name}`}
				>
					<div className="toggle-indicator" />
				</button>
				{connection.connectedTo && (
					<button className="connection-delete-btn" onClick={() => onDelete(connection.id)} aria-label={`Delete connection ${connection.name}`}>
						<CloseIcon />
					</button>
				)}
			</div>
		</div>
	);
}
