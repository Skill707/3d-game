import { useEffect, useMemo, useRef } from "react";
import { Canvas, useLoader } from "@react-three/fiber";
import { KeyboardControls, Loader, OrbitControls, Sky, Stats } from "@react-three/drei";
import { Physics, RigidBody, TrimeshCollider } from "@react-three/rapier";
import * as THREE from "three";
import { useAtom } from "jotai";
import { baseSceneAtom } from "../state/atoms";
import partsStorageAtom from "../state/partsStorageAtom";
import { CreatePart } from "../utils/partFactory";
import { createNoise2D } from "simplex-noise";

export default function GameScene() {
	const [scene, setScene] = useAtom(baseSceneAtom);
	const [partsStorage, partsStorageAPI] = useAtom(partsStorageAtom);

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

	const Ground = ({ width = 20, height = 20, segX = 50, segY = 50, amplitude = 2, frequency = 2 }) => {
		const texture = useLoader(THREE.TextureLoader, "../../public/grass.webp");
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
				<mesh geometry={geometry} material={material} castShadow receiveShadow />
				{indices && <TrimeshCollider args={[vertices, indices]} />}
			</RigidBody>
		);
	};

	const craftRef = useRef(null);

	useEffect(() => {
		if (craftRef.current) {
			// A one-off "push"
			craftRef.current.applyImpulse({ x: 0, y: 10, z: 0 }, true);

			// A continuous force
			craftRef.current.addForce({ x: 0, y: 10, z: 0 }, true);

			// A one-off torque rotation
			craftRef.current.applyTorqueImpulse({ x: 0, y: 10, z: 0 }, true);

			// A continuous torque
			craftRef.current.addTorque({ x: 0, y: 10, z: 0 }, true);
		}
	}, []);

	return (
		<>
			<button style={{ position: "absolute", display: "block", zIndex: 100 }} onClick={() => setScene("editor")}>
				editor
			</button>
			<KeyboardControls map={map}>
				<Canvas shadows camera={{ position: [0, 5, 10], fov: 60 }}>
					<ambientLight intensity={0.5} />
					<directionalLight
						castShadow
						position={[100, 100, 0]}
						intensity={0.5}
						shadow-mapSize-width={4096}
						shadow-mapSize-height={4096}
						shadow-camera-left={-100}
						shadow-camera-right={100}
						shadow-camera-top={100}
						shadow-camera-bottom={-100}
						shadow-bias={-0.0001}
					/>
					<OrbitControls enablePan={true} minDistance={5} maxDistance={20} maxPolarAngle={Math.PI / 2 - 0.1} makeDefault />
					<Sky sunPosition={[100, 100, 0]} />
					<Physics gravity={[0, -9.81, 0]} debug>
						<RigidBody ref={craftRef} colliders={false} position={[0, 15, 0]} type="dynamic" mass={100}>
							{partsStorage.parts.map((part) => (
								<CreatePart key={part.id} part={part} />
							))}
						</RigidBody>
						<Ground width={2000} height={2000} segX={100} segY={100} amplitude={3} frequency={5} />
					</Physics>
				</Canvas>
				<Stats className="stats" />
				<Loader />
			</KeyboardControls>
		</>
	);
}
