import React from 'react';
import './HUD.css';

const HUD = ({ speed, altitude }) => {
  return (
    <div className="hud">
      <div className="hud-item">
        <span>ALT</span>
        <p>{altitude.toFixed(0)} M</p>
      </div>
      <div className="hud-item">
        <span>SPD</span>
        <p>{speed.toFixed(0)} M/S</p>
      </div>
    </div>
  );
};

export default HUD;
