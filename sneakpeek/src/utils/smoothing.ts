import type { Landmark } from '../types/landmarks';

/**
 * Сглаживание одного числа по методу экспоненциального скользящего среднего (EMA).
 * Чем меньше alpha — тем сильнее сглаживание (но больше "инерция").
 */
class SmoothedValue {
  private value: number | null = null;
  private readonly alpha: number;

  constructor(alpha: number = 0.5) {
    this.alpha = alpha;
  }

  update(newValue: number): number {
    if (this.value === null) {
      this.value = newValue;
    } else {
      this.value = this.alpha * newValue + (1 - this.alpha) * this.value;
    }
    return this.value;
  }

  reset() {
    this.value = null;
  }
}

/**
 * Сглаживатель для всех 33 ключевых точек позы.
 * Хранит отдельные SmoothedValue для x, y, z каждой точки.
 */
export class PoseSmoother {
  private smoothers: Map<
    number,
    { x: SmoothedValue; y: SmoothedValue; z: SmoothedValue }
  > = new Map();

  private readonly alpha: number;

  constructor(alpha: number = 0.5) {
    this.alpha = alpha;
  }

  smooth(landmarks: Landmark[]): Landmark[] {
    return landmarks.map((landmark, index) => {
      if (!this.smoothers.has(index)) {
        this.smoothers.set(index, {
          x: new SmoothedValue(this.alpha),
          y: new SmoothedValue(this.alpha),
          z: new SmoothedValue(this.alpha),
        });
      }

      const smoother = this.smoothers.get(index)!;

      return {
        x: smoother.x.update(landmark.x),
        y: smoother.y.update(landmark.y),
        z: smoother.z.update(landmark.z),
        visibility: landmark.visibility,
      };
    });
  }

  reset() {
    this.smoothers.forEach((s) => {
      s.x.reset();
      s.y.reset();
      s.z.reset();
    });
  }
}