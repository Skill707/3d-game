import { useMemo, useEffect } from "react";
import * as THREE from "three";
import GlowMesh from "./GlowMesh";
import { ConvexHullCollider } from "@react-three/rapier";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

export const ConnectingSurface = ({ segmentA, segmentB, material, selected, editor }) => {
	// нормализация по углу вокруг центра
	function normalizeSection(section) {
		const cx = section.reduce((s, p) => s + p[0], 0) / section.length;
		const cy = section.reduce((s, p) => s + p[1], 0) / section.length;
		return section
			.map((p) => ({
				point: p,
				angle: Math.atan2(p[1] - cy, p[0] - cx),
			}))
			.sort((a, b) => a.angle - b.angle)
			.map((o) => o.point);
	}

	// циклический сдвиг массива
	function rotateSection(section, shift) {
		return [...section.slice(shift), ...section.slice(0, shift)];
	}

	// линейная интерполяция между двумя точками
	function lerp(p0, p1, t) {
		return [p0[0] + (p1[0] - p0[0]) * t, p0[1] + (p1[1] - p0[1]) * t, p0[2] + (p1[2] - p0[2]) * t];
	}

	// ресемплинг многоугольника до нужного количества вершин
	function resampleSection(section, targetCount) {
		const n = section.length;
		const resampled = [];
		for (let i = 0; i < targetCount; i++) {
			const t = (i / targetCount) * n;
			const i0 = Math.floor(t) % n;
			const i1 = (i0 + 1) % n;
			const f = t - i0;
			resampled.push(lerp(section[i0], section[i1], f));
		}
		return resampled;
	}

	// главная функция выравнивания
	function alignSections(sectionA, sectionB) {
		// сортировка по углу
		sectionA = normalizeSection(sectionA);
		sectionB = normalizeSection(sectionB);

		const n = Math.max(sectionA.length, sectionB.length);

		// ресемплинг до одинакового количества
		if (sectionA.length < n) sectionA = resampleSection(sectionA, n);
		if (sectionB.length < n) sectionB = resampleSection(sectionB, n);

		// ищем лучший сдвиг секции B
		let bestShift = 0;
		let bestError = Infinity;
		for (let shift = 0; shift < n; shift++) {
			const rotated = rotateSection(sectionB, shift);
			// сумма квадратов расстояний до A
			const error = sectionA.reduce((sum, p, i) => {
				const q = rotated[i];
				const dx = p[0] - q[0];
				const dy = p[1] - q[1];
				return sum + dx * dx + dy * dy;
			}, 0);
			if (error < bestError) {
				bestError = error;
				bestShift = shift;
			}
		}
		sectionB = rotateSection(sectionB, bestShift);

		return [sectionA, sectionB];
	}

	/*
	const calcGeometries = useMemo(() => {
		let sectionA = segmentA.points.map((p) => [p[0] + segmentA.pos[0], p[1] + segmentA.pos[1], p[2] + segmentA.pos[2]]);
		let sectionB = segmentB.points.map((p) => [p[0] + segmentB.pos[0], p[1] + segmentB.pos[1], p[2] + segmentB.pos[2]]);

		const [alignedA, alignedB] = alignSections(sectionA, sectionB);

		const geometries = [];
		for (let i = 0; i < alignedA.length; i++) {
			const i1 = (i + 1) % alignedA.length;
			const a0 = alignedA[i],
				a1 = alignedA[i1];
			const b0 = alignedB[i],
				b1 = alignedB[i1];

			const positions = [...a0, ...b0, ...a1, ...b0, ...b1, ...a1];
			const geo = new THREE.BufferGeometry();
			geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(positions), 3));
			geo.computeVertexNormals();
			geometries.push(geo);
		}
		return geometries;
	}, [segmentA, segmentB]);
	*/

	function sanitizeVerts(a) {
		// убираем NaN/Infinity и гарантируем кратность 3
		const out = [];
		for (let i = 0; i + 2 < a.length; i += 3) {
			const x = a[i],
				y = a[i + 1],
				z = a[i + 2];
			if (Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(z)) out.push(x, y, z);
		}
		return new Float32Array(out);
	}

	const { geometry, vertices } = useMemo(() => {
		// 1) генерим стенки между секциями
		const geos = [];
		const sectionA = segmentA.points.map((p) => [p[0] + segmentA.pos[0], p[1] + segmentA.pos[1], p[2] + segmentA.pos[2]]);
		const sectionB = segmentB.points.map((p) => [p[0] + segmentB.pos[0], p[1] + segmentB.pos[1], p[2] + segmentB.pos[2]]);
		const [A, B] = alignSections(sectionA, sectionB);

		for (let i = 0; i < A.length; i++) {
			const i1 = (i + 1) % A.length;
			const a0 = A[i],
				a1 = A[i1];
			const b0 = B[i],
				b1 = B[i1];
			const pos = new Float32Array([...a0, ...b0, ...a1, ...b0, ...b1, ...a1]);
			const g = new THREE.BufferGeometry();
			g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
			geos.push(g);
		}

		// 2) мерджим в одну геометрию
		const merged = mergeGeometries(geos, false);
		// важно: для выпуклой оболочки берём НЕиндексированные вершины
		const nonIndexed = merged.index ? merged.toNonIndexed() : merged;
		nonIndexed.computeVertexNormals();

		// 3) берём плоский Float32Array и санитизируем
		const verts = sanitizeVerts(nonIndexed.getAttribute("position").array);

		return { geometry: nonIndexed, vertices: verts };
	}, [segmentA, segmentB]);

	useEffect(() => () => geometry?.dispose(), [geometry]);

	return (
		<>
			<mesh name="side" geometry={geometry} material={material} receiveShadow castShadow />
			{!editor && <ConvexHullCollider args={[vertices]} />}
			{selected && editor && <GlowMesh geometry={geometry} />}
		</>
	);
};

/*
						{selected && <GlowMesh geometry={geo} />}


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
