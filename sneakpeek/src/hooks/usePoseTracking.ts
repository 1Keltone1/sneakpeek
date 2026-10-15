import { useEffect, useRef, useState } from 'react';
import { PoseLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import type { Landmark } from '../types/landmarks';
import { PoseSmoother } from '../utils/smoothing';

export interface PoseData {
  landmarks: Landmark[];
  worldLandmarks: Landmark[];
}

interface UsePoseTrackingResult {
  poseDataRef: React.MutableRefObject<PoseData | null>;
  isReady: boolean;
  error: string | null;
}

export function usePoseTracking(
  videoRef: React.RefObject<HTMLVideoElement | null>
): UsePoseTrackingResult {
  const poseDataRef = useRef<PoseData | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const landmarkerRef = useRef<PoseLandmarker | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const frameCountRef = useRef(0);
  const smootherRef = useRef(new PoseSmoother(0.4));

  useEffect(() => {
    let isCancelled = false;

    async function initMediaPipe() {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );

        const landmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numPoses: 1,
        });

        if (isCancelled) {
          landmarker.close();
          return;
        }

        landmarkerRef.current = landmarker;
        setIsReady(true);
      } catch (err) {
        console.error('Ошибка инициализации MediaPipe:', err);
        setError('Не удалось загрузить модель трекинга.');
      }
    }

    initMediaPipe();

    return () => {
      isCancelled = true;
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (landmarkerRef.current) landmarkerRef.current.close();
    };
  }, []);

  useEffect(() => {
    if (!isReady) return;

    let lastVideoTime = -1;

    function processFrame() {
      const video = videoRef.current;
      const landmarker = landmarkerRef.current;

      if (video && landmarker && video.readyState >= 2) {
        frameCountRef.current++;
        if (frameCountRef.current % 3 === 0) {
          const currentTime = video.currentTime;

          if (currentTime !== lastVideoTime) {
            lastVideoTime = currentTime;

            const result = landmarker.detectForVideo(video, currentTime * 1000);

            if (result.landmarks && result.landmarks.length > 0) {
              const rawLandmarks = result.landmarks[0] as Landmark[];

              // Проверяем, что точки стопы в допустимом диапазоне [0, 1]
              const leftAnkle = rawLandmarks[27];
              const rightAnkle = rawLandmarks[28];

              const isValid =
                leftAnkle && rightAnkle &&
                leftAnkle.x >= 0 && leftAnkle.x <= 1 &&
                leftAnkle.y >= 0 && leftAnkle.y <= 1 &&
                rightAnkle.x >= 0 && rightAnkle.x <= 1 &&
                rightAnkle.y >= 0 && rightAnkle.y <= 1;

              if (isValid) {
                const smoothed = smootherRef.current.smooth(rawLandmarks);
                poseDataRef.current = {
                  landmarks: smoothed,
                  worldLandmarks: (result.worldLandmarks?.[0] as Landmark[]) ?? [],
                };
              } else {
                // Точки вне диапазона — сбрасываем
                smootherRef.current.reset();
                poseDataRef.current = null;
              }
            } else {
              smootherRef.current.reset();
              poseDataRef.current = null;
            }
          }
        }
      }

      animationFrameRef.current = requestAnimationFrame(processFrame);
    }

    animationFrameRef.current = requestAnimationFrame(processFrame);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isReady, videoRef]);

  return { poseDataRef, isReady, error };
}