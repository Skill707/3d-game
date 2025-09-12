import { useAtom } from "jotai";
import { Box, Paper, Typography, IconButton, Card, CardContent } from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";
import { motion } from "framer-motion";
import "./styles/AddPartsPanel.css";
import { settingsAtom } from "../../../state/atoms";
import { produce } from "immer";

const panelVariants = {
	hidden: { x: "-100%", opacity: 0, transition: { type: "tween", duration: 0.3, ease: "easeIn" } },
	visible: { x: 0, opacity: 1, transition: { type: "tween", duration: 0.3, ease: "easeOut" } },
	exit: { x: "-100%", opacity: 0, transition: { type: "tween", duration: 0.3, ease: "easeIn" } },
};

export function AddPartsPanel({ partIcons, onClose }) {
	const [settingsStorage, setSettingsStorage] = useAtom(settingsAtom);

	const handleSelectPart = (type) => {
		setSettingsStorage((prev) => ({
			...prev,
			addParts: {
				...prev.addParts,
				selectedPartType: type,
			},
		}));
	};

	const handlePointerOut = (state) => {
		setSettingsStorage((prev) => ({
			...prev,
			addParts: {
				...prev.addParts,
				pointerOut: state,
			},
		}));
	};

	return (
		<motion.div
			className="panel-wrapper add-parts-panel-wrapper"
			variants={panelVariants}
			initial="hidden"
			animate="visible"
			exit="exit"
			onPointerEnter={() => handlePointerOut(false)}
			onPointerLeave={() => {
				handlePointerOut(true);
				settingsStorage.addParts.selectedPartType && onClose();
			}}
			onPointerUp={(e) => handleSelectPart(null)}
		>
			<Paper className="panel-content">
				<Box className="panel-header">
					<Typography variant="h3" className="panel-title">
						ADD PARTS
					</Typography>
					<IconButton onClick={onClose} className="panel-close-btn" aria-label="Close add parts panel">
						<CloseIcon />
					</IconButton>
				</Box>
				<Box className="panel-body add-parts-panel-body">
					<Box className="parts-grid">
						{partIcons &&
							partIcons.map((part) => (
								<motion.Card
									key={part.type}
									className="part-item"
									tabIndex={0}
									aria-label={`Add ${part.name}`}
									onMouseDown={() => handleSelectPart(part.type)}
									onTouchStart={() => handleSelectPart(part.type)}
									whileHover={{ y: -4, transition: { duration: 0.2 } }}
								>
									<Box className="part-image-placeholder">{part.icon}</Box>
									<CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
										<Typography className="part-name">{part.name}</Typography>
										{/*<Typography className="part-description">{part.description}</Typography>*/}
									</CardContent>
								</motion.Card>
							))}
					</Box>
				</Box>
			</Paper>
		</motion.div>
	);
}
