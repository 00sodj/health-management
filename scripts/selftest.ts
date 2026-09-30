/* 核心算法自检（用 esbuild 打包后由 node 运行） */
import {
  calcBMR,
  calcTDEE,
  calcTargetCalories,
  calcDefaultProtein,
  calcMacroTargets,
  planItemProgress,
  planDayProgress,
  calcBMI,
  bmiCategory,
  idealWeightRange,
  estimateBodyFat,
  calcWaterTarget,
  analyzeBody,
  calcHealthScore,
  calcMealNutrients,
  calcExerciseKcal,
  calcPaceMet,
  calcPaceExerciseKcal,
  strideLengthM,
  calcStepsWalk,
  calcSleepDuration,
  summarizeDay,
  macroEnergyRatio,
  uid,
  buildMealEntry,
  buildExerciseEntry,
} from '@/utils/calc'
import { generateAdvice } from '@/utils/advice'
import { DEFAULT_FOODS } from '@/data/foods'
import type { DailyLog, UserProfile } from '@/types'

let pass = 0
let fail = 0
const lines: string[] = []
function check(name: string, cond: boolean, extra = '') {
  if (cond) {
    pass++
    lines.push('  PASS ' + name)
  } else {
    fail++
    lines.push('  FAIL ' + name + (extra ? '  → ' + extra : ''))
  }
}
const approx = (a: number, b: number, tol = 1) => Math.abs(a - b) <= tol
const section = (t: string) => lines.push('\n# ' + t)

const baseProfile: UserProfile = {
  gender: 'male',
  age: 30,
  height: 175,
  weight: 70,
  activity: 'light',
  goal: 'maintain',
  calorieTarget: 2000,
  proteinTarget: 112,
  sleepTarget: 8,
}

section('基础代谢 / 目标')
check('BMR 男=1649', calcBMR(baseProfile) === 1649, String(calcBMR(baseProfile)))
const fp = { ...baseProfile, gender: 'female' as const }
check('BMR 女=1483', calcBMR(fp) === 1483, String(calcBMR(fp)))
const tdee = calcTDEE(baseProfile)
check('TDEE light≈2267', approx(tdee, 2267, 2), String(tdee))
check('目标-维持=TDEE', calcTargetCalories(baseProfile) === tdee)
check('目标-减脂=TDEE-400', calcTargetCalories({ ...baseProfile, goal: 'lose' }) === tdee - 400)
check('目标-增肌=TDEE+250', calcTargetCalories({ ...baseProfile, goal: 'gain' }) === tdee + 250)
check('蛋白质默认=112', calcDefaultProtein(baseProfile) === 112)
const mt = calcMacroTargets(baseProfile)
check('宏量目标 热量=TDEE', mt.calorie === tdee, String(mt.calorie))
check('宏量目标 蛋白质=112', mt.protein === 112)
check('宏量目标 脂肪=热量×25%/9', mt.fat === Math.round((tdee * 0.25) / 9), String(mt.fat))
check('宏量目标 碳水>0 且供能≈热量', mt.carbs > 0 && Math.abs(mt.protein * 4 + mt.carbs * 4 + mt.fat * 9 - tdee) < 12, JSON.stringify(mt))

section('训练计划完成判定（按分钟）')
const p90_30 = planItemProgress(90, 30)
check('计划90 只走30 → 未完成', !p90_30.done && p90_30.remainMin === 60, JSON.stringify(p90_30))
const p60_10 = planItemProgress(60, 10)
check('计划60 只走10 → 未完成', !p60_10.done && p60_10.remainMin === 50, JSON.stringify(p60_10))
const p90_90 = planItemProgress(90, 90)
check('计划90 走满90 → 完成', p90_90.done && p90_90.remainMin === 0, JSON.stringify(p90_90))
const p90_120 = planItemProgress(90, 120)
check('超额(120) → 完成且不计负剩余', p90_120.done && p90_120.remainMin === 0 && p90_120.doneMin === 90, JSON.stringify(p90_120))
check('累计 30+60=90 达到计划90 → 完成', planItemProgress(90, 30 + 60).done)

section('同类型多段（顺序分配）')
const twoSeg = [
  { id: 'a', type: '快走', durationMin: 30 },
  { id: 'b', type: '快走', durationMin: 30 },
]
const g30 = planDayProgress(twoSeg, { 快走: 30 })
check('两段各30，只走30 → 仅第1段完成', g30.a.done && !g30.b.done && g30.b.remainMin === 30, JSON.stringify(g30))
const g45 = planDayProgress(twoSeg, { 快走: 45 })
check('走45 → 第1段满、第2段剩15', g45.a.done && !g45.b.done && g45.b.remainMin === 15, JSON.stringify(g45))
const g60 = planDayProgress(twoSeg, { 快走: 60 })
check('走满60 → 两段都完成', g60.a.done && g60.b.done, JSON.stringify(g60))
const mixed = [
  { id: 'x', type: '快走', durationMin: 20 },
  { id: 'y', type: '跑步', durationMin: 30 },
  { id: 'z', type: '快走', durationMin: 20 },
]
const gm = planDayProgress(mixed, { 快走: 40, 跑步: 10 })
check('混合类型：快走两段都完成、跑步未完成', gm.x.done && gm.z.done && !gm.y.done && gm.y.remainMin === 20, JSON.stringify(gm))

section('身体分析')
check('BMI(70,175)=22.9', approx(calcBMI(70, 175), 22.9, 0.05), String(calcBMI(70, 175)))
check('BMI 分级 17→偏瘦', bmiCategory(17).label === '偏瘦')
check('BMI 分级 22→正常', bmiCategory(22).label === '正常')
check('BMI 分级 25→超重', bmiCategory(25).label === '超重')
check('BMI 分级 30→肥胖', bmiCategory(30).label === '肥胖')
check('BMI 边界 18.5→正常', bmiCategory(18.5).label === '正常')
check('BMI 边界 24→超重', bmiCategory(24).label === '超重')
const iw = idealWeightRange(175)
check('理想体重≈57~74', iw.min === 57 && iw.max === 74, JSON.stringify(iw))
check('体脂(男,22.9,30)≈18.2', approx(estimateBodyFat(22.9, 30, 'male')!, 18.2, 0.1))
check('饮水目标(70,light)=2100', calcWaterTarget(70, 'light') === 2100, String(calcWaterTarget(70, 'light')))
const a = analyzeBody(baseProfile)
check('analyzeBody 字段齐全', a.bmi > 0 && a.tdee > 0 && a.waterTargetMl > 0 && a.bodyFat !== null)

section('营养换算')
const f = DEFAULT_FOODS[0]
const n2 = calcMealNutrients(f, 2, 'g') // 2g
check('2g 营养=per100g*2%', approx(n2.kcal, Math.round(f.per100g.kcal * 0.02), 1), JSON.stringify(n2))
check('食物库非空且结构完整', DEFAULT_FOODS.length > 50 && DEFAULT_FOODS.every((x) => x.per100g && x.units.length > 0))

section('运动消耗')
check('MET 跑 9.8×70×0.5=343', calcExerciseKcal(9.8, 70, 30, 'medium') === 343)
check('强度系数 low<high', calcExerciseKcal(9.8, 70, 30, 'low') < calcExerciseKcal(9.8, 70, 30, 'high'))
check('走路 5km/h MET≈3.4', approx(calcPaceMet(5, 0, false), 3.4, 0.15), String(calcPaceMet(5, 0, false)))
check('跑步 10km/h MET≈10.5', approx(calcPaceMet(10, 0, true), 10.5, 0.3), String(calcPaceMet(10, 0, true)))
check('爬坡 MET 更高', calcPaceMet(5, 10, false) > calcPaceMet(5, 0, false))
check('步幅(175)≈0.726', approx(strideLengthM(175), 0.726, 0.01), String(strideLengthM(175)))
const sw = calcStepsWalk(8000, 175, 70)
check('8000步 距离≈5.81km', approx(sw.distanceKm, 5.81, 0.05), String(sw.distanceKm))
check('8000步 时长=80min', sw.durationMin === 80, String(sw.durationMin))
check('8000步 消耗≈287', approx(sw.kcal, 287, 6), String(sw.kcal))
check('步数0 消耗=0', calcStepsWalk(0, 175, 70).kcal === 0)

section('睡眠 / 汇总')
check('跨午夜 23:30→07:00 = 7.5h', calcSleepDuration('23:30', '07:00') === 7.5)
check('同日 13:00→14:30 = 1.5h', calcSleepDuration('13:00', '14:30') === 1.5)

const log: DailyLog = {
  date: '2026-09-30',
  meals: [
    buildMealEntry({ mealType: 'breakfast', name: '三明治', quantity: 1, unit: '份', grams: 200, kcal: 500, protein: 20, carbs: 50, fat: 20 }),
  ],
  exercises: [
    buildExerciseEntry({ type: '跑步', met: 9.8, durationMin: 30, intensity: 'medium', kcal: 300 }),
  ],
  sleep: { id: 's1', bedtime: '23:30', wakeTime: '07:00', quality: 4, durationHours: 7.5 },
  weight: 70,
  waterMl: 1000,
}
const sum = summarizeDay(log, baseProfile)
check('汇总 摄入=500', sum.intakeKcal === 500, String(sum.intakeKcal))
check('汇总 运动=300', sum.exerciseKcal === 300, String(sum.exerciseKcal))
check('汇总 净热量=摄入-运动-BMR', sum.netKcal === 500 - 300 - sum.analysis.bmr, String(sum.netKcal))
check('汇总 睡眠=7.5h', sum.sleepHours === 7.5, String(sum.sleepHours))
check('汇总 饮水=1000 & 目标>0', sum.waterMl === 1000 && sum.waterTarget > 0)
const mr = macroEnergyRatio(sum)
check('三大营养素比例合计≈100', approx(mr.protein + mr.carbs + mr.fat, 100, 2), JSON.stringify(mr))
const hs = calcHealthScore(sum)
check('健康分 0~100', hs.score >= 0 && hs.score <= 100, JSON.stringify(hs))

section('建议 / 工具')
const adv = generateAdvice(sum, baseProfile, log, [sum])
check('建议为非空数组', Array.isArray(adv) && adv.length > 0, String(adv.length))
check('建议字段合法', adv.every((x) => x.id && x.text && ['good', 'info', 'warn'].includes(x.level)))
check('uid 唯一', new Set(Array.from({ length: 200 }, () => uid())).size === 200)

console.log(lines.join('\n'))
console.log(`\n==== 结果：通过 ${pass} / 失败 ${fail} ====`)
if (fail > 0) process.exit(1)
