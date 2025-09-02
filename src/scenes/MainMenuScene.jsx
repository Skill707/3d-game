import React, { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Stars } from '@react-three/drei';
import { useAtomValue } from 'jotai';

import { MainMenu } from '../MainMenu';

// --- ИЗМЕНЕНИЯ ЗДЕСЬ ---

// Стили для контейнера сцены
const sceneContainerStyle = {
  width: '100vw',
  height: '100vh',
  background: 'linear-gradient(to bottom, #121a2d, #000000)',
  position: 'relative', // 1. Делаем контейнер точкой отсчета для z-index
};

// Стили для самого Canvas
const canvasStyle = {
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  zIndex: 1, // 2. Отправляем Canvas на задний план
};

// Стили для контейнера UI, чтобы он был поверх всего
const uiContainerStyle = {
    position: 'relative', // relative, т.к. сам компонент MainMenu уже абсолютно спозиционирован
    zIndex: 10, // 3. Выносим UI на передний план
};


// Компонент для анимации самолета (без изменений)
function AnimatedAirplane() {
  const airplaneConfig = null;;
  const ref = useRef();
  useFrame(({ clock }) => {
    ref.current.position.y = Math.sin(clock.getElapsedTime()) * 0.2;
  });

  return (
    <group
      ref={ref}
      animate={{ rotateY: [0, Math.PI * 2] }}
      transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
    >
      <group position={[6, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
      </group>
    </group>
  );
}


export function MainMenuScene() {
  return (
    <div style={sceneContainerStyle}>
      {/* Оборачиваем UI в контейнер с высоким z-index */}
      <div style={uiContainerStyle}>
        <MainMenu />
      </div>

      {/* Передаем стили в Canvas */}
      <Canvas style={canvasStyle} camera={{ position: [0, 1, 12], fov: 50 }}>
        <Suspense fallback={null}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={1} />
          <AnimatedAirplane />
          <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
          <Environment preset="night" />
        </Suspense>
      </Canvas>
    </div>
  );
}