import * as THREE from "three";

export default function GlowMesh({ geometry, position, rotation, scale }) {
	const GlowMaterial = {
		uniforms: {
			glowColor: { value: new THREE.Color(0x00ffff) },
			strength: { value: 0.1 }, // насколько растянуть наружу
			opacity: { value: 0.25 }, // максимальная яркость
		},
		vertexShader: `
                        uniform float strength;
                        varying vec3 vNormal;
                        void main() {
                            vNormal = normalize(normalMatrix * normal);
                           vec3 scaledPosition = position * (1.0 + strength);
                            gl_Position = projectionMatrix * modelViewMatrix * vec4(scaledPosition, 1.0);
                        }
                    `,
		fragmentShader: `
                            uniform vec3 glowColor;
                            uniform float opacity;
                            varying vec3 vNormal;
                            void main() {
                                float intensity = pow(0.6 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
                                gl_FragColor = vec4(glowColor, intensity * opacity);
                            }
                        `,
		transparent: true,
		side: THREE.BackSide, // важный момент — рисуем с обратной стороны
		depthWrite: false,
	};

	return (
		<mesh name="glowMesh" geometry={geometry} position={position} rotation={rotation} scale={scale}>
			<shaderMaterial
				attach="material"
				args={[GlowMaterial]}
				side={THREE.DoubleSide} // рисуем с обратной стороны
				transparent
			/>
		</mesh>
	);
}
