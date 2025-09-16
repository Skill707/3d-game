import React from "react";
import "./HUD.css";

const HUD = ({ hudData }) => {
	return (
		<div className="hud">
			{hudData &&
				hudData.map((element) => {
					let value = element.value;
					if (typeof value === "number") value = value.toFixed(element.valueDigits || 0);
					return (
						<div className="hud-item" key={element.name}>
							<span>{element.name}</span>
							<p>{value + element.unit}</p>
						</div>
					);
				})}
		</div>
	);
};

export default HUD;

/*
 
      <div className="hud-item">
        <span>SPD</span>
        <p>{speed.toFixed(0)} M/S</p>
      </div>
*/
