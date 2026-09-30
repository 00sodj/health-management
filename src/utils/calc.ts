import {
  ACTIVITY_FACTORS,
  type DailyLog,
  type ExerciseEntry,
  type FoodItem,
  type Intensity,
  type MealEntry,
  type SleepEntry,
  type UserProfile,
} from '@/types'
import { INTENSITY_FACTOR } from '@/data/exercises'

/* ===================== 基础代谢 & 目标热量 ===================== */

/**
 * 用 Mifflin-St Jeor 公式计算基础代谢率 BMR（kcal/天）。
 * 男：10×体重 + 6.25×身高 - 5×年龄 + 5
 * 女：10×体重 + 6.25×身高 - 5×年龄 - 161
 */
export function calcBMR(p: Pick<UserProfile, 'gender' | 'weight' | 'height' | 'age'>): number {
  const base = 10 * p.weight + 6.25 * p.height - 5 * p.age
  return Math.round(p.gender === 'male' ? base + 5 : base - 161)
}

/** 每日总消耗 TDEE = BMR × 活动系数 */
export function calcTDEE(p: UserProfile): number {
  return Math.round(calcBMR(p) * ACTIVITY_FACTORS[p.activity])
}

/**
 * 目标热量：
 * 减脂 lose  → TDEE - 400（落在 -300~-500 区间中段）
 * 维持 maintain → TDEE
 * 增肌 gain  → TDEE + 250（落在 +200~+300 区间中段）
 */
export function calcTargetCalories(p: UserProfile): number {
  const tdee = calcTDEE(p)
  switch (p.goal) {
    case 'lose':
      return tdee - 400
    case 'gain':
      return tdee + 250
    case 'maintain':
    default:
      return tdee
  }
}

/** 默认蛋白质目标：按 1.6 g/kg 体重估算 */
export function calcDefaultProtein(p: Pick<UserProfile, 'weight'>): number {
  return Math.round(p.weight * 1.6)
}

/**
 * 按身体数据推荐三大营养素目标：
 *  - 热量：TDEE × 目标系数（减脂/维持/增肌）
 *  - 蛋白质：1.6 g/kg
 *  - 脂肪：占总热量 25%
 *  - 碳水：剩余热量 ÷ 4（保证非负）
 */
export function calcMacroTargets(p: UserProfile): { calorie: number; protein: number; carbs: number; fat: number } {
  const calorie = calcTargetCalories(p)
  const protein = calcDefaultProtein(p)
  const fat = Math.round((calorie * 0.25) / 9)
  const carbs = Math.max(0, Math.round((calorie - protein * 4 - fat * 9) / 4))
  return { calorie, protein, carbs, fat }
}

/* ===================== 综合身体分析（结合性别/年龄/身高/体重） ===================== */

export type BmiLevel = 'low' | 'normal' | 'over' | 'obese'

export interface BodyAnalysis {
  bmi: number
  bmiLabel: string
  bmiLevel: BmiLevel
  idealMin: number // 理想体重区间下限 kg（BMI 18.5）
  idealMax: number // 理想体重区间上限 kg（BMI 24）
  bodyFat: number | null // 体脂率估算（Deurenberg），无年龄时为 null
  waterTargetMl: number // 每日饮水目标
  bmr: number
  tdee: number
}

/** BMI = 体重(kg) / 身高(m)^2 */
export function calcBMI(weightKg: number, heightCm: number): number {
  const m = heightCm / 100
  if (m <= 0) return 0
  return Math.round((weightKg / (m * m)) * 10) / 10
}

/** 中国成人 BMI 分级：偏瘦 <18.5 / 正常 18.5-23.9 / 超重 24-27.9 / 肥胖 ≥28 */
export function bmiCategory(bmi: number): { label: string; level: BmiLevel } {
  if (bmi < 18.5) return { label: '偏瘦', level: 'low' }
  if (bmi < 24) return { label: '正常', level: 'normal' }
  if (bmi < 28) return { label: '超重', level: 'over' }
  return { label: '肥胖', level: 'obese' }
}

/** BMI 18.5~24 对应的理想体重区间（kg） */
export function idealWeightRange(heightCm: number): { min: number; max: number } {
  const m2 = (heightCm / 100) ** 2
  return { min: Math.round(18.5 * m2), max: Math.round(24 * m2) }
}

/**
 * 体脂率估算（Deurenberg 公式），综合 性别/年龄/BMI：
 * BF% = 1.20×BMI + 0.23×年龄 - 10.8×性别 - 5.4  （男=1，女=0）
 */
export function estimateBodyFat(bmi: number, age: number, gender: 'male' | 'female'): number | null {
  if (!bmi || !age) return null
  const sex = gender === 'male' ? 1 : 0
  const bf = 1.2 * bmi + 0.23 * age - 10.8 * sex - 5.4
  return Math.round(Math.min(60, Math.max(3, bf)) * 10) / 10
}

/** 每日饮水目标：久坐 30ml/kg，活跃 35ml/kg */
export function calcWaterTarget(weightKg: number, activity: UserProfile['activity']): number {
  const perKg = activity === 'active' || activity === 'veryActive' ? 35 : 30
  return Math.round((weightKg * perKg) / 50) * 50 // 取整到 50ml
}

/** 汇总身体分析（BMI、体脂、理想体重、BMR、TDEE、饮水目标） */
export function analyzeBody(p: UserProfile): BodyAnalysis {
  const bmi = calcBMI(p.weight, p.height)
  const { label, level } = bmiCategory(bmi)
  const { min, max } = idealWeightRange(p.height)
  return {
    bmi,
    bmiLabel: label,
    bmiLevel: level,
    idealMin: min,
    idealMax: max,
    bodyFat: estimateBodyFat(bmi, p.age, p.gender),
    waterTargetMl: calcWaterTarget(p.weight, p.activity),
    bmr: calcBMR(p),
    tdee: calcTDEE(p),
  }
}

/* ===================== 健康综合评分 ===================== */

export interface HealthScore {
  score: number // 0-100
  label: string
  level: 'great' | 'good' | 'fair' | 'poor'
}

/**
 * 健康评分：综合 饮食贴合度 / 运动 / 睡眠 / 饮水 四项，权重 35/25/25/15。
 * 参考主流健康管理平台的评分思路，作为生活方式参考。
 */
export function calcHealthScore(s: DailySummary): HealthScore {
  // 饮食贴合度：摄入越接近目标分越高
  const diet = s.calorieTarget
    ? Math.max(0, 100 - Math.round((Math.abs(s.intakeKcal - s.calorieTarget) / s.calorieTarget) * 130))
    : s.intakeKcal > 0
      ? 60
      : 50
  // 运动：以 ~300kcal 为满分基准
  const exercise = Math.min(100, Math.round((s.exerciseKcal / 3)))
  // 睡眠：以 7.5h 为最佳
  const sleep = s.sleepHours
    ? Math.max(0, 100 - Math.round(Math.abs(s.sleepHours - 7.5) * 22))
    : 50
  // 饮水：目标为 100%
  const water = s.waterTarget ? Math.min(100, Math.round((s.waterMl / s.waterTarget) * 100)) : 50

  const score = Math.round(diet * 0.35 + exercise * 0.25 + sleep * 0.25 + water * 0.15)

  let label = '待改善'
  let level: HealthScore['level'] = 'poor'
  if (score >= 80) {
    label = '优秀'
    level = 'great'
  } else if (score >= 60) {
    label = '良好'
    level = 'good'
  } else if (score >= 40) {
    label = '一般'
    level = 'fair'
  }
  return { score, label, level }
}

/* ===================== 饮食换算 ===================== */

/**
 * 根据所选食物、数量与单位，换算克数及三大营养素。
 * grams = quantity × unit.grams（'g' 单位 grams=1，故可直接套用）。
 * 各营养素 = per100g × (grams / 100)。
 */
export function calcMealNutrients(
  food: FoodItem,
  quantity: number,
  unitName: string,
): Omit<MealEntry, 'id' | 'mealType' | 'name' | 'isManual'> {
  const unit = food.units.find((u) => u.name === unitName) ?? food.units[0]
  const grams = quantity * unit.grams
  const ratio = grams / 100
  return {
    quantity,
    unit: unit.name,
    grams: Math.round(grams),
    kcal: Math.round(food.per100g.kcal * ratio),
    protein: Math.round(food.per100g.protein * ratio * 10) / 10,
    carbs: Math.round(food.per100g.carbs * ratio * 10) / 10,
    fat: Math.round(food.per100g.fat * ratio * 10) / 10,
  }
}

/* ===================== 运动消耗（MET） ===================== */

/**
 * 运动消耗：kcal = MET × 体重(kg) × 时长(小时) × 强度系数。
 * 强度系数：低 0.8 / 中 1.0 / 高 1.2。
 */
export function calcExerciseKcal(met: number, weightKg: number, durationMin: number, intensity: Intensity): number {
  const hours = durationMin / 60
  return Math.round(met * weightKg * hours * INTENSITY_FACTOR[intensity])
}

/**
 * 走/跑/爬坡类运动：按 ACSM 方程由「速度 + 坡度」推算 MET。
 *   走路：VO2 = 0.1·v + 1.8·v·grade + 3.5
 *   跑步：VO2 = 0.2·v + 0.9·v·grade + 3.5   （v 单位 m/min，grade 为小数）
 *   MET = VO2 / 3.5
 * @param speedKmh  速度 km/h
 * @param inclinePct 坡度 %
 * @param isRun     是否用跑步方程
 */
export function calcPaceMet(speedKmh: number, inclinePct: number, isRun: boolean): number {
  const v = (Math.max(0, speedKmh) * 1000) / 60 // m/min
  const grade = Math.max(-20, inclinePct) / 100
  const vo2 = isRun ? 0.2 * v + 0.9 * v * grade + 3.5 : 0.1 * v + 1.8 * v * grade + 3.5
  return Math.round((vo2 / 3.5) * 10) / 10
}

/** 走/跑/爬坡类消耗：MET(=按速度坡度推算) × 体重 × 时长(小时) */
export function calcPaceExerciseKcal(
  speedKmh: number,
  inclinePct: number,
  isRun: boolean,
  weightKg: number,
  durationMin: number,
): number {
  const met = calcPaceMet(speedKmh, inclinePct, isRun)
  return Math.round(met * weightKg * (durationMin / 60))
}

/** 步幅估算（走路）：约身高的 0.415，单位米 */
export function strideLengthM(heightCm: number): number {
  return Math.max(0.3, (heightCm * 0.415) / 100)
}

export interface StepsWalkResult {
  distanceKm: number
  durationMin: number
  speedKmh: number
  met: number
  kcal: number
}

/**
 * 走路按「日常步数」估算消耗：
 *   步幅 ≈ 身高 × 0.415；距离 = 步数 × 步幅
 *   未填时长时按步频 ≈100 步/分估算时长；速度 = 距离 ÷ 时长
 *   MET 用走路 ACSM 方程（含坡度）推算，kcal = MET × 体重 × 时长(小时)
 */
export function calcStepsWalk(
  steps: number,
  heightCm: number,
  weightKg: number,
  inclinePct = 0,
  durationMin?: number,
): StepsWalkResult {
  const stride = strideLengthM(heightCm)
  const distanceKm = (Math.max(0, steps) * stride) / 1000
  const dur = durationMin && durationMin > 0 ? durationMin : Math.max(1, steps) / 100
  const speedKmh = dur > 0 ? distanceKm / (dur / 60) : 0
  const met = calcPaceMet(speedKmh, inclinePct, false)
  const kcal = Math.round(met * weightKg * (dur / 60))
  return {
    distanceKm: Math.round(distanceKm * 100) / 100,
    durationMin: Math.round(dur),
    speedKmh: Math.round(speedKmh * 10) / 10,
    met,
    kcal,
  }
}

/* ===================== 睡眠时长 ===================== */

/**
 * 计算睡眠时长（小时），自动处理跨午夜（如 23:30 → 07:00 = 7.5h）。
 * @param bedtime  "HH:mm" 入睡
 * @param wakeTime "HH:mm" 起床
 */
export function calcSleepDuration(bedtime: string, wakeTime: string): number {
  const [bh, bm] = bedtime.split(':').map(Number)
  const [wh, wm] = wakeTime.split(':').map(Number)
  let minutes = wh * 60 + wm - (bh * 60 + bm)
  if (minutes <= 0) minutes += 24 * 60 // 跨天
  return Math.round((minutes / 60) * 10) / 10
}

/* ===================== 单日汇总 ===================== */

export interface DailySummary {
  intakeKcal: number
  protein: number
  carbs: number
  fat: number
  exerciseKcal: number
  netKcal: number // 净热量 = 摄入 - 运动消耗 - 基础代谢(BMR)
  sleepHours: number
  sleepQuality: number | null
  calorieTarget: number
  proteinTarget: number
  carbsTarget: number
  fatTarget: number
  sleepTarget: number
  waterMl: number
  waterTarget: number
  weight: number | null
  analysis: BodyAnalysis
}

/** 汇总某一天的累计摄入、消耗、营养与睡眠。 */
export function summarizeDay(log: DailyLog, profile: UserProfile): DailySummary {
  const intake = log.meals.reduce(
    (acc, m) => {
      acc.kcal += m.kcal
      acc.protein += m.protein
      acc.carbs += m.carbs
      acc.fat += m.fat
      return acc
    },
    { kcal: 0, protein: 0, carbs: 0, fat: 0 },
  )

  const exerciseKcal = log.exercises.reduce((s, e) => s + e.kcal, 0)
  const sleep = log.sleep
  const sleepHours = sleep ? sleep.durationHours + (sleep.napMin ?? 0) / 60 : 0
  const analysis = analyzeBody(profile)

  return {
    intakeKcal: Math.round(intake.kcal),
    protein: Math.round(intake.protein * 10) / 10,
    carbs: Math.round(intake.carbs * 10) / 10,
    fat: Math.round(intake.fat * 10) / 10,
    exerciseKcal: Math.round(exerciseKcal),
    netKcal: Math.round(intake.kcal - exerciseKcal - analysis.bmr),
    sleepHours: Math.round(sleepHours * 10) / 10,
    sleepQuality: sleep ? sleep.quality : null,
    calorieTarget: profile.calorieTarget,
    proteinTarget: profile.proteinTarget,
    carbsTarget: profile.carbsTarget,
    fatTarget: profile.fatTarget,
    sleepTarget: profile.sleepTarget,
    waterMl: log.waterMl ?? 0,
    waterTarget: analysis.waterTargetMl,
    weight: log.weight ?? null,
    analysis,
  }
}

/* ===================== 工具 ===================== */

/** 各营养素供能占比（用于碳水/脂肪平衡判断） */
export function macroEnergyRatio(s: DailySummary) {
  const pK = s.protein * 4
  const cK = s.carbs * 4
  const fK = s.fat * 9
  const total = pK + cK + fK || 1
  return {
    protein: Math.round((pK / total) * 100),
    carbs: Math.round((cK / total) * 100),
    fat: Math.round((fK / total) * 100),
  }
}

/**
 * 单个训练计划项的完成情况。
 * **必须按"已记录分钟数 ≥ 计划分钟数"判定**，不能只匹配运动名称
 * （否则计划 90 分钟、只走了 30 分钟也会被判完成）。
 */
export function planItemProgress(
  plannedMin: number,
  loggedMin: number,
): { done: boolean; doneMin: number; remainMin: number } {
  const done = loggedMin >= plannedMin
  const doneMin = Math.max(0, Math.min(plannedMin, loggedMin))
  const remainMin = Math.max(0, plannedMin - Math.max(0, loggedMin))
  return { done, doneMin: Math.round(doneMin), remainMin: Math.round(remainMin) }
}

/**
 * 一整天的计划完成情况（按 id 索引）。
 *
 * 关键点：同一天若有**多段相同运动**（如两段「快走 30 分钟」），
 * 必须把已记录时长**按顺序分配**给各段，不能让每段都拿"总时长"去比
 * （否则只走 30 分钟会把两段同时判成完成）。
 *
 * @param items           计划项（保持数组顺序 = 打卡消耗顺序）
 * @param loggedMinByType 当天已记录时长，按运动名累计
 */
export function planDayProgress(
  items: { id: string; type: string; durationMin: number }[],
  loggedMinByType: Record<string, number>,
): Record<string, { done: boolean; doneMin: number; remainMin: number }> {
  const pools: Record<string, number> = {}
  for (const k of Object.keys(loggedMinByType)) pools[k] = Math.max(0, loggedMinByType[k] ?? 0)

  const out: Record<string, { done: boolean; doneMin: number; remainMin: number }> = {}
  for (const it of items) {
    const pool = pools[it.type] ?? 0
    const used = Math.max(0, Math.min(it.durationMin, pool)) // 这段能分到的已完成分钟
    pools[it.type] = pool - used
    out[it.id] = planItemProgress(it.durationMin, used)
  }
  return out
}

/**
 * 本地「今天」的 YYYY-MM-DD。
 * ⚠️ 不要用 `new Date().toISOString().slice(0,10)`：那是 UTC，在东八区 00:00~08:00 会算成昨天。
 */
export function todayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** 生成简单唯一 id（浏览器环境可用 crypto.randomUUID） */
export function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

/** 构建一条饮食记录 */
export function buildMealEntry(params: {
  mealType: MealEntry['mealType']
  name: string
  quantity: number
  unit: string
  grams: number
  kcal: number
  protein: number
  carbs: number
  fat: number
  isManual?: boolean
}): MealEntry {
  return { id: uid(), ...params }
}

/** 构建一条运动记录 */
export function buildExerciseEntry(params: {
  type: string
  met: number
  durationMin: number
  intensity: Intensity
  kcal: number
  isManual?: boolean
  speedKmh?: number
  inclinePct?: number
  steps?: number
}): ExerciseEntry {
  return { id: uid(), ...params }
}

/** 构建一条睡眠记录 */
export function buildSleepEntry(params: {
  bedtime: string
  wakeTime: string
  quality: number
  napMin?: number
  durationHours: number
}): SleepEntry {
  return { id: uid(), ...params }
}
