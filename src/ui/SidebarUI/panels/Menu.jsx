import { Close as CloseIcon, Settings as GearIcon, FileUpload as UploadIcon, CameraAlt as CameraIcon } from "@mui/icons-material";
import { motion } from "framer-motion";
import { Box, Typography, Button, IconButton, Stack, Paper } from "@mui/material";
import "./styles/Menu.css";

const panelVariants = {
	hidden: { x: "-100%", opacity: 0, transition: { type: "tween", duration: 0.3, ease: "easeIn" } },
	visible: { x: 0, opacity: 1, transition: { type: "tween", duration: 0.3, ease: "easeOut" } },
	exit: { x: "-100%", opacity: 0, transition: { type: "tween", duration: 0.3, ease: "easeIn" } },
};

export function Menu({ onClose, partsStorageAPI }) {
	const menuButtons1 = ["DOWNLOAD CRAFTS", "NEW CRAFT", "LOAD CRAFT", "SAVE CRAFT"];
	const menuButtons2 = ["REPORT A BUG", "EXIT DESIGNER"];

	return (
		<motion.div className="panel-wrapper menu-panel-wrapper" variants={panelVariants} initial="hidden" animate="visible" exit="exit">
			<Paper elevation={4} className="panel-content menu-panel">
				<Box className="panel-header">
					<Typography variant="h2" className="panel-title">
						MENU
					</Typography>
					<IconButton onClick={onClose} aria-label="Close menu" className="panel-close-btn">
						<CloseIcon />
					</IconButton>
				</Box>

				<Stack className="menu-section" spacing={0}>
					{menuButtons1.map((label) => (
						<Button
							key={label}
							fullWidth
							className="menu-button"
							onClick={() => {
								if (label === "NEW CRAFT") {
									partsStorageAPI((api) => api.restart());
								} else if (label === "LOAD CRAFT") {
									partsStorageAPI((api) => api.loadCraft());
								} else if (label === "SAVE CRAFT") {
									partsStorageAPI((api) => api.saveCraft());
								}
							}}
						>
							{label}
						</Button>
					))}
				</Stack>

				<Stack direction="row" spacing={1} justifyContent="center" className="menu-icon-buttons">
					<IconButton className="menu-icon-btn" aria-label="Settings">
						<GearIcon />
					</IconButton>
					<IconButton className="menu-icon-btn" aria-label="Upload">
						<UploadIcon />
					</IconButton>
					<IconButton className="menu-icon-btn" aria-label="Take screenshot">
						<CameraIcon />
					</IconButton>
				</Stack>

				<Stack className="menu-section" spacing={0}>
					{menuButtons2.map((label) => (
						<Button key={label} fullWidth className="menu-button">
							{label}
						</Button>
					))}
				</Stack>
			</Paper>
		</motion.div>
	);
}
