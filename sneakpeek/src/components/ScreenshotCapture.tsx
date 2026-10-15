import { useState, useRef, useEffect } from 'react';
import { captureFrame } from '../utils/captureFrame';
import type { DebugOverlayHandle } from './DebugOverlay';
import type { ThreeSceneHandle } from './ThreeScene';
import './ScreenshotCapture.css';

interface ScreenshotCaptureProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  debugOverlayRef: React.RefObject<DebugOverlayHandle | null>;
  threeSceneRef: React.RefObject<ThreeSceneHandle | null>;
  onRotationChange?: (rotation: number) => void;
}

type CaptureState = 'idle' | 'countdown' | 'done';

const STEPS = [
  { rotation: 0, hint: 'Прямо' },
  { rotation: 90, hint: 'Правый поворот' },
  { rotation: -90, hint: 'Левый поворот' },
];

const COUNTDOWN_SECONDS = 5;

export function ScreenshotCapture({
  videoRef,
  threeSceneRef,
  onRotationChange,
}: ScreenshotCaptureProps) {
  const [state, setState] = useState<CaptureState>('idle');
  const [countdown, setCountdown] = useState(0);
  const [currentHint, setCurrentHint] = useState('');
  const [stepIndex, setStepIndex] = useState(0);
  const [screenshots, setScreenshots] = useState<string[]>([]);

  const isRunningRef = useRef(false);
  const countdownTimerRef = useRef<number | null>(null);
  const capturedRef = useRef<string[]>([]);
  const stepIndexRef = useRef(0);

  useEffect(() => {
    return () => {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
    };
  }, []);

  const startScenario = () => {
    if (isRunningRef.current) return;

    isRunningRef.current = true;
    capturedRef.current = [];
    stepIndexRef.current = 0;
    setScreenshots([]);
    setStepIndex(0);

    runStep(0);
  };

  const runStep = (index: number) => {
    if (index >= STEPS.length) {
      setState('done');
      onRotationChange?.(0);
      isRunningRef.current = false;
      return;
    }

    stepIndexRef.current = index;
    const step = STEPS[index];

    setCurrentHint(step.hint);
    setStepIndex(index);
    setState('countdown');
    setCountdown(COUNTDOWN_SECONDS);

    onRotationChange?.(step.rotation);

    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }

    countdownTimerRef.current = window.setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (countdownTimerRef.current) {
            clearInterval(countdownTimerRef.current);
            countdownTimerRef.current = null;
          }

          takeScreenshot();

          window.setTimeout(() => {
            runStep(index + 1);
          }, 1000);

          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const takeScreenshot = () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      const threeCanvas = threeSceneRef.current?.getCanvas() ?? null;

      // ВАЖНО: не передаём debugOverlayCanvas — точки не попадут на скриншот
      const dataUrl = captureFrame(video, null, threeCanvas);
      capturedRef.current.push(dataUrl);
      setScreenshots([...capturedRef.current]);
    } catch (err) {
      console.error('Ошибка захвата:', err);
    }
  };

  const downloadScreenshot = (dataUrl: string, index: number) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `sneakpeek-${STEPS[index]?.hint ?? index + 1}-${Date.now()}.png`;
    link.click();
  };

  const downloadAll = () => {
    screenshots.forEach((dataUrl, index) => {
      setTimeout(() => downloadScreenshot(dataUrl, index), index * 300);
    });
  };

  const reset = () => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    isRunningRef.current = false;
    capturedRef.current = [];
    stepIndexRef.current = 0;

    setState('idle');
    setScreenshots([]);
    setStepIndex(0);
    setCurrentHint('');
    setCountdown(0);
    onRotationChange?.(0);
  };

  return (
    <>
      {state === 'idle' && (
        <button className="screenshot-button" onClick={startScenario}>
          📸 Сделать скриншоты
        </button>
      )}

      {state === 'countdown' && (
        <div className="screenshot-countdown">
          <div className="screenshot-step-indicator">
            Шаг {stepIndex + 1} из {STEPS.length}
          </div>
          <span className="screenshot-countdown-number">{countdown}</span>
          <p className="screenshot-countdown-hint">{currentHint}</p>
        </div>
      )}

      {state === 'done' && screenshots.length > 0 && (
        <div className="screenshot-gallery">
          <div className="screenshot-gallery-header">
            <h3>Снимки примерки</h3>
            <button className="screenshot-close" onClick={reset}>
              ✕
            </button>
          </div>

          <div className="screenshot-gallery-grid">
            {screenshots.map((dataUrl, index) => (
              <div key={index} className="screenshot-item">
                <img src={dataUrl} alt={STEPS[index]?.hint ?? `Снимок ${index + 1}`} />
                <div className="screenshot-label">
                  {STEPS[index]?.hint ?? ''}
                </div>
                <button
                  className="screenshot-download"
                  onClick={() => downloadScreenshot(dataUrl, index)}
                >
                  ⬇
                </button>
              </div>
            ))}
          </div>

          <div className="screenshot-gallery-actions">
            <button className="screenshot-action-primary" onClick={downloadAll}>
              Скачать все
            </button>
            <button className="screenshot-action-secondary" onClick={reset}>
              Сделать ещё
            </button>
          </div>
        </div>
      )}
    </>
  );
}