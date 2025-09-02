import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import GlowMesh from "./GlowMesh";

export const Segment = ({ segment, material, selected }) => {
	const geometry = useMemo(() => {
		const positions = [];

		const sectionA = segment.points.map((p) => [p[0], p[1], p[2] * (segment.name === "front" ? -1 : 1)]);
		const sectionB = segment.points.map(() => [0, 0, 0]);

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
	}, [segment]);

	useEffect(() => {
		return () => geometry.dispose();
	}, [geometry]);

	if (geometry)
		return (
			<>
				<mesh
					name={segment.name}
					geometry={geometry}
					material={material}
					visible={segment.closed}
					position={segment.pos}
					rotation={segment.name === "front" ? [0, Math.PI, 0] : [0, 0, 0]}
				/>
				{selected && (
					<GlowMesh
						geometry={geometry}
						position={[segment.pos[0], segment.pos[1], segment.pos[2] + (segment.name === "front" ? 0.1 : -0.1)]}
						rotation={segment.name === "front" ? [0, Math.PI, 0] : [0, 0, 0]}
					/>
				)}
			</>
		);
};
