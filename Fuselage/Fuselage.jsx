import { useState, useEffect, useMemo } from "react";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import Segment from "./Segment";

export default function Fuselage({ pos, count = 8, radius = 1, isSelected = false, onClick }) {
	const [segments, setSegments] = useState([
		{ points: generateCirclePoints([0, 0, 0], count, radius), pos: [0, 0, 0], radius: radius },
		{ points: generateCirclePoints([0, 0, 0], count, radius), pos: [0, 0, 2], radius: radius },
	]);
	const [selectedSegmentIndex, selectSegmentIndex] = useState(0);
	const [selectedPointsIndex, setSelectedPointsIndex] = useState([]);

	function addSegment(count) {
		const lastSegment = segments[segments.length - 1];
		let newSegment = {};
		if (lastSegment.points.length == count) {
			newSegment.points = lastSegment.points.map((point) => [point[0], point[1], point[2]]);
			newSegment.pos = [lastSegment.pos[0], lastSegment.pos[1], lastSegment.pos[2] + 2];
		} else {
			newSegment.points = generateCirclePoints([0, 0, 0], count, radius);
			newSegment.pos = [lastSegment.pos[0], lastSegment.pos[1], lastSegment.pos[2] + 2];
		}
		setSegments([...segments, newSegment]);
		selectSegmentIndex(segments.length);
	}

	function updateSegmentPoints(index, newPoints) {
		const updatedSegments = segments.map((segment, i) => {
			if (i === index) {
				return { ...segment, points: newPoints };
			}
			return segment;
		});
		setSegments(updatedSegments);
	}

	function updateSegmentPos(index, newPos) {
		const updatedSegments = segments.map((segment, i) => {
			if (i === index) {
				return { ...segment, pos: newPos };
			}
			return segment;
		});
		setSegments(updatedSegments);
	}

	console.log("🔵Fuselage - Рендеринг компонента (каждый раз)");

	useEffect(() => {
		console.log("🟢Fuselage - useEffect (асинхронно после отрисовки)");

		return () => {
			console.log("⚪Fuselage - Очистка useEffect (componentWillUnmount или перед след. вызовом useEffect)");
		};
	}, []);

	return (
		<group position={pos} onClick={onClick}>
			{segments.map((segment, index) => (
				<Segment
					key={index}
					index={index}
					points={segment.points}
					position={segment.pos}
					onSelect={() => {
						if (selectedSegmentIndex !== index) {
							selectSegmentIndex(index);
							setSelectedPointsIndex([]);
						} else {
							//selectSegmentIndex(null);
						}
					}}
					onMoveSegment={(newPos) => {
						updateSegmentPos(index, newPos);
					}}
					onMovePoints={(newPoints) => {
						updateSegmentPoints(index, newPoints);
					}}
					segmentSelected={selectedSegmentIndex === index}
					selectedSegmentIndex={selectedSegmentIndex}
					selectedPointsIndex={selectedPointsIndex}
					setSelectedPointsIndex={setSelectedPointsIndex}
					radius={radius}
				/>
			))}
			<AddSectionButton onClick={(count) => addSegment(count)} position={segments[segments.length - 1].pos} />

			{segments.length > 1 &&
				segments.map((segment, index) => {
					if (index === 0) return null;
					return <ConnectingSurface key={"surface-" + index} segmentA={segments[index - 1]} segmentB={segments[index]} />;
				})}
		</group>
	);
}

function ConnectingSurface({ segmentA, segmentB }) {
	const geometry = useMemo(() => {
		const positions = [];

		const sectionA = segmentA.points.map((p) => [p[0] + segmentA.pos[0], p[1] + segmentA.pos[1], p[2] + segmentA.pos[2]]);
		const sectionB = segmentB.points.map((p) => [p[0] + segmentB.pos[0], p[1] + segmentB.pos[1], p[2] + segmentB.pos[2]]);

		const nA = sectionA.length;
		const nB = sectionB.length;

		// определяем, какую секцию считаем базовой для циклов
		const maxCount = Math.max(nA, nB);

		// функция для получения соответствующих индексов из другой секции
		const getIndex = (i, from, to) => {
			return Math.floor((i * to) / from) % to;
		};

		for (let i = 0; i < maxCount; i++) {
			const iA = getIndex(i, maxCount, nA);
			const iA1 = getIndex(i + 1, maxCount, nA);
			const iB = getIndex(i, maxCount, nB);
			const iB1 = getIndex(i + 1, maxCount, nB);

			const a0 = sectionA[iA];
			const a1 = sectionA[iA1];
			const b0 = sectionB[iB];
			const b1 = sectionB[iB1];

			// две треугольника на каждую грань
			positions.push(...a0, ...b0, ...a1);
			positions.push(...b0, ...b1, ...a1);
		}

		const geo = new THREE.BufferGeometry();
		geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(positions), 3));
		geo.computeVertexNormals();
		return geo;
	}, [segmentA, segmentB]);

	useEffect(() => () => geometry.dispose(), [geometry]);

	return (
		<mesh geometry={geometry}>
			<meshNormalMaterial color="gray" side={THREE.DoubleSide} />
		</mesh>
	);
}

function AddSectionButton({ onClick, position }) {
	return (
		<>
			<group position={[position[0] - 0.5, position[1], position[2] + 0.2]}>
				<mesh onDoubleClick={() => onClick(8)}>
					<boxGeometry args={[0.5, 0.5, 0.05]} />
					<meshBasicMaterial color="green" />
				</mesh>
				<Text position={[0, 0, 0.06]} fontSize={0.5} color="white" anchorX="center" anchorY="middle">
					8
				</Text>
			</group>
			<group position={[position[0] + 0.5, position[1], position[2] + 0.2]}>
				<mesh onDoubleClick={() => onClick(16)}>
					<boxGeometry args={[0.5, 0.5, 0.05]} />
					<meshBasicMaterial color="green" />
				</mesh>
				<Text position={[0, 0, 0.06]} fontSize={0.5} color="white" anchorX="center" anchorY="middle">
					16
				</Text>
			</group>
		</>
	);
}

function generateCirclePoints(center, count = 8, radius = 1) {
	const points = [];
	for (let i = 0; i < count; i++) {
		const angle = (i / count) * Math.PI * 2;
		points.push([center[0] + Math.cos(angle) * radius, center[1] + Math.sin(angle) * radius, center[2]]);
	}

	return points;
}
