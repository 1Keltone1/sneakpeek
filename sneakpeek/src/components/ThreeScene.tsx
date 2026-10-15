import { Canvas, useThree } from '@react-three/fiber';
import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { ShoeModel } from './ShoeModel';
import type { PoseData } from '../hooks/usePoseTracking';
import { POSE_LANDMARKS } from '../types/landmarks';
import './ThreeScene.css';

interface ThreeSceneProps {
  poseDataRef: React.MutableRefObject<PoseData | null>;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  forcedRotation: number;
}

export interface ThreeSceneHandle {
  getCanvas: () => HTMLCanvasElement | null;
}

function CanvasGrabber({ onCanvas }: { onCanvas: (c: HTMLCanvasElement) => void }) {
  const { gl } = useThree();

  useEffect(() => {
    onCanvas(gl.domElement);
  }, [gl, onCanvas]);

  return null;
}

export const ThreeScene = forwardRef<ThreeSceneHandle, ThreeSceneProps>(
  function ThreeScene({ poseDataRef, videoRef, forcedRotation }, ref) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useImperativeHandle(ref, () => ({
      getCanvas: () => canvasRef.current,
    }));

    return (
      <div className="three-scene-container">
        <Canvas
          orthographic
          camera={{ position: [0, 0, 1000], zoom: 1, near: 0.1, far: 10000 }}
          gl={{ alpha: true, antialias: true, preserveDrawingBuffer: true }}
          style={{ background: 'transparent' }}
        >
          <CanvasGrabber
            onCanvas={(c) => {
              canvasRef.current = c;
            }}
          />

          <ambientLight intensity={1.5} />
          <directionalLight position={[5, 5, 5]} intensity={1} />

          <ShoeModel
            poseDataRef={poseDataRef}
            videoRef={videoRef}
            ankleIndex={POSE_LANDMARKS.RIGHT_ANKLE}
            label="Правая нога"
            forcedRotation={forcedRotation}
          />

          <ShoeModel
            poseDataRef={poseDataRef}
            videoRef={videoRef}
            ankleIndex={POSE_LANDMARKS.LEFT_ANKLE}
            label="Левая нога"
            forcedRotation={forcedRotation}
          />
        </Canvas>
      </div>
    );
  }
);