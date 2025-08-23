import { useEffect, useMemo } from "react";
import { useAtom } from "jotai";
import { Box, Paper, Typography, IconButton, Card, CardContent } from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";
import { motion } from "framer-motion";
import "./styles/AddPartsPanel.css";
import { Part, shapeRegistry } from "../../../utils/partFactory";
import { partsAtom } from "../../../state/atoms";
import { addPart } from "../../../state/actions";
import { PartIconView } from "../components/PartIconView";

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

	const [partsStorage, setPartsStorage] = useAtom(partsAtom);

	useEffect(() => {
		console.log("AddPartsPanel mounted, available parts:", parts);

		return () => {
			console.log("AddPartsPanel unmounted");
		};
	}, [parts]);

	const handleDragStart = (type, e) => {
		e.preventDefault();
		console.log(`Starting drag for part type: ${type}`);
		addPart(
			setPartsStorage,
			new Part({
				id: partsStorage.parts.length,
				name: type,
			})
		);
	};

	return (
		<motion.div className="panel-wrapper add-parts-panel-wrapper" variants={panelVariants} initial="hidden" animate="visible" exit="exit">
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
							<motion.div key={part.type} whileHover={{ y: -4, transition: { duration: 0.2 } }}>
								<Card
									className="part-item"
									tabIndex={0}
									aria-label={`Add ${part.name}`}
									onMouseDown={(e) => handleDragStart(part.type, e)}
									onTouchStart={(e) => handleDragStart(part.type, e)}
								>
									<Box className="part-image-placeholder">{part.icon}</Box>
									<CardContent sx={{ p: 1, "&:last-child": { pb: 1 } }}>
										<Typography className="part-name">{part.name}</Typography>
										<Typography className="part-description">{part.description}</Typography>
									</CardContent>
								</Card>
							</motion.div>
						))}
					</Box>
				</Box>
			</Paper>
		</motion.div>
	);
}
