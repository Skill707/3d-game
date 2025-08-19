import React, { useState } from 'react';
import { Close as CloseIcon } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { Box, Paper, Typography, IconButton } from '@mui/material';
import { OptionStepper } from '../components/OptionStepper';
import './styles/SymmetryPanel.css';



const panelVariants = {
    hidden: { x: '-100%', opacity: 0, transition: { type: 'tween', duration: 0.3, ease: 'easeIn' } },
    visible: { x: 0, opacity: 1, transition: { type: 'tween', duration: 0.3, ease: 'easeOut' } },
    exit: { x: '-100%', opacity: 0, transition: { type: 'tween', duration: 0.3, ease: 'easeIn' } }
};

const symmetryDescriptions = {
    Disabled: {
        title: 'Symmetry is currently disabled for this part',
        text: 'Symmetry Mode can be enabled for parts connected to the side of a fuel tank. It will dynamically create clones of the part around the circumference of the fuel tank.'
    },
    Mirror: {
        title: 'Mirror Symmetry is active',
        text: 'Parts will be mirrored across a central plane. Any action performed on the original part will be mirrored on the clone.'
    },
    Radial: {
        title: 'Radial Symmetry is active',
        text: 'Creates multiple clones of the part around a central axis. Use the count setting to define how many clones appear.'
    }
};

const QuickMirrorIcon = ({ children }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
        {children}
    </svg>
);
// Recreating icons from the image
const IconMirrorLeft = () => (
    <QuickMirrorIcon>
        <path d="M8 5V19" />
        <path d="M12 17H16C17.1046 17 18 16.1046 18 15V9C18 7.89543 17.1046 7 16 7H12" />
    </QuickMirrorIcon>
);
const IconMirrorCenter = () => (
    <QuickMirrorIcon>
        <path d="M12 5V19" />
        <path d="M4 17H8C9.10457 17 10 16.1046 10 15V9C10 7.89543 9.10457 7 8 7H4" />
        <path d="M20 17H16C14.8954 17 14 16.1046 14 15V9C14 7.89543 14.8954 7 16 7H20" />
    </QuickMirrorIcon>
);
const IconMirrorRight = () => (
    <QuickMirrorIcon>
        <path d="M16 5V19" />
        <path d="M12 17H8C6.89543 17 6 16.1046 6 15V9C6 7.89543 6.89543 7 8 7H12" />
    </QuickMirrorIcon>
);


export function SymmetryPanel({ onClose }) {
    const [mode, setMode] = useState('Disabled');
    const modes = ['Disabled', 'Mirror', 'Radial'];
    const { title, text } = symmetryDescriptions[mode];

    return (
        <motion.div className="panel-wrapper symmetry-panel-wrapper" variants={panelVariants} initial="hidden" animate="visible" exit="exit">
            <Paper className="panel-content">
                <Box className="panel-header">
                    <Typography variant="h3" className="panel-title">SYMMETRY</Typography>
                    <IconButton onClick={onClose} className="panel-close-btn" aria-label="Close symmetry panel">
                        <CloseIcon />
                    </IconButton>
                </Box>
                <Box className="panel-body symmetry-panel-body">
                    <OptionStepper
                        label="Mode"
                        options={modes}
                        value={mode}
                        onChange={setMode}
                    />
                    <div className="symmetry-info">
                        <h4 className="symmetry-info-title">{title}</h4>
                        <p className="symmetry-info-text">{text}</p>
                    </div>

                    <hr className="tool-separator" />

                    <div className="quick-mirror-section">
                        <h4 className="quick-mirror-title">QUICK MIRROR</h4>
                        <p className="quick-mirror-text">
                            Quick Mirror is useful for airplanes that may not have a central fuel tank to use as a symmetry root.
                        </p>
                        <div className="quick-mirror-buttons">
                            <IconButton className="quick-mirror-btn" aria-label="Mirror left"><IconMirrorLeft /></IconButton>
                            <IconButton className="quick-mirror-btn" aria-label="Mirror center"><IconMirrorCenter /></IconButton>
                            <IconButton className="quick-mirror-btn" aria-label="Mirror right"><IconMirrorRight /></IconButton>
                        </div>
                    </div>
                    
                    <button className="mirror-tool-btn">MIRROR TOOL</button>
                </Box>
            </Paper>
        </motion.div>
    );
}