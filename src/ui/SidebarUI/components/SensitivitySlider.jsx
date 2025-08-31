import { Slider } from "@mui/material";
import "./SensitivitySlider.css";

export function SensitivitySlider({ label, value, onChange, min = 0, max = 100, displayTransformer }) {
	const displayValue = displayTransformer ? displayTransformer(value) : `${value}%`;

	return (
		<div className="sensitivity-slider-container">
			<div className="sensitivity-slider-text-wrapper">
				<span className="sensitivity-slider-label">{label}</span>
				<span className="sensitivity-slider-value">{displayValue}</span>
			</div>
			<div className="slider-wrapper">
				<Slider
					value={value}
					onChange={(e, val) => onChange(val)}
					aria-label={label}
					min={min}
					max={max}
					sx={{
						color: "var(--active-brand-color)",
						height: 6,
						"& .MuiSlider-track": {
							border: "none",
						},
						"& .MuiSlider-thumb": {
							height: 16,
							width: 16,
							backgroundColor: "var(--active-brand-color)",
							border: "3px solid #fff",
							"&:focus, &:hover, &.Mui-active, &.Mui-focusVisible": {
								boxShadow: "inherit",
							},
						},
						"& .MuiSlider-rail": {
							opacity: 1,
							backgroundColor: "var(--tool-input-bg)",
							border: "1px solid var(--tool-input-border)",
						},
					}}
				/>
			</div>
		</div>
	);
}
