import { Canvas } from '@react-three/fiber';
import { ShoePlaceholder } from './ShoePlaceholder';
import type { Landmark } from '../types/landmarks';
import { POSE_LANDMARKS } from '../types/landmarks';
import './ThreeScene.css';

interface ThreeSceneProps {
  landmarksRef: React.MutableRefObject<Landmark[] | null>;
}

export function ThreeScene({ landmarksRef }: ThreeSceneProps) {
  return (
    <div className="three-scene-container">
      <Canvas
        orthographic
        camera={{
          position: [0, 0, 1000],
          zoom: 1,
          near: 0.1,
          far: 10000,
        }}
        gl={{ alpha: true, antialias: true }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={1.5} />
        <directionalLight position={[5, 5, 5]} intensity={1} />

        {/* Левая нога — зелёный куб */}
        <ShoePlaceholder
          landmarksRef={landmarksRef}
          landmarkIndex={POSE_LANDMARKS.LEFT_ANKLE}
          color="#4ade80"
        />

        {/* Правая нога — синий куб */}
        <ShoePlaceholder
          landmarksRef={landmarksRef}
          landmarkIndex={POSE_LANDMARKS.RIGHT_ANKLE}
          color="#60a5fa"
        />
      </Canvas>
    </div>
  );
}