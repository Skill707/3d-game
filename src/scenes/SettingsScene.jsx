import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { Stars, Environment } from "@react-three/drei";
import { SettingsMenu } from "../SettingsMenu";

// Те же стили фона, что и у MainMenuScene для единообразия
const sceneContainerStyle = {
	width: "100vw",
	height: "100vh",
	background: "linear-gradient(to bottom, #121a2d, #000000)",
	position: "relative",
};

export function SettingsScene() {
	return (
		<div style={sceneContainerStyle}>
			<SettingsMenu />

			{/* Мы создаем Canvas с фоном, но без тяжелых анимированных объектов */}
			<Canvas camera={{ position: [0, 1, 12], fov: 50 }}>
				<Suspense fallback={null}>
					<ambientLight intensity={0.5} />
					<pointLight position={[10, 10, 10]} intensity={1} />

					{/* Просто звезды для создания атмосферы */}
					<Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

					<Environment preset="night" />
				</Suspense>
			</Canvas>
		</div>
	);
}
