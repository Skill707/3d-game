import { useLoader } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { createNoise2D } from "simplex-noise";
import { RigidBody, TrimeshCollider } from "@react-three/rapier";

function generateGround(width = 10, height = 10, segX = 50, segY = 50, amplitude = 2, frequency = 2) {
	const positions = [];
	const uvs = [];
	const halfW = width / 2;
	const halfH = height / 2;

	for (let iy = 0; iy <= segY; iy++) {
		const v = iy / segY;
		const yPos = v * height - halfH;

		for (let ix = 0; ix <= segX; ix++) {
			const u = ix / segX;
			const xPos = u * width - halfW;

			// плавные холмы через simplex noise
			const noise = createNoise2D();
			const z = noise(u * frequency, v * frequency) * amplitude;

			positions.push(xPos, z, yPos);
			uvs.push(u, v);
		}
	}

	// индексы треугольников
	const indices = [];
	for (let iy = 0; iy < segY; iy++) {
		for (let ix = 0; ix < segX; ix++) {
			const a = iy * (segX + 1) + ix;
			const b = iy * (segX + 1) + ix + 1;
			const c = (iy + 1) * (segX + 1) + ix;
			const d = (iy + 1) * (segX + 1) + ix + 1;

			indices.push(a, b, c);
			indices.push(b, d, c);
		}
	}

	const geo = new THREE.BufferGeometry();
	geo.setIndex(indices);
	geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
	geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
	geo.computeVertexNormals();

	return geo;
}

export const Ground = ({ width = 20, height = 20, segX = 50, segY = 50, amplitude = 2, frequency = 2 }) => {
	const texture = useLoader(THREE.TextureLoader, "/grass.webp");
	texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
	texture.repeat.set(1000, 1000); // сколько раз повторить текстуру

	const geometry = useMemo(() => generateGround(width, height, segX, segY, amplitude, frequency), [width, height, segX, segY, amplitude, frequency]);

	useEffect(() => {
		return () => geometry.dispose();
	}, [geometry]);

	const material = useMemo(() => new THREE.MeshStandardMaterial({ map: texture, side: THREE.BackSide }), [texture]);

	const [vertices, indices] = useMemo(() => {
		const pos = geometry.getAttribute("position");
		const index = geometry.index;

		// берём все вершины
		const vertices = Array.from(pos.array);

		// если есть индексы (обычно есть у плоскости/куба)
		const indices = index ? Array.from(index.array) : undefined;

		return [vertices, indices];
	}, [geometry]);

	return (
		<RigidBody type="fixed" colliders={false}>
			<mesh name={"ground"} geometry={geometry} material={material} castShadow receiveShadow />
			{indices && <TrimeshCollider args={[vertices, indices]} />}
		</RigidBody>
	);
};
