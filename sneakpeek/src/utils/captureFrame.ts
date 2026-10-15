export function captureFrame(
  video: HTMLVideoElement,
  debugOverlayCanvas: HTMLCanvasElement | null = null,
  threeCanvas: HTMLCanvasElement | null = null
): string {
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Не удалось получить 2D-контекст canvas');

  // Размеры видео и контейнера
  const videoW = video.videoWidth;
  const videoH = video.videoHeight;
  const containerW = video.clientWidth;
  const containerH = video.clientHeight;

  const videoAspect = videoW / videoH;
  const containerAspect = containerW / containerH;

  // Вычисляем, какую часть видео нужно вырезать, чтобы
  // получить такую же картинку, как на экране (object-fit: cover)
  let sx = 0, sy = 0, sw = videoW, sh = videoH;

  if (videoAspect > containerAspect) {
    // Видео шире контейнера — обрезаем по бокам
    sw = videoH * containerAspect;
    sx = (videoW - sw) / 2;
  } else {
    // Видео выше контейнера — обрезаем сверху и снизу
    sh = videoW / containerAspect;
    sy = (videoH - sh) / 2;
  }

  // Теперь рисуем видео так, чтобы получить картинку, идентичную той,
  // что видна на экране
  ctx.drawImage(
    video,
    sx, sy, sw, sh,            // источник (обрезанная часть)
    0, 0, canvas.width, canvas.height  // назначение
  );

  // 2. Отладочный оверлей — рисуем полностью (он уже нарисован
  // в CSS-координатах контейнера, поэтому совпадает с обрезанным видео)
  if (debugOverlayCanvas && debugOverlayCanvas.width > 0) {
    ctx.drawImage(
      debugOverlayCanvas,
      0, 0, debugOverlayCanvas.width, debugOverlayCanvas.height,
      0, 0, canvas.width, canvas.height
    );
  }

  // 3. Three.js canvas — рисуем полностью
  if (threeCanvas && threeCanvas.width > 0) {
    ctx.drawImage(
      threeCanvas,
      0, 0, threeCanvas.width, threeCanvas.height,
      0, 0, canvas.width, canvas.height
    );
  }

  return canvas.toDataURL('image/png');
}