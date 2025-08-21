import { Segment } from "../ShapedForm/Segment";
import { ConnectingSurface } from "../ShapedForm/ConnectingSurface";

export function ShapedPart({ part }) {
	const segments = part.shape.segments;

	return (
		<>
			{segments.map((segment, index) => (
				<Segment key={index} segment={segment} part={part} />
			))}

			{segments.length > 1 &&
				segments.map((segment, index) => {
					if (index === 0) return null;
					return <ConnectingSurface key={"surface-" + index} segmentA={segments[index - 1]} segmentB={segments[index]} part={part} />;
				})}
		</>
	);
}
