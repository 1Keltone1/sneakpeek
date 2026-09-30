import { useRef, useEffect, useState } from 'react';
import { usePoseTracking } from '../hooks/usePoseTracking';
import { DebugOverlay } from './DebugOverlay'; 
import './ARCamera.css';

export function ARCamera() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { landmarksRef, isReady, error: trackingError } = usePoseTracking(videoRef);

  useEffect(() => {
    let stream: MediaStream | null = null;

    async function startCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
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
        console.error('Ошибка доступа к камере:', err);
        setError('Не удалось получить доступ к камере.');
        setIsLoading(false);
      }
    }

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Отладочный вывод координат стопы (временно)
  useEffect(() => {
    const interval = setInterval(() => {
      const lm = landmarksRef.current;
      if (lm) {
        console.log('Левая лодыжка:', lm[27]);
        console.log('Правая лодыжка:', lm[28]);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [landmarksRef]);

  return (
    <div className="ar-camera-container">
      <video
        ref={videoRef}
        className="ar-camera-video"
        playsInline
        muted
      />

      {isReady && (
        <DebugOverlay landmarksRef={landmarksRef} videoRef={videoRef} />
      )}

      {isLoading && (
        <div className="ar-camera-overlay">
          <p>Загрузка камеры...</p>
        </div>
      )}

      {error && (
        <div className="ar-camera-overlay">
          <p className="ar-camera-error">{error}</p>
        </div>
      )}

      {!isReady && !error && !isLoading && (
        <div className="ar-camera-overlay">
          <p>Загрузка модели трекинга...</p>
        </div>
      )}

      {trackingError && (
        <div className="ar-camera-overlay">
          <p className="ar-camera-error">{trackingError}</p>
        </div>
      )}

      {isReady && (
        <div className="ar-camera-status">
          <span className="ar-camera-status-dot" />
          Трекинг активен
        </div>
      )}
    </div>
  );
}