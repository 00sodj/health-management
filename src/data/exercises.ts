import type { Intensity } from '@/types'

/**
 * 内置运动库：MET 值（代谢当量，静坐=1.0）。
 * 消耗公式：kcal = MET × 体重(kg) × 时长(小时) × 强度系数
 * 至少 15 种。
 */
export interface ExerciseDef {
  id: string
  name: string
  met: number
  category: string
  custom?: boolean // 是否为用户自定义（用于 UI 区分）
  pace?: boolean // 是否支持「速度 + 坡度」输入（走/快走/跑/爬山/爬楼等）
}

export const EXERCISES: ExerciseDef[] = [
  { id: 'walk', name: '走路', met: 3.5, category: '有氧', pace: true },
  { id: 'run', name: '跑步', met: 9.8, category: '有氧', pace: true },
  { id: 'briskwalk', name: '快走', met: 4.5, category: '有氧', pace: true },
  { id: 'cycle_indoor', name: '骑行(室内)', met: 7.0, category: '有氧' },
  { id: 'cycle_outdoor', name: '骑行(户外)', met: 8.0, category: '有氧' },
  { id: 'swim', name: '游泳', met: 6.0, category: '有氧' },
  { id: 'rope', name: '跳绳', met: 11.0, category: '有氧' },
  { id: 'stair', name: '爬楼梯', met: 8.0, category: '有氧', pace: true },
  { id: 'elliptical', name: '椭圆机', met: 5.0, category: '有氧' },
  { id: 'hiit', name: 'HIIT', met: 8.0, category: '有氧' },
  { id: 'strength', name: '力量训练', met: 5.0, category: '力量' },
  { id: 'yoga', name: '瑜伽', met: 2.5, category: '柔韧' },
  { id: 'dance', name: '跳舞', met: 5.0, category: '有氧' },
  { id: 'badminton', name: '羽毛球', met: 6.5, category: '球类' },
  { id: 'basketball', name: '篮球', met: 7.5, category: '球类' },
  { id: 'football', name: '足球', met: 8.0, category: '球类' },
  { id: 'tennis', name: '网球', met: 7.0, category: '球类' },
  { id: 'hike', name: '爬山', met: 6.0, category: '有氧', pace: true },
]

/** 采用「跑步」ACSM 方程的运动 id（其余 pace 运动用「走路」方程） */
export const RUN_PACE_IDS = new Set(['run'])

/** pace 运动的默认速度(km/h)与坡度(%) */
export const PACE_DEFAULTS: Record<string, { speedKmh: number; inclinePct: number }> = {
  walk: { speedKmh: 5, inclinePct: 0 },
  briskwalk: { speedKmh: 6.5, inclinePct: 0 },
  run: { speedKmh: 9, inclinePct: 0 },
  hike: { speedKmh: 4, inclinePct: 10 },
  stair: { speedKmh: 4, inclinePct: 20 },
}

/** 默认运动库（store 以此为种子，用户可增删改） */
export const DEFAULT_EXERCISES: ExerciseDef[] = EXERCISES

/** 强度系数：微调 MET，使估算更贴近实际用力程度 */
export const INTENSITY_FACTOR: Record<Intensity, number> = {
  low: 0.8,
  medium: 1.0,
  high: 1.2,
}

export function getExerciseById(id: string): ExerciseDef | undefined {
  return EXERCISES.find((e) => e.id === id)
}
