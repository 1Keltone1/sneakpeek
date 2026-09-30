import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { POSE_LANDMARKS } from '../types/landmarks';
import type { Landmark } from '../types/landmarks';
import './DebugOverlay.css';

interface DebugOverlayProps {
  landmarksRef: React.MutableRefObject<Landmark[] | null>;
  videoRef: React.RefObject<HTMLVideoElement | null>;
}

// Что мы "выставляем" наружу через ref
export interface DebugOverlayHandle {
  getCanvas: () => HTMLCanvasElement | null;
}

const POINTS_TO_SHOW = [
  { index: POSE_LANDMARKS.LEFT_ANKLE, color: '#4ade80', label: 'L-ankle' },
  { index: POSE_LANDMARKS.RIGHT_ANKLE, color: '#60a5fa', label: 'R-ankle' },
  { index: POSE_LANDMARKS.LEFT_HEEL, color: '#facc15', label: 'L-heel' },
  { index: POSE_LANDMARKS.RIGHT_HEEL, color: '#f472b6', label: 'R-heel' },
  { index: POSE_LANDMARKS.LEFT_FOOT_INDEX, color: '#a78bfa', label: 'L-toe' },
  { index: POSE_LANDMARKS.RIGHT_FOOT_INDEX, color: '#fb923c', label: 'R-toe' },
];

export const DebugOverlay = forwardRef<DebugOverlayHandle, DebugOverlayProps>(
  function DebugOverlay({ landmarksRef, videoRef }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameRef = useRef<number | null>(null);

    // Отдаём canvas наружу через ref
    useImperativeHandle(ref, () => ({
      getCanvas: () => canvasRef.current,
    }));

    useEffect(() => {
      function draw() {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        const landmarks = landmarksRef.current;

        if (canvas && video) {
          const rect = video.getBoundingClientRect();
          if (canvas.width !== rect.width || canvas.height !== rect.height) {
            canvas.width = rect.width;
            canvas.height = rect.height;
          }

          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            if (landmarks && landmarks.length > 0) {
              for (const point of POINTS_TO_SHOW) {
                const landmark = landmarks[point.index];
                if (!landmark) continue;
                if (landmark.visibility < 0.1) continue;

                const { x, y } = mapToCanvas(
                  landmark.x,
                  landmark.y,
                  video,
                  canvas
                );

                ctx.beginPath();
                ctx.arc(x, y, 8, 0, 2 * Math.PI);
                ctx.fillStyle = point.color;
                ctx.fill();
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 2;
                ctx.stroke();

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
);

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

  const videoAspect = videoWidth / videoHeight;
  const containerAspect = containerWidth / containerHeight;

  let scale: number;
  let offsetX = 0;
  let offsetY = 0;

  if (videoAspect > containerAspect) {
    scale = containerHeight / videoHeight;
    const scaledWidth = videoWidth * scale;
    offsetX = (scaledWidth - containerWidth) / 2;
  } else {
    scale = containerWidth / videoWidth;
    const scaledHeight = videoHeight * scale;
    offsetY = (scaledHeight - containerHeight) / 2;
  }

  const x = normalizedX * videoWidth * scale - offsetX;
  const y = normalizedY * videoHeight * scale - offsetY;

  return { x, y };
}