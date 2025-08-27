import { useAtom } from "jotai";
import { Box, Paper, Typography, IconButton, Button } from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";
import { motion } from "framer-motion";
import "./styles/SearchPartsPanel.css";
import partsStorageAtom from "../../../state/partsStorageAtom";

const panelVariants = {
	hidden: { x: "-100%", opacity: 0, transition: { type: "tween", duration: 0.3, ease: "easeIn" } },
	visible: { x: 0, opacity: 1, transition: { type: "tween", duration: 0.3, ease: "easeOut" } },
	exit: { x: "-100%", opacity: 0, transition: { type: "tween", duration: 0.3, ease: "easeIn" } },
};

export function SearchPartsPanel({ onClose }) {
	const [partsStorage] = useAtom(partsStorageAtom);
	const parts = partsStorage.parts;
	const selectedPart = partsStorage.selectedPart;

	const handleSelectPart = (id) => {};

	return (
		<motion.div className="panel-wrapper search-parts-panel-wrapper" variants={panelVariants} initial="hidden" animate="visible" exit="exit">
			<Paper className="panel-content">
				<Box className="panel-header">
					<Typography variant="h3" className="panel-title">
						SEARCH PARTS
					</Typography>
					<IconButton onClick={onClose} className="panel-close-btn" aria-label="Close search parts panel">
						<CloseIcon />
					</IconButton>
				</Box>
				<Box className="panel-body search-parts-panel-body">
					<div className="info-bar">
						<span className="parts-count">{parts.length} parts</span>
						<div className="info-buttons">
							<Button className="info-btn">List All</Button>
							<Button className="info-btn">Hide All</Button>
						</div>
					</div>
					<div className="parts-list">
						{parts.map((part) => (
							<div
								key={part.id}
								className={`part-list-item ${selectedPart && selectedPart.id === part.id ? "active" : ""}`}
								onClick={() => handleSelectPart(part.id)}
								tabIndex={0}
							>
								{part.name || part.type}
							</div>
						))}
					</div>
				</Box>
			</Paper>
		</motion.div>
	);
}
