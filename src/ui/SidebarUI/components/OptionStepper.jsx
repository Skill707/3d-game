import React from 'react';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';
import './OptionStepper.css';



export function OptionStepper({ label, options, value, onChange }) {
    const currentIndex = options.indexOf(value);

    const handleNext = () => {
        const nextIndex = (currentIndex + 1) % options.length;
        onChange(options[nextIndex]);
    };

    const handlePrev = () => {
        const prevIndex = (currentIndex - 1 + options.length) % options.length;
        onChange(options[prevIndex]);
    };
    
    return (
        <div className="stepper-container">
            <span className="stepper-label">{label}</span>
            <div className="stepper-control">
                <button onClick={handlePrev} className="stepper-button" aria-label={`Previous ${label}`}>
                    <ChevronLeft />
                </button>
                <span className="stepper-text-value">{value}</span>
                <button onClick={handleNext} className="stepper-button" aria-label={`Next ${label}`}>
                    <ChevronRight />
                </button>
            </div>
        </div>
    );
}
