import { useEffect, useRef } from "react";
import { TransformControls } from "@react-three/drei";
import * as THREE from "three";

export default function Segment({
	index,
	points,
	position,
	segmentSelected,
	selectedSegmentIndex,
	onSelect,
	onMoveSegment,
	onMovePoints,
	selectedPointsIndex,
	setSelectedPointsIndex,
	radius,
}) {
	function handlePointSelection(pointIndex) {
		if (segmentSelected) {
			setSelectedPointsIndex((prevSelectedPoints) => {
				if (prevSelectedPoints.includes(pointIndex)) {
					return prevSelectedPoints.filter((index) => index !== pointIndex);
				} else {
					return [...prevSelectedPoints, pointIndex];
				}
			});
		}
	}

	const controlsRef = useRef();
	const dummyRef = useRef();
	const segmentRef = useRef();

	useEffect(() => {
		if (!controlsRef.current || !segmentRef.current) return;

		if (selectedPointsIndex.length === 0) {
			controlsRef.current.attach(segmentRef.current);
		} else {
			const selectedWorldPoints = selectedPointsIndex.map((i) => {
				const local = new THREE.Vector3(...points[i]);
				return segmentRef.current.localToWorld(local.clone());
			});

			const avg = selectedWorldPoints.reduce((acc, p) => acc.add(p), new THREE.Vector3());
			const worldCenter = avg.multiplyScalar(1 / selectedWorldPoints.length);

			dummyRef.current.position.copy(worldCenter);
			controlsRef.current.attach(dummyRef.current);
		}
	}, [selectedPointsIndex, selectedSegmentIndex, points]);

	const handleMoveSegment = () => {
		if (segmentRef.current) {
			const newPos = new THREE.Vector3();
			segmentRef.current.getWorldPosition(newPos);
			onMoveSegment([newPos.x, newPos.y, newPos.z]);
		}
	};

	const handleMovePoints = () => {
		if (!dummyRef.current || !segmentRef.current) return;

		const worldDummyPos = new THREE.Vector3();
		dummyRef.current.getWorldPosition(worldDummyPos);

		// Получаем мировой центр выбранных точек
		const selectedWorldPoints = selectedPointsIndex.map((i) => {
			const local = new THREE.Vector3(...points[i]);
			return segmentRef.current.localToWorld(local.clone()); // ← безопасно
		});

		const avg = selectedWorldPoints.reduce((acc, p) => acc.add(p), new THREE.Vector3());
		const worldCenter = avg.multiplyScalar(1 / selectedWorldPoints.length);

		// Вычисляем delta в мировой системе координат
		const worldDelta = new THREE.Vector3().subVectors(worldDummyPos, worldCenter);

		// Смещаем точки в локальной системе координат сегмента
		const newPoints = points.map((point, index) => {
			if (selectedPointsIndex.includes(index)) {
				const originalLocal = new THREE.Vector3(...point);
				const worldPos = segmentRef.current.localToWorld(originalLocal.clone());
				const movedWorldPos = worldPos.add(worldDelta);
				const newLocal = segmentRef.current.worldToLocal(movedWorldPos.clone());
				return [newLocal.x, newLocal.y, newLocal.z];
			}
			return point;
		});

		onMovePoints(newPoints);
	};

	return (
		<>
			<group ref={segmentRef} name={`segment${index}`} onClick={onSelect} position={position}>
				{segmentSelected &&
					points.map((pos, pointIndex) => {
						return (
							<DraggablePoint
								key={pointIndex}
								position={pos}
								onSelect={() => handlePointSelection(pointIndex)}
								selected={selectedPointsIndex.includes(pointIndex)}
								segmentSelected={segmentSelected}
							/>
						);
					})}

				<mesh>
					<boxGeometry args={[radius * 2, radius * 2, segmentSelected ? 0.05 : 0.01]} />
					<meshBasicMaterial color={segmentSelected ? "yellow" : "black"} opacity={0.3} transparent />
				</mesh>
			</group>

			<group onClick={onSelect} position={position}>
				{segmentSelected &&
					points.map((pos, pointIndex) => {
						if (selectedPointsIndex.includes(pointIndex)) {
							return (
								<DraggablePoint
									key={pointIndex}
									position={pos}
									onSelect={() => handlePointSelection(pointIndex)}
									selected={true}
									segmentSelected={segmentSelected}
								/>
							);
						}
					})}
			</group>

			<TransformControls
				name={`TransformControls${index}`}
				enabled={segmentSelected}
				ref={controlsRef}
				onMouseUp={selectedPointsIndex.length == 0 ? handleMoveSegment : handleMovePoints}
			/>
			<group ref={dummyRef} visible={false} />
		</>
	);
}

function DraggablePoint({ position, onSelect, selected, segmentSelected }) {
	const meshRef = useRef();

	return (
		<mesh ref={meshRef} position={position} onClick={onSelect}>
			<sphereGeometry args={[0.1, 8, 8]} />
			<meshBasicMaterial color={selected & segmentSelected ? "blue" : "red"} />
		</mesh>
	);
}
