import React from 'react';
import './ToggleSwitch.css';


export function ToggleSwitch({ label, checked, onChange }) {
    // In the image, both toggles appear to be "off".
    // I'll interpret the left box as 'off' and the right as 'on'.
    // The active state will have a brighter background.
    return (
        <div className="view-toggle-container">
            <span className="view-toggle-label">{label}</span>
            <div className="view-toggle-control">
                 <button
                    className={`toggle-box ${!checked ? 'active' : ''}`}
                    onClick={() => onChange(false)}
                    aria-label={`${label} off`}
                    data-state="off"
                />
                <button
                    className={`toggle-box ${checked ? 'active' : ''}`}
                    onClick={() => onChange(true)}
                    aria-label={`${label} on`}
                    data-state="on"
                />
            </div>
        </div>
    );
}
