import { useEffect, useRef, useState } from 'react';
import { PoseLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import type { Landmark } from '../types/landmarks';
import { PoseSmoother } from '../utils/smoothing';

interface UsePoseTrackingResult {
  landmarksRef: React.MutableRefObject<Landmark[] | null>;
  isReady: boolean;
  error: string | null;
}

export function usePoseTracking(
  videoRef: React.RefObject<HTMLVideoElement | null>
): UsePoseTrackingResult {
  // "Горячие" данные — храним в ref, чтобы не вызывать ре-рендеры
  const landmarksRef = useRef<Landmark[] | null>(null);

  // "Холодные" данные — состояние загрузки/ошибки
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Все refs — на верхнем уровне, до useEffect
  const landmarkerRef = useRef<PoseLandmarker | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const frameCountRef = useRef(0); // ← перенесли сюда
  const smootherRef = useRef(new PoseSmoother(0.5)); // ← сглаживание

  // Инициализация MediaPipe
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
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (landmarkerRef.current) {
        landmarkerRef.current.close();
      }
    };
  }, []);

  // Цикл обработки видеокадров
  useEffect(() => {
    if (!isReady) return;

    let lastVideoTime = -1;

    function processFrame() {
      const video = videoRef.current;
      const landmarker = landmarkerRef.current;

      if (video && landmarker && video.readyState >= 2) {
        // Пропускаем 2 из 3 кадров для производительности на телефоне
        frameCountRef.current++;
        if (frameCountRef.current % 3 === 0) {
          const currentTime = video.currentTime;

          // Обрабатываем только новые кадры
          if (currentTime !== lastVideoTime) {
            lastVideoTime = currentTime;

            // Используем время видео, а не performance.now()
            const videoTimeMs = currentTime * 1000;
            const result = landmarker.detectForVideo(video, videoTimeMs);

            if (result.landmarks && result.landmarks.length > 0) {
              // Сглаживаем "сырые" координаты
              const smoothed = smootherRef.current.smooth(
                result.landmarks[0] as Landmark[]
              );
              landmarksRef.current = smoothed;
            } else {
              // Человек потерян из виду — сбрасываем сглаживатель
              smootherRef.current.reset();
              landmarksRef.current = null;
            }
          }
        }
      }

      animationFrameRef.current = requestAnimationFrame(processFrame);
    }

    animationFrameRef.current = requestAnimationFrame(processFrame);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isReady, videoRef]);

  return { landmarksRef, isReady, error };
}