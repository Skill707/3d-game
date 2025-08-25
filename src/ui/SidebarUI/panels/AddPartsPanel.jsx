import { useEffect, useMemo } from "react";
import { useAtom } from "jotai";
import { Box, Paper, Typography, IconButton, Card, CardContent } from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";
import { motion } from "framer-motion";
import "./styles/AddPartsPanel.css";
import { shapeRegistry } from "../../../utils/partFactory";
import { settingsAtom } from "../../../state/atoms";
import { PartIconView } from "../components/PartIconView";
import { produce } from "immer";

const panelVariants = {
	hidden: { x: "-100%", opacity: 0, transition: { type: "tween", duration: 0.3, ease: "easeIn" } },
	visible: { x: 0, opacity: 1, transition: { type: "tween", duration: 0.3, ease: "easeOut" } },
	exit: { x: "-100%", opacity: 0, transition: { type: "tween", duration: 0.3, ease: "easeIn" } },
};

export function AddPartsPanel({ onClose }) {
	const parts = useMemo(() => {
		const arr = [];
		for (let shape in shapeRegistry) {
			arr.push({
				type: shape,
				name: shape.charAt(0).toUpperCase() + shape.slice(1),
				icon: <PartIconView partName={shape} size={128} />,
				description: `Description for ${shape}`,
			});
		}
		return arr;
	}, []);

	useEffect(() => {
		console.log("AddPartsPanel mounted, available parts:", parts);

		return () => {
			console.log("AddPartsPanel unmounted");
		};
	}, [parts]);

	const [settingsStorage, setSettingsStorage] = useAtom(settingsAtom);

	const handleSelectPart = (type, e) => {
		setSettingsStorage(
			produce((draft) => {
				draft.addParts.selectedPartType = type;
			})
		);
	};

	return (
		<motion.div
			className="panel-wrapper add-parts-panel-wrapper"
			variants={panelVariants}
			initial="hidden"
			animate="visible"
			exit="exit"
			onPointerEnter={() => {
				setSettingsStorage(
					produce((draft) => {
						draft.addParts.pointerOut = false;
						draft.addParts.selectedPartType = null;
					})
				);
			}}
			onPointerLeave={() => {
				setSettingsStorage(
					produce((draft) => {
						draft.addParts.pointerOut = true;
					})
				);
			}}
			onPointerUp={(e) => handleSelectPart(null, e)}
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
						{parts.map((part) => (
							<motion.Card
								key={part.type}
								className="part-item"
								tabIndex={0}
								aria-label={`Add ${part.name}`}
								onMouseDown={(e) => handleSelectPart(part.type, e)}
								onTouchStart={(e) => handleSelectPart(part.type, e)}
								whileHover={{ y: -4, transition: { duration: 0.2 } }}
							>
								<Box className="part-image-placeholder">{part.icon}</Box>
								<CardContent sx={{ p: 1, "&:last-child": { pb: 1 } }}>
									<Typography className="part-name">{part.name}</Typography>
									<Typography className="part-description">{part.description}</Typography>
								</CardContent>
							</motion.Card>
						))}
					</Box>
				</Box>
			</Paper>
		</motion.div>
	);
}
