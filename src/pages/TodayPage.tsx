import { lazy, Suspense, useMemo, useState } from 'react'
import { addDays, format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { Activity, Flame, Info, Loader2, Moon, Sparkles, TrendingDown, Wand2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { generateAiAdvice } from '@/utils/aiAdvice'
import { StatCard } from '@/components/StatCard'
import { ProgressRing } from '@/components/ProgressRing'
import { WaterTracker } from '@/components/WaterTracker'

// 图表组件懒加载：recharts 独立成 chunk，不阻塞首屏
const TrendChart = lazy(() => import('@/components/TrendChart'))
const WeightTracker = lazy(() =>
  import('@/components/WeightTracker').then((m) => ({ default: m.WeightTracker })),
)

const ChartFallback = () => (
  <Card>
    <div className="h-44 w-full animate-pulse rounded-lg bg-gray-100" />
  </Card>
)
import { useStore } from '@/store/useStore'
import { calcHealthScore, planDayProgress, summarizeDay, type DailySummary } from '@/utils/calc'
import { generateAdvice } from '@/utils/advice'

export function TodayPage() {
  const selectedDate = useStore((s) => s.selectedDate)
  const profile = useStore((s) => s.profile)
  const logs = useStore((s) => s.logs)
  const plan = useStore((s) => s.plan)
  const aiConfig = useStore((s) => s.aiConfig)

  // AI 建议
  const [aiText, setAiText] = useState('')
  const [aiError, setAiError] = useState('')
  const [aiLoading, setAiLoading] = useState(false)

  const log = logs[selectedDate] ?? { date: selectedDate, meals: [], exercises: [], sleep: null, waterMl: 0, weight: null }
  const summary = useMemo(() => summarizeDay(log, profile), [log, profile])

  // 近 7 天趋势
  const week = useMemo(() => {
    const arr: DailySummary[] = []
    const today = new Date(selectedDate + 'T00:00:00')
    for (let i = 6; i >= 0; i--) {
      const d = format(addDays(today, -i), 'yyyy-MM-dd')
      const l = logs[d] ?? { date: d, meals: [], exercises: [], sleep: null, waterMl: 0, weight: null }
      arr.push(summarizeDay(l, profile))
    }
    return arr
  }, [selectedDate, logs, profile])

  const advice = useMemo(() => generateAdvice(summary, profile, log, week), [summary, profile, log, week])

  const chartData = week.map((s, i) => ({
    label: format(addDays(new Date(selectedDate + 'T00:00:00'), -6 + i), 'M/d', { locale: zhCN }),
    intake: s.intakeKcal,
    exercise: s.exerciseKcal,
    sleep: s.sleepHours,
    quality: s.sleepQuality, // 1~5，无记录为 null
  }))

  const weekWeights = week.map((s, i) => ({
    label: format(addDays(new Date(selectedDate + 'T00:00:00'), -6 + i), 'M/d', { locale: zhCN }),
    weight: s.weight,
  }))

  // 今日训练计划完成情况（供 AI 建议参考）
  const planText = useMemo(() => {
    const wd = (new Date(selectedDate + 'T00:00:00').getDay() + 6) % 7
    const items = plan[wd] ?? []
    if (items.length === 0) return '今天没有安排训练'
    const doneMap: Record<string, number> = {}
    for (const e of logs[selectedDate]?.exercises ?? []) doneMap[e.type] = (doneMap[e.type] ?? 0) + e.durationMin
    // 与计划页同一套算法（顺序分配），否则同类型多段会把已完成分钟算重
    const prog = planDayProgress(
      items.map((i) => ({ id: i.id, type: i.type, durationMin: i.durationMin })),
      doneMap,
    )
    const planMin = items.reduce((s, i) => s + i.durationMin, 0)
    const doneMin = items.reduce((s, i) => s + (prog[i.id]?.doneMin ?? 0), 0)
    const doneCount = items.filter((i) => (prog[i.id]?.remainMin ?? i.durationMin) === 0).length
    return `计划 ${items.length} 项共 ${planMin} 分钟（${items.map((i) => i.type).join('、')}），已完成 ${doneCount} 项 / ${doneMin} 分钟`
  }, [plan, logs, selectedDate])

  const handleAiAdvice = async () => {
    setAiLoading(true)
    setAiError('')
    setAiText('')
    try {
      setAiText(await generateAiAdvice(aiConfig, { summary, profile, week, planText }))
    } catch (err) {
      setAiError((err as Error).message)
    } finally {
      setAiLoading(false)
    }
  }

  const health = calcHealthScore(summary)
  const calPct = summary.calorieTarget ? Math.round((summary.intakeKcal / summary.calorieTarget) * 100) : 0
  const sleepPct = summary.sleepTarget ? Math.round((summary.sleepHours / summary.sleepTarget) * 100) : 0
  const scoreColor =
    health.level === 'great' ? '#16a34a' : health.level === 'good' ? '#3b82f6' : health.level === 'fair' ? '#f59e0b' : '#ef4444'

  return (
    <div className="space-y-4">
      {/* 今日健康评分 */}
      <Card>
        <div className="flex items-center gap-4">
          <ProgressRing value={health.score} max={100} size={104} stroke={11} label="健康分" />
          <div className="flex-1">
            <div className="text-xs text-gray-400">今日综合评分</div>
            <div className="text-2xl font-bold" style={{ color: scoreColor }}>
              {health.label}
            </div>
            <div className="mt-1 text-[11px] text-gray-400">结合饮食贴合度 · 运动 · 睡眠 · 饮水</div>
          </div>
        </div>
      </Card>

      {/* 汇总卡片 */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={<Flame size={14} />} accent="orange" label="摄入热量" value={summary.intakeKcal} unit={`/ ${summary.calorieTarget} kcal`} />
        <StatCard icon={<Activity size={14} />} accent="blue" label="运动消耗" value={summary.exerciseKcal} unit="kcal" />
        <StatCard icon={<TrendingDown size={14} />} accent="green" label="净热量" value={summary.netKcal} unit="kcal" />
        <StatCard icon={<Moon size={14} />} accent="purple" label="睡眠时长" value={summary.sleepHours} unit={`/ ${summary.sleepTarget} h`} />
      </div>

      {/* 饮水 + 体重 */}
      <WaterTracker date={selectedDate} currentMl={summary.waterMl} targetMl={summary.waterTarget} />
      <Suspense fallback={<ChartFallback />}>
        <WeightTracker date={selectedDate} currentWeight={summary.weight} week={weekWeights} />
      </Suspense>

      {/* 目标完成度：进度环 */}
      <Card>
        <h3 className="mb-3 text-sm font-semibold text-gray-700">目标完成度</h3>
        <div className="flex items-center justify-around">
          <div className="flex flex-col items-center">
            <ProgressRing value={summary.intakeKcal} max={summary.calorieTarget} label="热量" unit=" kcal" />
            <span className="mt-1 text-xs text-gray-500">{calPct}%</span>
          </div>
          <div className="flex flex-col items-center">
            <ProgressRing value={summary.sleepHours} max={summary.sleepTarget} label="睡眠" unit=" h" />
            <span className="mt-1 text-xs text-gray-500">{sleepPct}%</span>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
          <div className="rounded-lg bg-gray-50 py-2">
            <div className="font-semibold text-gray-800">
              {summary.protein}/{summary.proteinTarget}g
            </div>
            <div className="text-gray-400">蛋白质</div>
          </div>
          <div className="rounded-lg bg-gray-50 py-2">
            <div className="font-semibold text-gray-800">
              {summary.carbs}/{summary.carbsTarget}g
            </div>
            <div className="text-gray-400">碳水</div>
          </div>
          <div className="rounded-lg bg-gray-50 py-2">
            <div className="font-semibold text-gray-800">
              {summary.fat}/{summary.fatTarget}g
            </div>
            <div className="text-gray-400">脂肪</div>
          </div>
        </div>
      </Card>

      {/* 近 7 天趋势 */}
      <Suspense fallback={<ChartFallback />}>
        <TrendChart data={chartData} />
      </Suspense>

      {/* 建议 */}
      <Card>
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Sparkles size={16} className="text-blue-500" />
            <h3 className="text-sm font-semibold text-gray-700">今日建议</h3>
          </div>
          <Button size="sm" variant="outline" onClick={handleAiAdvice} disabled={aiLoading}>
            {aiLoading ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
            {aiLoading ? '分析中…' : 'AI 分析'}
          </Button>
        </div>
        <ul className="space-y-2">
          {advice.map((a) => (
            <li key={a.id} className="flex items-start gap-2 text-sm text-gray-600">
              <Badge variant={a.level === 'good' ? 'good' : a.level === 'warn' ? 'warn' : 'info'} className="mt-0.5 shrink-0">
                {a.level === 'good' ? '良好' : a.level === 'warn' ? '注意' : '提示'}
              </Badge>
              <span>{a.text}</span>
            </li>
          ))}
        </ul>
        {aiError && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs leading-relaxed text-red-600">{aiError}</p>
        )}
        {aiText && (
          <div className="mt-3 rounded-lg bg-blue-50 p-3">
            <div className="mb-1 flex items-center gap-1 text-[11px] font-medium text-blue-600">
              <Wand2 size={12} /> AI 个性化建议（基于你近 7 天数据）
            </div>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">{aiText}</p>
          </div>
        )}

        <p className="mt-3 flex items-start gap-1 border-t border-gray-100 pt-2 text-[11px] leading-relaxed text-gray-400">
          <Info size={12} className="mt-0.5 shrink-0" />
          以上建议（含 BMI / 体脂估算、AI 生成内容）仅作生活方式参考，不构成医疗建议。如有健康问题请咨询专业医生。
        </p>
      </Card>
    </div>
  )
}
