import { useRef, useEffect, useState } from 'react';
import { usePoseTracking } from '../hooks/usePoseTracking';
import { DebugOverlay } from './DebugOverlay';
import type { DebugOverlayHandle } from './DebugOverlay';
import { ThreeScene } from './ThreeScene';
import type { ThreeSceneHandle } from './ThreeScene';
import { ScreenshotCapture } from './ScreenshotCapture';
import type { ShoeConfig } from '../config/shoes'; // ← импорт конфига
import './ARCamera.css';

const DEBUG_MODE = false;

interface ARCameraProps {
  shoe: ShoeConfig;
  onBack: () => void;
}

export function ARCamera({ shoe, onBack }: ARCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const debugOverlayRef = useRef<DebugOverlayHandle>(null);
  const threeSceneRef = useRef<ThreeSceneHandle>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forcedRotation, setForcedRotation] = useState<number>(0);

  const { poseDataRef, isReady, error: trackingError } = usePoseTracking(videoRef);

  useEffect(() => {
    let stream: MediaStream | null = null;

    async function startCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play();
            setIsLoading(false);
          };
        }
      } catch (err) {
        setError('Не удалось получить доступ к камере.');
        setIsLoading(false);
      }
    }

    startCamera();

    return () => {
      if (stream) stream.getTracks().forEach((track) => track.stop());
    };
  }, []);

  return (
    <div className="ar-camera-container">
      <video ref={videoRef} className="ar-camera-video" playsInline muted />

      {DEBUG_MODE && isReady && (
        <DebugOverlay ref={debugOverlayRef} poseDataRef={poseDataRef} videoRef={videoRef} />
      )}

      {isReady && (
        <ThreeScene
          ref={threeSceneRef}
          poseDataRef={poseDataRef}
          videoRef={videoRef}
          forcedRotation={forcedRotation}
          shoe={shoe} // ← передаем модель в сцену
        />
      )}

      {/* ... оверлеи загрузки и ошибок ... */}

      {isReady && (
        <>
          {/* Кнопка "Назад" */}
          <button className="ar-back-button" onClick={onBack}>
            ← Назад
          </button>

          <div className="ar-camera-status">
            <span className="ar-camera-status-dot" />
            {shoe.name}
          </div>

          <ScreenshotCapture
            videoRef={videoRef}
            debugOverlayRef={debugOverlayRef}
            threeSceneRef={threeSceneRef}
            onRotationChange={setForcedRotation}
          />
        </>
      )}
    </div>
  );
}