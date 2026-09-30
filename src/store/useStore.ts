import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  type AiConfig,
  type DailyLog,
  type ExerciseEntry,
  type FoodItem,
  type MealEntry,
  type PlanItem,
  type SleepEntry,
  type UserProfile,
} from '@/types'
import type { ExerciseDef } from '@/data/exercises'
import { DEFAULT_FOODS } from '@/data/foods'
import { DEFAULT_EXERCISES, EXERCISES } from '@/data/exercises'
import { calcMacroTargets, todayStr, uid } from '@/utils/calc'

/** 空日志模板 */
export function emptyLog(date: string): DailyLog {
  return { date, meals: [], exercises: [], sleep: null, waterMl: 0, weight: null }
}

/** 默认用户资料（首次进入时按公式算出目标） */
function defaultProfile(): UserProfile {
  const base: UserProfile = {
    gender: 'male',
    age: 30,
    height: 175,
    weight: 70,
    activity: 'light',
    goal: 'maintain',
    calorieTarget: 0,
    proteinTarget: 0,
    carbsTarget: 0,
    fatTarget: 0,
    sleepTarget: 8,
  }
  const t = calcMacroTargets(base)
  base.calorieTarget = t.calorie
  base.proteinTarget = t.protein
  base.carbsTarget = t.carbs
  base.fatTarget = t.fat
  return base
}

export interface ExportData {
  version: 1
  exportedAt: string
  profile: UserProfile
  logs: DailyLog[]
  foods: FoodItem[]
  exercises: ExerciseDef[]
  plan?: PlanItem[][]
}

/** 每周计划（索引 0=周一 … 6=周日）；默认给一份可编辑的示例 */
export function defaultPlan(): PlanItem[][] {
  const mk = (type: string, durationMin: number, note?: string): PlanItem => ({
    id: uid(),
    type,
    durationMin,
    note,
  })
  return [
    [mk('跑步', 30), mk('力量训练', 20, '核心')],
    [],
    [mk('力量训练', 45)],
    [],
    [mk('快走', 40)],
    [],
    [mk('瑜伽', 30, '拉伸放松')],
  ]
}

export type Theme = 'light' | 'dark'

/** 首次进入跟随系统主题 */
function initialTheme(): Theme {
  try {
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

/** 视觉识别默认配置 */
const DEFAULT_AI_CONFIG: AiConfig = {
  enabled: false,
  baseUrl: 'https://api.openai.com/v1',
  apiKey: '',
  model: 'gpt-4o-mini',
}

interface StoreState {
  profile: UserProfile
  logs: Record<string, DailyLog> // 按 YYYY-MM-DD 隔离
  foods: FoodItem[] // 食物库（可自定义/编辑）
  exercises: ExerciseDef[] // 运动库（可自定义/编辑）
  aiConfig: AiConfig // 拍照识别视觉模型配置（含密钥，仅存本机）
  theme: Theme // 主题：浅色 / 深色
  selectedDate: string

  // 日期
  setSelectedDate: (date: string) => void
  getLog: (date: string) => DailyLog

  // 主题
  setTheme: (t: Theme) => void

  // 拍照识别配置
  setAiConfig: (patch: Partial<AiConfig>) => void

  // 资料 / 目标
  setProfile: (patch: Partial<UserProfile>) => void
  recalcTargets: () => void

  // 饮食
  addMeal: (date: string, entry: MealEntry) => void
  updateMeal: (date: string, id: string, patch: Partial<MealEntry>) => void
  deleteMeal: (date: string, id: string) => void

  // 运动
  addExercise: (date: string, entry: ExerciseEntry) => void
  updateExercise: (date: string, id: string, patch: Partial<ExerciseEntry>) => void
  deleteExercise: (date: string, id: string) => void

  // 睡眠
  setSleep: (date: string, sleep: SleepEntry | null) => void

  // 体重 / 饮水
  setWeight: (date: string, weight: number | null) => void
  setWater: (date: string, ml: number) => void
  addWater: (date: string, deltaMl: number) => void

  // 食物库管理
  addFood: (food: FoodItem) => void
  updateFood: (id: string, patch: Partial<FoodItem>) => void
  deleteFood: (id: string) => void

  // 运动库管理
  addExerciseDef: (ex: ExerciseDef) => void
  updateExerciseDef: (id: string, patch: Partial<ExerciseDef>) => void
  deleteExerciseDef: (id: string) => void

  // 训练计划（索引 0=周一 … 6=周日）
  plan: PlanItem[][]
  addPlanItem: (weekday: number, item: PlanItem) => void
  updatePlanItem: (weekday: number, id: string, patch: Partial<PlanItem>) => void
  deletePlanItem: (weekday: number, id: string) => void
  clearPlanDay: (weekday: number) => void
  setPlan: (plan: PlanItem[][]) => void

  // 数据管理
  clearDay: (date: string) => void
  restoreDay: (date: string, log: DailyLog) => void
  importData: (data: ExportData) => void
  resetAll: () => void
}

/**
 * 更新某天的日志（不存在则先创建），返回新的 logs 对象（不可变更新）。
 */
function updateLog(
  logs: Record<string, DailyLog>,
  date: string,
  updater: (log: DailyLog) => DailyLog,
): Record<string, DailyLog> {
  const current = logs[date] ?? emptyLog(date)
  return { ...logs, [date]: updater(current) }
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      profile: defaultProfile(),
      logs: {},
      foods: DEFAULT_FOODS,
      exercises: DEFAULT_EXERCISES,
      plan: defaultPlan(),
      aiConfig: DEFAULT_AI_CONFIG,
      theme: initialTheme(),
      selectedDate: todayStr(),

      setSelectedDate: (date) => set({ selectedDate: date }),

      setTheme: (t) => set({ theme: t }),

      getLog: (date) => get().logs[date] ?? emptyLog(date),

      setAiConfig: (patch) => set((s) => ({ aiConfig: { ...s.aiConfig, ...patch } })),

      setProfile: (patch) =>
        set((state) => {
          const next = { ...state.profile, ...patch }
          // 当基础字段变化时，自动重算热量/蛋白质目标（用户未手动改过时）
          const baseChanged = ['gender', 'age', 'height', 'weight', 'activity', 'goal'].some(
            (k) => k in patch,
          )
          if (baseChanged) {
            const t = calcMacroTargets(next)
            next.calorieTarget = t.calorie
            next.proteinTarget = t.protein
            next.carbsTarget = t.carbs
            next.fatTarget = t.fat
          }
          return { profile: next }
        }),

      // 按当前身体数据重算四项营养目标（用户也可手动改）
      recalcTargets: () =>
        set((s) => {
          const t = calcMacroTargets(s.profile)
          return {
            profile: {
              ...s.profile,
              calorieTarget: t.calorie,
              proteinTarget: t.protein,
              carbsTarget: t.carbs,
              fatTarget: t.fat,
            },
          }
        }),

      addMeal: (date, entry) =>
        set((s) => ({
          logs: updateLog(s.logs, date, (log) => ({ ...log, meals: [...log.meals, entry] })),
        })),

      updateMeal: (date, id, patch) =>
        set((s) => ({
          logs: updateLog(s.logs, date, (log) => ({
            ...log,
            meals: log.meals.map((m) => (m.id === id ? { ...m, ...patch } : m)),
          })),
        })),

      deleteMeal: (date, id) =>
        set((s) => ({
          logs: updateLog(s.logs, date, (log) => ({
            ...log,
            meals: log.meals.filter((m) => m.id !== id),
          })),
        })),

      addExercise: (date, entry) =>
        set((s) => ({
          logs: updateLog(s.logs, date, (log) => ({
            ...log,
            exercises: [...log.exercises, entry],
          })),
        })),

      updateExercise: (date, id, patch) =>
        set((s) => ({
          logs: updateLog(s.logs, date, (log) => ({
            ...log,
            exercises: log.exercises.map((e) => (e.id === id ? { ...e, ...patch } : e)),
          })),
        })),

      deleteExercise: (date, id) =>
        set((s) => ({
          logs: updateLog(s.logs, date, (log) => ({
            ...log,
            exercises: log.exercises.filter((e) => e.id !== id),
          })),
        })),

      setSleep: (date, sleep) =>
        set((s) => ({
          logs: updateLog(s.logs, date, (log) => ({ ...log, sleep })),
        })),

      setWeight: (date, weight) =>
        set((s) => ({
          logs: updateLog(s.logs, date, (log) => ({ ...log, weight })),
        })),

      setWater: (date, ml) =>
        set((s) => ({
          logs: updateLog(s.logs, date, (log) => ({ ...log, waterMl: Math.max(0, Math.round(ml)) })),
        })),

      addWater: (date, deltaMl) =>
        set((s) => ({
          logs: updateLog(s.logs, date, (log) => ({
            ...log,
            waterMl: Math.max(0, (log.waterMl ?? 0) + deltaMl),
          })),
        })),

      addFood: (food) => set((s) => ({ foods: [...s.foods, food] })),
      updateFood: (id, patch) =>
        set((s) => ({ foods: s.foods.map((f) => (f.id === id ? { ...f, ...patch } : f)) })),
      deleteFood: (id) => set((s) => ({ foods: s.foods.filter((f) => f.id !== id) })),

      addExerciseDef: (ex) => set((s) => ({ exercises: [...s.exercises, ex] })),
      updateExerciseDef: (id, patch) =>
        set((s) => ({ exercises: s.exercises.map((e) => (e.id === id ? { ...e, ...patch } : e)) })),
      deleteExerciseDef: (id) => set((s) => ({ exercises: s.exercises.filter((e) => e.id !== id) })),

      addPlanItem: (weekday, item) =>
        set((s) => ({ plan: s.plan.map((d, i) => (i === weekday ? [...d, item] : d)) })),
      updatePlanItem: (weekday, id, patch) =>
        set((s) => ({
          plan: s.plan.map((d, i) => (i === weekday ? d.map((x) => (x.id === id ? { ...x, ...patch } : x)) : d)),
        })),
      deletePlanItem: (weekday, id) =>
        set((s) => ({ plan: s.plan.map((d, i) => (i === weekday ? d.filter((x) => x.id !== id) : d)) })),
      clearPlanDay: (weekday) => set((s) => ({ plan: s.plan.map((d, i) => (i === weekday ? [] : d)) })),
      setPlan: (plan) => set({ plan }),

      clearDay: (date) =>
        set((s) => {
          const { [date]: _removed, ...rest } = s.logs
          return { logs: rest }
        }),

      restoreDay: (date, log) => set((s) => ({ logs: { ...s.logs, [date]: log } })),

      importData: (data) =>
        set(() => {
          const logsMap: Record<string, DailyLog> = {}
          for (const l of data.logs) logsMap[l.date] = l
          // 老备份可能没有 碳水/脂肪 目标 → 按身体数据补算
          const p = data.profile as UserProfile & { carbsTarget?: number; fatTarget?: number }
          const t = calcMacroTargets({ ...p, carbsTarget: p.carbsTarget ?? 0, fatTarget: p.fatTarget ?? 0 })
          const profile: UserProfile = {
            ...p,
            calorieTarget: p.calorieTarget || t.calorie,
            proteinTarget: p.proteinTarget || t.protein,
            carbsTarget: typeof p.carbsTarget === 'number' ? p.carbsTarget : t.carbs,
            fatTarget: typeof p.fatTarget === 'number' ? p.fatTarget : t.fat,
          }
          return {
            profile,
            logs: logsMap,
            foods: data.foods?.length ? data.foods : DEFAULT_FOODS,
            exercises: data.exercises?.length ? data.exercises : DEFAULT_EXERCISES,
            plan: data.plan && data.plan.length === 7 ? data.plan : defaultPlan(),
          }
        }),

      resetAll: () =>
        set({
          profile: defaultProfile(),
          logs: {},
          foods: DEFAULT_FOODS,
          exercises: DEFAULT_EXERCISES,
          plan: defaultPlan(),
          selectedDate: todayStr(),
        }),
    }),
    {
      name: 'health-managem-store', // localStorage 键名（数据按日期隔离存储于 logs 内）
      version: 4,
      /**
       * 迁移：
       *  - v1 → v2：旧数据缺 foods/exercises，由默认值补上（persist 默认浅合并）。
       *  - v2 → v3：老的运动库是"加 pace 标记之前"保存的，按内置 id 补回 `pace`。
       *  - v3 → v4：老资料没有 carbsTarget/fatTarget，按身体数据补算，否则目标栏会显示空。
       */
      migrate: (persisted) => {
        const state = (persisted as {
          exercises?: ExerciseDef[]
          profile?: UserProfile
        } | undefined) ?? {}
        if (Array.isArray(state.exercises)) {
          state.exercises = state.exercises.map((e) => {
            const def = EXERCISES.find((d) => d.id === e.id)
            return def?.pace && !e.pace ? { ...e, pace: true } : e
          })
        }
        if (state.profile) {
          const p = state.profile
          if (typeof p.carbsTarget !== 'number' || typeof p.fatTarget !== 'number') {
            const t = calcMacroTargets({ ...p, carbsTarget: 0, fatTarget: 0 })
            p.carbsTarget = typeof p.carbsTarget === 'number' ? p.carbsTarget : t.carbs
            p.fatTarget = typeof p.fatTarget === 'number' ? p.fatTarget : t.fat
          }
        }
        return state as object
      },
    },
  ),
)
