import React from 'react';
import { ArrowBack, ArrowForward } from '@mui/icons-material';
import { IconButton, Typography } from '@mui/material';
import './SelectionChanger.css';



export function SelectionChanger({ label, onPrev, onNext }) {
    return (
        <div className="selection-changer-container">
            <Typography variant="body2" className="selection-changer-label">{label}</Typography>
            <div className="selection-changer-buttons">
                <IconButton className="selection-changer-btn" onClick={onPrev} aria-label="Previous selection">
                    <ArrowBack />
                </IconButton>
                <IconButton className="selection-changer-btn" onClick={onNext} aria-label="Next selection">
                    <ArrowForward />
                </IconButton>
            </div>
        </div>
    );
}
