import { useState, useRef, useEffect } from 'react';
import { captureFrame } from '../utils/captureFrame';
import type { DebugOverlayHandle } from './DebugOverlay';
import './ScreenshotCapture.css';

interface ScreenshotCaptureProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  debugOverlayRef: React.RefObject<DebugOverlayHandle | null>;
}

type CaptureState = 'idle' | 'countdown' | 'capturing' | 'done';

export function ScreenshotCapture({
  videoRef,
  debugOverlayRef,
}: ScreenshotCaptureProps) {
  const [state, setState] = useState<CaptureState>('idle');
  const [countdown, setCountdown] = useState(0);
  const [screenshots, setScreenshots] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const countdownTimerRef = useRef<number | null>(null);
  const captureTimerRef = useRef<number | null>(null);

  const SHOTS_COUNT = 3;
  const SHOT_INTERVAL = 1000;
  const COUNTDOWN_SECONDS = 5;

  useEffect(() => {
    return () => {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
      if (captureTimerRef.current) clearTimeout(captureTimerRef.current);
    };
  }, []);

  const startCapture = () => {
    setState('countdown');
    setCountdown(COUNTDOWN_SECONDS);

    countdownTimerRef.current = window.setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
          startActualCapture();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const startActualCapture = () => {
    setState('capturing');
    setScreenshots([]);
    setCurrentIndex(0);

    const video = videoRef.current;
    if (!video) {
      setState('idle');
      return;
    }

    const captured: string[] = [];

    const takeShot = (shotIndex: number) => {
      if (shotIndex >= SHOTS_COUNT) {
        setState('done');
        return;
      }

      try {
        const overlayCanvas = debugOverlayRef.current?.getCanvas() ?? null;
        const dataUrl = captureFrame(video, overlayCanvas);
        captured.push(dataUrl);
        setScreenshots([...captured]);
        setCurrentIndex(shotIndex + 1);
      } catch (err) {
        console.error('Ошибка захвата кадра:', err);
        setState('idle');
        return;
      }

      captureTimerRef.current = window.setTimeout(() => {
        takeShot(shotIndex + 1);
      }, SHOT_INTERVAL);
    };

    takeShot(0);
  };

  const downloadScreenshot = (dataUrl: string, index: number) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `sneakpeek-${Date.now()}-${index + 1}.png`;
    link.click();
  };

  const downloadAll = () => {
    screenshots.forEach((dataUrl, index) => {
      setTimeout(() => downloadScreenshot(dataUrl, index), index * 300);
    });
  };

  const reset = () => {
    setState('idle');
    setScreenshots([]);
    setCurrentIndex(0);
  };

  return (
    <>
      {state === 'idle' && (
        <button className="screenshot-button" onClick={startCapture}>
          📸 Сделать скриншоты
        </button>
      )}

      {state === 'countdown' && (
        <div className="screenshot-countdown">
          <span className="screenshot-countdown-number">{countdown}</span>
          <p className="screenshot-countdown-hint">
            Отойдите и встаньте так, чтобы были видны ноги и лицо
          </p>
        </div>
      )}

      {state === 'capturing' && (
        <div className="screenshot-capturing">
          <span className="screenshot-capturing-dot" />
          Снимок {currentIndex} из {SHOTS_COUNT}
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
                <img src={dataUrl} alt={`Снимок ${index + 1}`} />
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