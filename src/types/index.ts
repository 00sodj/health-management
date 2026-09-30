import { z } from 'zod'

/** 餐次 */
export const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const
export type MealType = (typeof MEAL_TYPES)[number]

export const MEAL_LABELS: Record<MealType, string> = {
  breakfast: '早餐',
  lunch: '午餐',
  dinner: '晚餐',
  snack: '加餐',
}

/** 性别 */
export const GENDERS = ['male', 'female'] as const
export type Gender = (typeof GENDERS)[number]

/** 活动水平（对应 TDEE 系数） */
export const ACTIVITY_LEVELS = ['sedentary', 'light', 'moderate', 'active', 'veryActive'] as const
export type ActivityLevel = (typeof ACTIVITY_LEVELS)[number]

export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: '久坐（几乎不运动）',
  light: '轻度活动（每周 1-3 次）',
  moderate: '中度活动（每周 3-5 次）',
  active: '高度活动（每周 6-7 次）',
  veryActive: '极高活动（体力劳动/运动员）',
}

/** TDEE 活动系数 */
export const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  veryActive: 1.9,
}

/** 健身目标 */
export const GOALS = ['lose', 'maintain', 'gain'] as const
export type Goal = (typeof GOALS)[number]

export const GOAL_LABELS: Record<Goal, string> = {
  lose: '减脂',
  maintain: '维持',
  gain: '增肌',
}

/** 运动强度（用于微调 MET） */
export const INTENSITIES = ['low', 'medium', 'high'] as const
export type Intensity = (typeof INTENSITIES)[number]

export const INTENSITY_LABELS: Record<Intensity, string> = {
  low: '低强度',
  medium: '中强度',
  high: '高强度',
}

/** 营养 Macro（每 100g） */
export const MacroSchema = z.object({
  kcal: z.number().min(0),
  protein: z.number().min(0),
  carbs: z.number().min(0),
  fat: z.number().min(0),
})
export type Macro = z.infer<typeof MacroSchema>

/** 食物单位（名称 + 对应克数，单位"g" 即 1 克=1 克） */
export const FoodUnitSchema = z.object({
  name: z.string(), // 例如 'g' / '个' / '碗' / '份'
  grams: z.number().min(0), // 该单位代表的克数（'g' => 1）
})
export type FoodUnit = z.infer<typeof FoodUnitSchema>

/** 食物库条目（可内置，也可由用户自定义/修改） */
export const FoodItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(),
  per100g: MacroSchema, // 每 100g 的营养素
  units: z.array(FoodUnitSchema),
  defaultUnit: z.string(),
  custom: z.boolean().optional(), // 是否为用户自定义（用于 UI 区分）
})
export type FoodItem = z.infer<typeof FoodItemSchema>

/** 饮食记录条目 */
export const MealEntrySchema = z.object({
  id: z.string(),
  mealType: z.enum(MEAL_TYPES),
  name: z.string(), // 食物名（手动输入时为用户自定义）
  quantity: z.number().min(0),
  unit: z.string(),
  grams: z.number().min(0), // quantity * 单位克数
  kcal: z.number().min(0),
  protein: z.number().min(0),
  carbs: z.number().min(0),
  fat: z.number().min(0),
  isManual: z.boolean().optional(), // 是否手动输入热量
})
export type MealEntry = z.infer<typeof MealEntrySchema>

/** 运动记录条目 */
export const ExerciseEntrySchema = z.object({
  id: z.string(),
  type: z.string(),
  met: z.number().min(0),
  durationMin: z.number().min(0),
  intensity: z.enum(INTENSITIES),
  kcal: z.number().min(0), // MET × 体重 × 时长(小时)，可被手动覆盖
  isManual: z.boolean().optional(),
  speedKmh: z.number().min(0).optional(), // 走/跑类：速度（km/h）
  inclinePct: z.number().optional(), // 走/跑类：坡度（%）
  steps: z.number().min(0).optional(), // 走路：步数
})
export type ExerciseEntry = z.infer<typeof ExerciseEntrySchema>

/** 睡眠记录 */
export const SleepEntrySchema = z.object({
  id: z.string(),
  bedtime: z.string(), // "HH:mm"
  wakeTime: z.string(), // "HH:mm"
  quality: z.number().min(1).max(5),
  napMin: z.number().min(0).optional(), // 午睡分钟
  durationHours: z.number().min(0), // 自动计算
})
export type SleepEntry = z.infer<typeof SleepEntrySchema>

/** 单日日志（按日期隔离） */
export const DailyLogSchema = z.object({
  date: z.string(), // YYYY-MM-DD
  meals: z.array(MealEntrySchema),
  exercises: z.array(ExerciseEntrySchema),
  sleep: SleepEntrySchema.nullable().optional(),
  weight: z.number().min(0).max(400).nullable().optional(), // 当天体重记录（kg）
  waterMl: z.number().min(0).optional(), // 当天饮水（ml）
})
export type DailyLog = z.infer<typeof DailyLogSchema>

/** 用户资料与目标 */
export const UserProfileSchema = z.object({
  gender: z.enum(GENDERS),
  age: z.number().min(1).max(120),
  height: z.number().min(50).max(250), // cm
  weight: z.number().min(20).max(300), // kg
  activity: z.enum(ACTIVITY_LEVELS),
  goal: z.enum(GOALS),
  calorieTarget: z.number().min(0), // 每日热量目标 kcal
  proteinTarget: z.number().min(0), // 每日蛋白质目标 g
  carbsTarget: z.number().min(0), // 每日碳水目标 g
  fatTarget: z.number().min(0), // 每日脂肪目标 g
  sleepTarget: z.number().min(0), // 每日睡眠目标 小时
})
export type UserProfile = z.infer<typeof UserProfileSchema>

/** 健康建议 */
export const AdviceSchema = z.object({
  id: z.string(),
  text: z.string(),
  level: z.enum(['good', 'info', 'warn']),
})
export type Advice = z.infer<typeof AdviceSchema>

/** 多模态视觉识别（拍照识别食物）配置 —— 兼容 OpenAI 接口的视觉模型 */
export interface AiConfig {
  enabled: boolean // 是否启用拍照识别
  baseUrl: string // API 基址，例如 https://api.openai.com/v1
  apiKey: string // 用户自有密钥，仅保存在本机
  model: string // 视觉模型名，例如 gpt-4o-mini / gpt-4-vision-preview
}

/** 训练计划中的单个动作（对应运动库里的运动名 + 计划时长） */
export const PlanItemSchema = z.object({
  id: z.string(),
  type: z.string(), // 运动类型（运动库中的名称）
  durationMin: z.number().min(0),
  note: z.string().optional(),
})
export type PlanItem = z.infer<typeof PlanItemSchema>

/** 视觉模型识别出的单个食物 */
export interface DetectedFood {
  name: string // 食物名称（中文）
  grams: number // 估算重量（克）
  kcal: number // 热量（kcal）
  protein: number // 蛋白质（g）
  carbs: number // 碳水（g）
  fat: number // 脂肪（g）
  confidence: 'high' | 'medium' | 'low' // 模型置信度
}
