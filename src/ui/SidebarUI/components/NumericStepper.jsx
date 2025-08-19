import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';
import './NumericStepper.css';



export function NumericStepper({
    label, value = 0, onChange, step = 0.1, min = -Infinity, max = Infinity, precision = 2, labelColor,
}) {
    const [displayValue, setDisplayValue] = useState(value.toFixed(precision));
    const [isFocused, setIsFocused] = useState(false);

    useEffect(() => {
        if (!isFocused) {
            setDisplayValue(value.toFixed(precision));
        }
    }, [value, precision, isFocused]);

    const commitChange = (val) => {
        const clampedValue = Math.max(min, Math.min(max, val));
        onChange(Number(clampedValue.toFixed(precision)));
    };

    const handleIncrement = () => commitChange(value + step);
    const handleDecrement = () => commitChange(value - step);

    const handleInputChange = (e) => setDisplayValue(e.target.value);
    
    const handleBlur = () => {
        setIsFocused(false);
        let numericValue = parseFloat(displayValue);
        if (isNaN(numericValue)) {
            numericValue = min !== -Infinity ? min : 0;
        }
        commitChange(numericValue);
    };

    return (
        <div className="stepper-container">
            <span className="stepper-label" style={{ color: labelColor }}>{label}</span>
            <div className="stepper-control">
                <button onClick={handleDecrement} className="stepper-button" aria-label={`Decrease ${label}`}><ChevronLeft /></button>
                <input
                    type="text"
                    inputMode="decimal"
                    className="stepper-input"
                    value={displayValue}
                    onChange={handleInputChange}
                    onFocus={() => setIsFocused(true)}
                    onBlur={handleBlur}
                    onKeyDown={(e) => { if (e.key === 'Enter') (e.target ).blur(); }}
                />
                <button onClick={handleIncrement} className="stepper-button" aria-label={`Increase ${label}`}><ChevronRight /></button>
            </div>
        </div>
    );
}
