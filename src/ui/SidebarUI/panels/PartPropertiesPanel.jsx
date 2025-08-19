import React from 'react';
import { Close as CloseIcon, ChevronRight as ChevronRightIcon } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { Box, Paper, Typography, IconButton, Accordion, AccordionSummary, AccordionDetails, Divider } from '@mui/material';
import './styles/PartPropertiesPanel.css';



const panelVariants = {
    hidden: { x: '-100%', opacity: 0, transition: { type: 'tween', duration: 0.3, ease: 'easeIn' } },
    visible: { x: 0, opacity: 1, transition: { type: 'tween', duration: 0.3, ease: 'easeOut' } },
    exit: { x: '-100%', opacity: 0, transition: { type: 'tween', duration: 0.3, ease: 'easeIn' } }
};


export function PartPropertiesPanel({ onClose, selectedPart }) {
    const renderContent = () => {
        if (!selectedPart) {
            return (
                <Box className="part-properties-empty">
                    <Typography>Select a part to view its customizable properties.</Typography>
                </Box>
            );
        }

        return (
            <Box className="part-details">
                <Box className="part-main-info">
                    <Typography variant="h4" className="part-name">{selectedPart.name}</Typography>
                    <Box className="part-stats">
                        <Box>
                            <Typography component="span">Mass</Typography>
                            <Typography component="span">{selectedPart.mass}</Typography>
                        </Box>
                        <Box>
                            <Typography component="span">Price</Typography>
                            <Typography component="span">{selectedPart.price}</Typography>
                        </Box>
                    </Box>
                </Box>
                <Box className="part-sections">
                    {selectedPart.sections.map((sectionTitle, index) => (
                        <Accordion key={sectionTitle} defaultExpanded className="part-accordion">
                            <AccordionSummary 
                                expandIcon={<ChevronRightIcon />} 
                                className="part-accordion-summary"
                                sx={{ '& .MuiAccordionSummary-expandIconWrapper': { color: 'var(--icon-color)' } }}
                            >
                                <Typography className="collapsible-title">{sectionTitle}</Typography>
                            </AccordionSummary>
                            <AccordionDetails className="part-accordion-details">
                                <Typography sx={{fontStyle: "italic", color: "#888"}}>
                                    Properties for {sectionTitle} will be shown here.
                                </Typography>
                            </AccordionDetails>
                        </Accordion>
                    ))}
                </Box>
            </Box>
        );
    }

    return (
        <motion.div className="panel-wrapper part-properties-panel-wrapper" variants={panelVariants} initial="hidden" animate="visible" exit="exit">
            <Paper className="panel-content">
                <Box className="panel-header">
                    <Typography variant="h3" className="panel-title">PART PROPERTIES</Typography>
                    <IconButton onClick={onClose} className="panel-close-btn" aria-label="Close part properties panel">
                        <CloseIcon />
                    </IconButton>
                </Box>
                <Box className="panel-body part-properties-panel-body">
                    {renderContent()}
                </Box>
            </Paper>
        </motion.div>
    );
}
