/**
 * Захватывает текущий кадр из видео и объединяет его
 * с содержимым отладочного оверлея (canvas с точками).
 *
 * @param video - HTMLVideoElement с видеопотоком
 * @param overlayCanvas - canvas с отладочным оверлеем (может быть null)
 * @returns data URL в формате image/png
 */
export function captureFrame(
  video: HTMLVideoElement,
  overlayCanvas: HTMLCanvasElement | null = null
): string {
  const canvas = document.createElement('canvas');

  // Используем реальные размеры видео — так снимок будет в полном разрешении
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Не удалось получить 2D-контекст canvas');
  }

  // 1. Рисуем видео как фон
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  // 2. Рисуем поверх оверлей с точками (если он есть)
  if (overlayCanvas) {
    // Оверлей может иметь другой размер (он растянут на весь экран),
    // поэтому масштабируем его под размер видео
    ctx.drawImage(overlayCanvas, 0, 0, canvas.width, canvas.height);
  }

  return canvas.toDataURL('image/png');
}