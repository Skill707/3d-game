// src/components/GameScene.jsx

import { useState, useEffect, useRef, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { Box, KeyboardControls, Loader, OrbitControls, Sky, Stats } from "@react-three/drei";
import Craft from "../components/Craft";
import { BallCollider, CuboidCollider, Physics, RigidBody } from "@react-three/rapier";
import * as THREE from "three";

export default function GameScene() {
	const Controls = {
		nextTool: "nextTool",
		reshapeTool: "reshapeTool",
		paintTool: "paintTool",
		connections: "connections",
		addPart: "addPart",
		properties: "properties",
		searchParts: "searchParts",
		menu: "menu",
	};
	const map = useMemo(
		() => [
			{ name: Controls.nextTool, keys: ["KeyM"] },
			{ name: Controls.reshapeTool, keys: ["KeyF"] },
			{ name: Controls.paintTool, keys: ["KeyP"] },
			{ name: Controls.connections, keys: ["KeyC"] },
			{ name: Controls.addPart, keys: ["KeyA"] },
			{ name: Controls.properties, keys: ["KeyB"] },
			{ name: Controls.searchParts, keys: ["KeyS"] },
			{ name: Controls.menu, keys: ["Escape", "`"] },
			{ name: Controls.start, keys: ["Space"] },
		],
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[]
	);

	function generateGround(width = 10, height = 10, segX = 50, segY = 50, amplitude = 2) {
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

				// случайные холмы (можно заменить на Perlin Noise)
				const z = Math.sin(u * Math.PI * 2) * Math.cos(v * Math.PI * 2) * amplitude + (Math.random() - 0.5) * 0.3;

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

	const Ground = ({ width = 20, height = 20, segX = 50, segY = 50, amplitude = 2 }) => {
		const geometry = useMemo(() => generateGround(width, height, segX, segY, amplitude), [width, height, segX, segY, amplitude]);

		useEffect(() => {
			return () => geometry.dispose();
		}, [geometry]);

		const material = useMemo(
			() =>
				new THREE.MeshStandardMaterial({
					color: "green",
					side: THREE.DoubleSide,
					wireframe: false,
				}),
			[]
		);

		return <mesh geometry={geometry} material={material} />;
	};

	return (
		<KeyboardControls map={map}>
			<Canvas shadows camera={{ position: [0, 5, 10], fov: 60 }}>
				<ambientLight intensity={0.5} />
				<directionalLight position={[10, 10, 5]} intensity={1} />
				<OrbitControls />
				<Sky />
				<Physics debug gravity={[0, -9.81, 0]}>
					<RigidBody colliders={false} position={[0, 10, 0]} type="dynamic" mass={100}>
						<Craft editor={false} />
						<CuboidCollider args={[1, 1, 1]} />
					</RigidBody>
					<RigidBody type="fixed" colliders="trimesh">
						<Ground width={500} height={500} segX={200} segY={50} amplitude={5} />
					</RigidBody>
				</Physics>
			</Canvas>
			<Stats className="stats" />
			<Loader />
		</KeyboardControls>
	);
}
