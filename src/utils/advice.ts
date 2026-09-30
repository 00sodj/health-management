import { type Advice, type DailyLog, type UserProfile } from '@/types'
import { macroEnergyRatio, summarizeDay, type DailySummary } from '@/utils/calc'
import { uid } from '@/utils/calc'

/**
 * 建议引擎：根据当天数据 + 近 7 天趋势，生成 3-6 条温和、可执行的建议。
 * 规则覆盖：热量目标、缺口/盈余、蛋白质、碳水/脂肪比例、运动量、睡眠、连续趋势。
 */
export function generateAdvice(
  today: DailySummary,
  profile: UserProfile,
  todayLog: DailyLog,
  weekSummaries: DailySummary[],
): Advice[] {
  const advice: Advice[] = []
  const push = (text: string, level: Advice['level']) => advice.push({ id: uid(), text, level })

  // 1) 摄入热量 vs 目标
  const diff = today.intakeKcal - today.calorieTarget
  const diffPct = today.calorieTarget ? diff / today.calorieTarget : 0
  if (today.intakeKcal === 0) {
    push('今天还没有饮食记录，记得按时吃饭，先记一餐热热身吧。', 'info')
  } else if (Math.abs(diffPct) <= 0.1) {
    push(`今日摄入约 ${today.intakeKcal} kcal，刚好贴近目标 ${today.calorieTarget} kcal，节奏很稳。`, 'good')
  } else if (diff > 0) {
    push(`今日摄入 ${today.intakeKcal} kcal，比目标高出约 ${diff} kcal，晚餐可适当减少主食或油脂。`, 'warn')
  } else {
    push(`今日摄入 ${today.intakeKcal} kcal，比目标低约 ${-diff} kcal，注意别吃得太少，避免代谢下降。`, 'warn')
  }

  // 2) 热量缺口 / 盈余是否过大
  // 注意：摘要里的 netKcal 已改为「摄入-运动-BMR」，此处仍按「摄入-运动」相对目标的口径判断
  const netVsTarget = today.intakeKcal - today.exerciseKcal - today.calorieTarget
  if (today.intakeKcal > 0 && netVsTarget < -500) {
    push(`今日净热量缺口偏大（约 ${-netVsTarget} kcal），长期可能造成乏力，建议加餐或降低运动强度。`, 'warn')
  } else if (netVsTarget > 500 && profile.goal !== 'gain') {
    push(`今日净热量盈余约 ${netVsTarget} kcal，若目标是减脂需适当减少摄入或增加运动。`, 'warn')
  }

  // 3) 蛋白质是否不足
  if (today.protein < today.proteinTarget * 0.8 && today.intakeKcal > 0) {
    push(
      `今天蛋白质约 ${today.protein}g，偏低（目标 ${today.proteinTarget}g），晚餐可加一份鸡胸肉、豆腐或一杯牛奶。`,
      'warn',
    )
  } else if (today.intakeKcal > 0) {
    push(`蛋白质约 ${today.protein}g，达标不错，有助于维持肌肉与饱腹感。`, 'good')
  }

  // 3.5) 综合身体分析：BMI / 体脂（结合性别、年龄、身高、体重）
  const a = today.analysis
  if (a.bmiLevel === 'obese' && profile.goal !== 'gain') {
    push(`当前 BMI ${a.bmi}（${a.bmiLabel}），建议控制总热量并增加有氧运动；理想体重约 ${a.idealMin}-${a.idealMax}kg。`, 'warn')
  } else if (a.bmiLevel === 'over' && profile.goal === 'lose') {
    push(`当前 BMI ${a.bmi}（超重），减脂期注意热量缺口别过大，配合力量训练保留肌肉。`, 'info')
  } else if (a.bmiLevel === 'low' && profile.goal !== 'lose') {
    push(`当前 BMI ${a.bmi}（偏瘦），可适当增加优质碳水与蛋白摄入，配合力量训练增肌。`, 'info')
  }
  if (a.bodyFat !== null) {
    const high = profile.gender === 'male' ? 25 : 32
    const low = profile.gender === 'male' ? 10 : 18
    if (a.bodyFat > high) push(`估算体脂率约 ${a.bodyFat}%，偏高，建议减少精制糖油、增加运动频率。`, 'warn')
    else if (a.bodyFat < low) push(`估算体脂率约 ${a.bodyFat}%，偏低，注意保证热量与营养均衡。`, 'info')
  }

  // 3.6) 饮水
  if (today.waterMl === 0) {
    push(`今天还没记录饮水，成年人每天约需 ${a.waterTargetMl}ml（约 ${(a.waterTargetMl / 250).toFixed(1)} 杯），少量多次更健康。`, 'info')
  } else if (today.waterMl < a.waterTargetMl * 0.6) {
    push(`今天饮水约 ${today.waterMl}ml，偏少（目标 ${a.waterTargetMl}ml），记得多喝点水。`, 'warn')
  } else if (today.waterMl >= a.waterTargetMl) {
    push(`饮水已达标（${today.waterMl}ml），水分充足有助于代谢。`, 'good')
  }

  // 4) 碳水 / 脂肪比例是否失衡
  const ratio = macroEnergyRatio(today)
  if (today.intakeKcal > 0 && ratio.fat > 40) {
    push(`脂肪供能占比约 ${ratio.fat}%，偏高，可少油烹饪、用蒸煮代替煎炸。`, 'warn')
  } else if (today.intakeKcal > 0 && ratio.carbs < 40) {
    push(`碳水供能占比约 ${ratio.carbs}%，偏低，可适量补充全谷物或薯类提供持久能量。`, 'info')
  }

  // 5) 运动量
  if (today.exerciseKcal === 0) {
    push('今天还没有运动记录，抽 20 分钟快走或拉伸，对身体和情绪都有帮助。', 'info')
  } else if (today.exerciseKcal > 900) {
    push(`今日运动消耗约 ${today.exerciseKcal} kcal，强度较高，注意补充水分与休息，避免过度训练。`, 'warn')
  } else if (today.exerciseKcal < 150 && profile.goal !== 'maintain') {
    push(`今日运动消耗仅 ${today.exerciseKcal} kcal，略少，目标达成建议每天至少 150 kcal 的活动量。`, 'info')
  } else {
    push(`今日运动消耗约 ${today.exerciseKcal} kcal，保持得不错，继续坚持。`, 'good')
  }

  // 6) 睡眠
  if (!todayLog.sleep) {
    push('还没有睡眠记录，睡前少看屏幕、固定作息有助于更好恢复。', 'info')
  } else {
    if (today.sleepHours < 7) {
      push(`睡眠时长约 ${today.sleepHours} 小时，略不足（目标 ${today.sleepTarget}h），今晚争取提前 30 分钟休息。`, 'warn')
    } else if (today.sleepHours > today.sleepTarget + 1.5) {
      push(`睡眠约 ${today.sleepHours} 小时，偏长，长时间卧床也可能影响精力，保持规律即可。`, 'info')
    } else {
      push(`睡眠约 ${today.sleepHours} 小时，达标，恢复状态良好。`, 'good')
    }
    if (today.sleepQuality !== null && today.sleepQuality <= 2) {
      push(`睡眠质量评分 ${today.sleepQuality}/5 偏低，可尝试睡前放松、减少咖啡因与夜宵。`, 'warn')
    }
  }

  // 7) 连续多天趋势异常提醒
  const recent = weekSummaries.slice(-4) // 含今天近 4 天
  const overTargetDays = recent.filter((s) => s.calorieTarget && s.intakeKcal > s.calorieTarget * 1.1).length
  if (overTargetDays >= 3) {
    push('近几天摄入连续高于目标，注意控制总热量，有助于维持当前体重目标。', 'warn')
  }
  const lowSleepDays = recent.filter((s) => s.sleepHours > 0 && s.sleepHours < 7).length
  if (lowSleepDays >= 3) {
    push('近几天睡眠持续偏短，长期会影响代谢与食欲，建议优先调整作息。', 'warn')
  }

  // 7.5) 体重趋势（结合目标方向）
  const weights = weekSummaries.map((s) => s.weight).filter((w): w is number => typeof w === 'number')
  if (weights.length >= 3) {
    const delta = weights[weights.length - 1] - weights[0]
    if (profile.goal === 'lose' && delta > 0.6) {
      push(`近 ${weights.length} 天体重上升约 ${delta.toFixed(1)}kg，减脂期注意控制饮食或加强运动。`, 'warn')
    } else if (profile.goal === 'gain' && delta < -0.6) {
      push(`近 ${weights.length} 天体重下降约 ${Math.abs(delta).toFixed(1)}kg，增肌期可适当增加热量摄入。`, 'warn')
    } else if (Math.abs(delta) <= 0.3) {
      push('近期体重平稳，节奏不错，继续保持。', 'good')
    }
  }

  // 限制 3-6 条，优先保留 warn > info > good
  const order: Record<Advice['level'], number> = { warn: 0, info: 1, good: 2 }
  advice.sort((a, b) => order[a.level] - order[b.level])
  return advice.slice(0, 6)
}
