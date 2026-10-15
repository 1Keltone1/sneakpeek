import { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import type { PoseData } from '../hooks/usePoseTracking';

interface ShoeModelProps {
  poseDataRef: React.MutableRefObject<PoseData | null>;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  ankleIndex: number;
  label: string;
  forcedRotation: number;
}

const BASE_MODEL_SCALE = 500;
// Опорная высота тела (нос → лодыжка) в пикселях,
// при которой модель имеет «правильный» размер
const BASE_BODY_HEIGHT = 400;

export function ShoeModel({
  poseDataRef,
  videoRef,
  ankleIndex,
  label,
  forcedRotation,
}: ShoeModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const rotationRef = useRef<THREE.Group>(null);
  const { size } = useThree();

  const { scene } = useGLTF(`${import.meta.env.BASE_URL}models/nike.glb`);

  const modelData = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (child.material instanceof THREE.MeshStandardMaterial) {
          child.material = child.material.clone();
          child.material.side = THREE.DoubleSide;
        }
      }
    });

    const box = new THREE.Box3().setFromObject(clone);
    const center = box.getCenter(new THREE.Vector3());
    const min = box.min;

    const offset = {
      x: -center.x * BASE_MODEL_SCALE,
      y: -min.y * BASE_MODEL_SCALE,
      z: -min.z * BASE_MODEL_SCALE,
    };

    return { clone, offset };
  }, [scene]);

  useEffect(() => {
    return () => {
      modelData.clone.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry?.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => m.dispose());
          } else {
            child.material?.dispose();
          }
        }
      });
    };
  }, [modelData]);

  useFrame(() => {
    const poseData = poseDataRef.current;
    const group = groupRef.current;
    const rotationGroup = rotationRef.current;
    const video = videoRef.current;

    if (!poseData || !group || !video) {
      if (group) group.visible = false;
      return;
    }

    const lm = poseData.landmarks;
    const ankle = lm[ankleIndex];

    if (!ankle || ankle.visibility < 0.5) {
      group.visible = false;
      return;
    }

    group.visible = true;

    // ============================
    // ПОЗИЦИЯ — по лодыжке
    // ============================
    const rect = video.getBoundingClientRect();
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;
    const containerWidth = rect.width;
    const containerHeight = rect.height;

    const videoAspect = videoWidth / videoHeight;
    const containerAspect = containerWidth / containerHeight;

    let coverScale: number;
    let offsetX = 0;
    let offsetY = 0;

    if (videoAspect > containerAspect) {
      coverScale = containerHeight / videoHeight;
      const scaledWidth = videoWidth * coverScale;
      offsetX = (scaledWidth - containerWidth) / 2;
    } else {
      coverScale = containerWidth / videoWidth;
      const scaledHeight = videoHeight * coverScale;
      offsetY = (scaledHeight - containerHeight) / 2;
    }

    const screenX = ankle.x * videoWidth * coverScale - offsetX;
    const screenY = ankle.y * videoHeight * coverScale - offsetY;

    const normalizedX = screenX / containerWidth;
    const normalizedY = screenY / containerHeight;

    const x = (normalizedX - 0.5) * size.width;
    const y = -(normalizedY - 0.5) * size.height;
    const z = -ankle.z * 1000;

    group.position.set(x, y, z);

    // ============================
    // МАСШТАБ — по высоте тела (нос → лодыжка)
    // ============================
    let scaleMultiplier = 1;

    const nose = lm[0];
    if (nose && nose.visibility > 0.5) {
      const dx = (nose.x - ankle.x) * containerWidth;
      const dy = (nose.y - ankle.y) * containerHeight;
      const bodyHeight = Math.sqrt(dx * dx + dy * dy);

      scaleMultiplier = bodyHeight / BASE_BODY_HEIGHT;
      scaleMultiplier = Math.max(0.3, Math.min(3, scaleMultiplier));

      console.log(`[${label}] bodyHeight:`, bodyHeight.toFixed(1), 'scale:', scaleMultiplier.toFixed(2));
    }

    group.scale.setScalar(scaleMultiplier);

    // ============================
    // ОРИЕНТАЦИЯ — фиксированный поворот вокруг Y
    // ============================
    if (rotationGroup) {
      const angle = THREE.MathUtils.degToRad(forcedRotation);
      rotationGroup.rotation.y = angle;
    }
  });

  return (
    <group ref={groupRef}>
      <group ref={rotationRef}>
        <primitive
          object={modelData.clone}
          scale={BASE_MODEL_SCALE}
          position={[
            modelData.offset.x,
            modelData.offset.y - 55,
            modelData.offset.z,
          ]}
          rotation={[Math.PI, Math.PI / 2, Math.PI]}
        />
      </group>
    </group>
  );
}

useGLTF.preload(`${import.meta.env.BASE_URL}models/nike.glb`);