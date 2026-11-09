import { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import type { PoseData } from '../hooks/usePoseTracking';
import type { ShoeConfig } from '../config/shoes';

interface ShoeModelProps {
  poseDataRef: React.MutableRefObject<PoseData | null>;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  ankleIndex: number;
  forcedRotation: number;
  shoe: ShoeConfig;
  mirrored?: boolean;
}

const BASE_BODY_HEIGHT = 400;

export function ShoeModel({
  poseDataRef,
  videoRef,
  ankleIndex,
  forcedRotation,
  shoe,
  mirrored = false,
}: ShoeModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const rotationRef = useRef<THREE.Group>(null);
  const { size } = useThree();

  const modelPath = `${import.meta.env.BASE_URL}${shoe.modelPath}`;
  const { scene } = useGLTF(modelPath);

  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (Array.isArray(child.material)) {
          child.material = child.material.map((m) => {
            const newMat = m.clone();
            newMat.side = THREE.DoubleSide;
            newMat.needsUpdate = true;
            return newMat;
          });
        } else if (child.material) {
          child.material = child.material.clone();
          child.material.side = THREE.DoubleSide;
          child.material.needsUpdate = true;
        }
      }
    });
    return clone;
  }, [scene]);

  useEffect(() => {
    return () => {
      clonedScene.traverse((child) => {
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
  }, [clonedScene]);

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

    // ПОЗИЦИЯ
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

    // МАСШТАБ
    let scaleMultiplier = 1;

    const nose = lm[0];
    if (nose && nose.visibility > 0.5) {
      const dx = (nose.x - ankle.x) * containerWidth;
      const dy = (nose.y - ankle.y) * containerHeight;
      const bodyHeight = Math.sqrt(dx * dx + dy * dy);

      scaleMultiplier = bodyHeight / BASE_BODY_HEIGHT;
      scaleMultiplier = Math.max(0.3, Math.min(3, scaleMultiplier));
    }

    group.scale.setScalar(scaleMultiplier);

    // ОРИЕНТАЦИЯ
    if (rotationGroup) {
      const angle = THREE.MathUtils.degToRad(forcedRotation);
      rotationGroup.rotation.y = angle;
    }
  });

  return (
    <group ref={groupRef}>
      <group position={[0, -50, 0]}>
        
        <group ref={rotationRef}>
          
          <group 
            scale={[mirrored ? -1 : 1, 1, 1]} 
            rotation={[0, Math.PI, 0]}
          >
            <group position={[0, 0, 15]}>
              <primitive
                object={clonedScene}
                scale={shoe.scale}
              />
            </group>
          </group>
        </group>
      </group>
    </group>
  );
}