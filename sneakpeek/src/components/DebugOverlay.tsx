import { useEffect, useRef } from 'react';
import { POSE_LANDMARKS } from '../types/landmarks';
import type { Landmark } from '../types/landmarks';
import './DebugOverlay.css';

interface DebugOverlayProps {
  landmarksRef: React.MutableRefObject<Landmark[] | null>;
  videoRef: React.RefObject<HTMLVideoElement | null>;
}

// Точки, которые хотим визуализировать
const POINTS_TO_SHOW = [
  { index: POSE_LANDMARKS.LEFT_ANKLE, color: '#4ade80', label: 'L-ankle' },
  { index: POSE_LANDMARKS.RIGHT_ANKLE, color: '#60a5fa', label: 'R-ankle' },
  { index: POSE_LANDMARKS.LEFT_HEEL, color: '#facc15', label: 'L-heel' },
  { index: POSE_LANDMARKS.RIGHT_HEEL, color: '#f472b6', label: 'R-heel' },
  { index: POSE_LANDMARKS.LEFT_FOOT_INDEX, color: '#a78bfa', label: 'L-toe' },
  { index: POSE_LANDMARKS.RIGHT_FOOT_INDEX, color: '#fb923c', label: 'R-toe' },
];

export function DebugOverlay({ landmarksRef, videoRef }: DebugOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    function draw() {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const landmarks = landmarksRef.current;

      if (canvas && video) {
        // Синхронизируем размер canvas с размером видео
        const rect = video.getBoundingClientRect();
        if (canvas.width !== rect.width || canvas.height !== rect.height) {
          canvas.width = rect.width;
          canvas.height = rect.height;
        }

        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Очищаем canvas
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          if (landmarks && landmarks.length > 0) {
            for (const point of POINTS_TO_SHOW) {
              const landmark = landmarks[point.index];
              if (!landmark) continue;

              // Проверяем уверенность модели
              if (landmark.visibility < 0.5) continue;

              // Преобразуем нормализованные координаты в пиксели canvas
              // Важно: видео использует object-fit: cover,
              // поэтому нужно учитывать обрезку по краям
              const { x, y } = mapToCanvas(
                landmark.x,
                landmark.y,
                video,
                canvas
              );

              // Рисуем точку
              ctx.beginPath();
              ctx.arc(x, y, 8, 0, 2 * Math.PI);
              ctx.fillStyle = point.color;
              ctx.fill();
              ctx.strokeStyle = '#fff';
              ctx.lineWidth = 2;
              ctx.stroke();

              // Подпись
              ctx.fillStyle = '#fff';
              ctx.font = 'bold 12px sans-serif';
              ctx.fillText(point.label, x + 12, y + 4);
            }
          }
        }
      }

      animationFrameRef.current = requestAnimationFrame(draw);
    }

    animationFrameRef.current = requestAnimationFrame(draw);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [landmarksRef, videoRef]);

  return <canvas ref={canvasRef} className="debug-overlay-canvas" />;
}

// Преобразование нормализованных координат MediaPipe в пиксели canvas
// с учётом object-fit: cover
function mapToCanvas(
  normalizedX: number,
  normalizedY: number,
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement
) {
  const videoWidth = video.videoWidth;
  const videoHeight = video.videoHeight;
  const containerWidth = canvas.width;
  const containerHeight = canvas.height;

  // Соотношения сторон
  const videoAspect = videoWidth / videoHeight;
  const containerAspect = containerWidth / containerHeight;

  let scale: number;
  let offsetX = 0;
  let offsetY = 0;

  if (videoAspect > containerAspect) {
    // Видео шире контейнера — обрезается по бокам
    scale = containerHeight / videoHeight;
    const scaledWidth = videoWidth * scale;
    offsetX = (scaledWidth - containerWidth) / 2;
  } else {
    // Видео выше контейнера — обрезается сверху и снизу
    scale = containerWidth / videoWidth;
    const scaledHeight = videoHeight * scale;
    offsetY = (scaledHeight - containerHeight) / 2;
  }

  // Применяем: нормализованные координаты → пиксели видео → пиксели canvas
  const x = normalizedX * videoWidth * scale - offsetX;
  const y = normalizedY * videoHeight * scale - offsetY;

  return { x, y };
}