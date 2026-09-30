// Одна ключевая точка тела
export interface Landmark {
  x: number; // нормализованная координата (0.0 – 1.0)
  y: number;
  z: number; // глубина в относительных единицах
  visibility: number; // уверенность модели (0.0 – 1.0)
}

// Все точки, которые возвращает MediaPipe Pose
export interface PoseLandmarks {
  landmarks: Landmark[];
  worldLandmarks: Landmark[];
}

// Индексы ключевых точек MediaPipe Pose (33 точки)
// Нам важны точки стопы:
export const POSE_LANDMARKS = {
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
  LEFT_HEEL: 29,
  RIGHT_HEEL: 30,
  LEFT_FOOT_INDEX: 31, // носок левой стопы
  RIGHT_FOOT_INDEX: 32, // носок правой стопы
} as const;