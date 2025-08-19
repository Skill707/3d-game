import { useMemo, useEffect } from "react";
import * as THREE from "three";
import { MeshStandardMaterial } from "three";

export const AttachPoint = ({ position }) => {
	return (
		<mesh name="attachPoint" position={position}>
			<sphereGeometry args={[0.1, 16, 16]} />
			<meshStandardMaterial color="cyan" />
		</mesh>
	);
};

export const ConnectingSurface = ({ segmentA, segmentB, part }) => {
	const calcGeometries = useMemo(() => {
		const geometries = [];

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
			const positions = [...a0, ...b0, ...a1, ...b0, ...b1, ...a1];
			const geo = new THREE.BufferGeometry();
			geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(positions), 3));
			geo.computeVertexNormals();
			geometries.push(geo);
		}
		return geometries;
	}, [segmentA, segmentB]);

	useEffect(() => {
		return () => calcGeometries.forEach((geometry) => geometry.dispose());
	}, [calcGeometries]);

	const material = useMemo(() => new MeshStandardMaterial({ color: part.selected ? "orange" : part.color + 10, side: THREE.DoubleSide }), [part]);

	return (
		<>
			{calcGeometries && calcGeometries.map((geo, index) => <mesh name={"side"} geometry={geo} material={material} />)}
			{part.selected && <AttachPoint position={[0, -part.size[1] / 2, 0]} />}
		</>
	);
};

/*
	useFrame(() => {
		const attachPoints = [[0, -part.size[1], part.size[0] / 2]];

		const attachWorldPositions = attachPoints.map((localPos) => {
			const vec = new THREE.Vector3(...localPos);
			//vec.multiply(new THREE.Vector3(...scale));
			//vec.applyEuler(new THREE.Euler(...part.rot));
			vec.add(new THREE.Vector3(...part.pos));
			return vec;
		});

		if (part.attachPointsUpdate) {
			part.attachPointsUpdate(attachWorldPositions);
		}
	});
*/

/*
	let initAttachPoints = [
		[0, 0, 0],
		[0, 0, size[2]],
	];
	initAttachPoints.push(faceCenter);
	const [attachPoints, setAttachPoints] = useState(initAttachPoints);

	useFrame(() => {
		//if (!ref.current) return;

		const attachWorldPositions = attachPoints.map((localPos) => {
			const vec = new THREE.Vector3(...localPos);
			//vec.multiply(new THREE.Vector3(...scale));
			//vec.applyEuler(new THREE.Euler(...rotation));
			vec.add(new THREE.Vector3(...pos));
			return vec;
		});

		if (onAttachPointsUpdate) {
			onAttachPointsUpdate(id, attachWorldPositions);
		}
	});

	{attachPoints.map((point, index) => (
				<AttachPoint key={index} position={point} />
			))}
*/

/*

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

			// Центр грани — среднее арифметическое всех вершин грани
			const faceCenter = [(a0[0] + a1[0] + b0[0] + b1[0]) / 4, (a0[1] + a1[1] + b0[1] + b1[1]) / 4, (a0[2] + a1[2] + b0[2] + b1[2]) / 4];
		}

		const geo = new THREE.BufferGeometry();
		geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(positions), 3));
		geo.computeVertexNormals();
		return geo;
	}, [segmentA, segmentB]);
*/
