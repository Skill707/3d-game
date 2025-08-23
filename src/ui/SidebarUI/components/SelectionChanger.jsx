import React from "react";
import { ArrowBack, ArrowForward } from "@mui/icons-material";
import { IconButton, Typography } from "@mui/material";
import "./SelectionChanger.css";

export function SelectionChanger({ label, handlePrevPart, handleSeclectSection, handleNextPart }) {
	return (
		<div className="selection-changer-container">
			<Typography variant="body2" className="selection-changer-label">
				{label}
			</Typography>
			<div className="selection-changer-buttons">
				<IconButton className="selection-changer-btn" onClick={()=>handlePrevPart()} aria-label="Previous part">
					P
				</IconButton>
				<IconButton className="selection-changer-btn" onClick={()=>handleSeclectSection("back")} aria-label="Back segment">
					B
				</IconButton>
				<IconButton className="selection-changer-btn" onClick={()=>handleSeclectSection("center")} aria-label="Center section">
					C
				</IconButton>
				<IconButton className="selection-changer-btn" onClick={()=>handleSeclectSection("front")} aria-label="Front segment">
					F
				</IconButton>
				<IconButton className="selection-changer-btn" onClick={()=>handleNextPart()} aria-label="Next pat">
					N
				</IconButton>
			</div>
		</div>
	);
}
