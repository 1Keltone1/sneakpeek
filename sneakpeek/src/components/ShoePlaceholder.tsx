import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { Landmark } from '../types/landmarks';

interface ShoePlaceholderProps {
  landmarksRef: React.MutableRefObject<Landmark[] | null>;
  landmarkIndex: number; // ← индекс точки (27 для левой, 28 для правой)
  color: string; // ← цвет куба
}

export function ShoePlaceholder({
  landmarksRef,
  landmarkIndex,
  color,
}: ShoePlaceholderProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const { size } = useThree();

  useFrame(() => {
    const landmarks = landmarksRef.current;
    const mesh = meshRef.current;

    if (!landmarks || !mesh) {
      if (mesh) mesh.visible = false;
      return;
    }

    const landmark = landmarks[landmarkIndex];
    if (!landmark || landmark.visibility < 0.5) {
      mesh.visible = false;
      return;
    }

    mesh.visible = true;

    // Преобразуем нормализованные координаты (0..1) в экранные
    const x = (landmark.x - 0.5) * size.width;
    const y = -(landmark.y - 0.5) * size.height;
    const z = -landmark.z * 1000;

    mesh.position.set(x, y, z);

    const scale = 1 - landmark.z * 0.5;
    mesh.scale.setScalar(Math.max(0.3, scale));
  });

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[80, 80, 80]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}