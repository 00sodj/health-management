import { useMemo, useState } from 'react'
import { Check, ClipboardList, Pencil, Plus, Target, Trash2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Dialog } from '@/components/ui/dialog'
import { useStore } from '@/store/useStore'
import { useToast } from '@/store/useToast'
import { buildExerciseEntry, calcExerciseKcal, planDayProgress, uid } from '@/utils/calc'
import type { PlanItem } from '@/types'

const WEEKDAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
/** 日期 → 计划索引：0=周一 … 6=周日 */
function weekdayOf(dateStr: string): number {
  return (new Date(dateStr + 'T00:00:00').getDay() + 6) % 7
}
/** 本地今天（YYYY-MM-DD） */
function localToday(): string {
  return ymd(new Date())
}
/**
 * 所选日期所在那一周里，某个 weekday(0=周一…6=周日) 对应的**具体日期**。
 * 打卡必须按"具体日期"对照，否则同一个运动名会在所有星期行上都算完成。
 */
function dateOfWeekday(dateStr: string, weekday: number): string {
  const d = new Date(dateStr + 'T00:00:00')
  const offset = (d.getDay() + 6) % 7 // 该日期距本周一的天数
  d.setDate(d.getDate() - offset + weekday)
  return ymd(d)
}
/** 简短日期标签，如 10/1 */
function mdOf(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return `${d.getMonth() + 1}/${d.getDate()}`
}

export function PlanPage() {
  const plan = useStore((s) => s.plan)
  const exercises = useStore((s) => s.exercises)
  const profile = useStore((s) => s.profile)
  const selectedDate = useStore((s) => s.selectedDate)
  const logs = useStore((s) => s.logs)
  const addExercise = useStore((s) => s.addExercise)
  const addPlanItem = useStore((s) => s.addPlanItem)
  const updatePlanItem = useStore((s) => s.updatePlanItem)
  const deletePlanItem = useStore((s) => s.deletePlanItem)
  const clearPlanDay = useStore((s) => s.clearPlanDay)
  const showToast = useToast((s) => s.show)

  const [dialogDay, setDialogDay] = useState<number | null>(null)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<{ typeId: string; minutes: string; note: string }>({
    typeId: '',
    minutes: '30',
    note: '',
  })

  const selWeekday = weekdayOf(selectedDate)
  const todayYmd = localToday()
  const isToday = selectedDate === todayYmd

  const totalWeekMin = useMemo(() => plan.reduce((sum, d) => sum + d.reduce((s, i) => s + i.durationMin, 0), 0), [plan])

  // 已记录时长（按运动名**累计分钟**）
  const loggedMin = useMemo(() => {
    const m: Record<string, number> = {}
    for (const e of logs[selectedDate]?.exercises ?? []) m[e.type] = (m[e.type] ?? 0) + e.durationMin
    return m
  }, [logs, selectedDate])

  // 打卡进度：计划项 vs 已记录时长（**必须达到计划分钟数才算完成**，不能只匹配名称）
  const dayPlan = plan[selWeekday] ?? []
  // 按顺序分配已记录时长（同类型多段不会互相"顶账"）
  const dayProgress = useMemo(
    () =>
      planDayProgress(
        dayPlan.map((i) => ({ id: i.id, type: i.type, durationMin: i.durationMin })),
        loggedMin,
      ),
    [dayPlan, loggedMin],
  )
  const remainOf = (it: PlanItem) => dayProgress[it.id]?.remainMin ?? it.durationMin
  const doneCount = dayPlan.filter((it) => remainOf(it) === 0).length
  const pendingItems = dayPlan.filter((it) => remainOf(it) > 0)
  const planMin = dayPlan.reduce((s, i) => s + i.durationMin, 0)
  const pendingMin = pendingItems.reduce((s, i) => s + remainOf(i), 0)
  const doneMin = planMin - pendingMin
  const pct = planMin ? Math.round((doneMin / planMin) * 100) : 0

  const openAdd = (day: number) => {
    setEditId(null)
    setForm({ typeId: exercises[0]?.id ?? '', minutes: '30', note: '' })
    setDialogDay(day)
  }
  const openEdit = (day: number, item: PlanItem) => {
    const ex = exercises.find((e) => e.name === item.type)
    setEditId(item.id)
    setForm({ typeId: ex?.id ?? exercises[0]?.id ?? '', minutes: String(item.durationMin), note: item.note ?? '' })
    setDialogDay(day)
  }

  const saveForm = () => {
    if (dialogDay === null) return
    const ex = exercises.find((e) => e.id === form.typeId)
    if (!ex) return
    const durationMin = Math.max(0, Number(form.minutes) || 0)
    if (editId) {
      updatePlanItem(dialogDay, editId, { type: ex.name, durationMin, note: form.note.trim() || undefined })
    } else {
      addPlanItem(dialogDay, { id: uid(), type: ex.name, durationMin, note: form.note.trim() || undefined })
    }
    setDialogDay(null)
  }

  /** 把某天计划中「尚未记录」的动作写入**该天对应日期**的运动记录（避免重复打卡） */
  const logItems = (day: number) => {
    const targetDate = dateOfWeekday(selectedDate, day)
    const items = plan[day] ?? []
    // 已记录时长（累计），只补"还差多少分钟"，不做重复打卡
    const doneMap: Record<string, number> = {}
    for (const e of useStore.getState().logs[targetDate]?.exercises ?? []) {
      doneMap[e.type] = (doneMap[e.type] ?? 0) + e.durationMin
    }
    // 同类型多段按顺序分配，只补每段真正还差的分钟
    const progress = planDayProgress(
      items.map((i) => ({ id: i.id, type: i.type, durationMin: i.durationMin })),
      doneMap,
    )
    const toLog = items
      .map((item) => ({ item, remain: progress[item.id]?.remainMin ?? item.durationMin }))
      .filter((x) => x.remain > 0)
    if (toLog.length === 0) {
      showToast(`${WEEKDAYS[day]}的计划都已记录`)
      return
    }
    for (const { item, remain } of toLog) {
      const ex = exercises.find((e) => e.name === item.type)
      const met = ex?.met ?? 5
      addExercise(
        targetDate,
        buildExerciseEntry({
          type: item.type,
          met,
          durationMin: remain,
          intensity: 'medium',
          kcal: calcExerciseKcal(met, profile.weight, remain, 'medium'),
        }),
      )
    }
    const total = toLog.reduce((s, x) => s + x.remain, 0)
    showToast(`已记入 ${toLog.length} 项运动，共 ${total} 分钟（${mdOf(targetDate)}）`)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-gray-900">训练计划</h2>
        <span className="text-xs text-gray-400">本周共 {totalWeekMin} 分钟</span>
      </div>

      {/* 今日打卡 */}
      <Card>
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Target size={16} className="text-blue-500" />
            <h3 className="text-sm font-semibold text-gray-700">{isToday ? '今日打卡' : '当日打卡'}</h3>
          </div>
          <span className="text-xs text-gray-400">
            {WEEKDAYS[selWeekday]}
            {!isToday && ` · ${selectedDate}`}
          </span>
        </div>

        {dayPlan.length === 0 ? (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-400">这一天还没有安排</p>
            <Button variant="outline" size="sm" onClick={() => openAdd(selWeekday)}>
              <Plus size={14} /> 添加计划
            </Button>
          </div>
        ) : (
          <>
            <div className="flex items-end justify-between">
              <div>
                <span className="text-2xl font-bold text-gray-900">{doneMin}</span>
                <span className="text-sm text-gray-400"> / {planMin} 分钟</span>
              </div>
              <span className={pct >= 100 ? 'text-sm font-medium text-green-600' : 'text-xs text-gray-400'}>
                {pct >= 100 ? '✅ 全部完成' : `还差 ${pendingItems.length} 项`}
              </span>
            </div>
            <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className={`h-full rounded-full transition-all ${pct >= 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                style={{ width: `${Math.min(100, pct)}%` }}
              />
            </div>
            <div className="mt-1.5 flex justify-between text-[11px] text-gray-400">
              <span>
                {doneCount}/{dayPlan.length} 项达成
              </span>
              <span>{pendingItems.length ? `剩余约 ${pendingMin} 分钟` : '目标达成 🎉'}</span>
            </div>
            {pendingItems.length > 0 && (
              <Button className="mt-3 w-full" onClick={() => logItems(selWeekday)}>
                <Check size={16} /> 打卡剩余 {pendingItems.length} 项（{pendingMin} 分钟）
              </Button>
            )}
          </>
        )}
      </Card>

      {/* 整周安排 */}
      <Card>
        <div className="mb-2 flex items-center gap-1.5">
          <ClipboardList size={16} className="text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-700">整周安排</h3>
        </div>
        <div className="space-y-2">
          {plan.map((items, day) => {
            const rowDate = dateOfWeekday(selectedDate, day)
            // 已记录时长（累计分钟），按"是否达到计划分钟"判定完成
            const rowDoneMin: Record<string, number> = {}
            for (const e of logs[rowDate]?.exercises ?? []) {
              rowDoneMin[e.type] = (rowDoneMin[e.type] ?? 0) + e.durationMin
            }
            const rowProgress = planDayProgress(
              items.map((i) => ({ id: i.id, type: i.type, durationMin: i.durationMin })),
              rowDoneMin,
            )
            const remainOf = (it: PlanItem) => rowProgress[it.id]?.remainMin ?? it.durationMin
            const rowPending = items.filter((it) => remainOf(it) > 0)
            const allDone = items.length > 0 && rowPending.length === 0
            const isFuture = rowDate > todayYmd
            return (
            <div
              key={day}
              className={`rounded-lg border p-2.5 ${day === selWeekday ? 'border-blue-300 bg-blue-50' : 'border-gray-100'}`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-sm font-medium ${day === selWeekday ? 'text-blue-700' : 'text-gray-700'}`}>
                  {WEEKDAYS[day]}
                  <span className="ml-1 text-[10px] font-normal text-gray-400">{mdOf(rowDate)}</span>
                  {day === selWeekday && (
                    <span className="ml-1 text-[10px] text-blue-500">{isToday ? '今天' : '所选日期'}</span>
                  )}
                </span>
                <div className="flex items-center gap-1">
                  {/* 打卡：只在「所选日期」这一行、且还有未记录的项时出现 */}
                  {day === selWeekday && items.length > 0 && rowPending.length > 0 && (
                    <button
                      onClick={() => logItems(day)}
                      className="rounded-md border border-blue-300 px-1.5 py-0.5 text-[11px] text-blue-600 hover:bg-blue-50"
                      aria-label="打卡记入运动记录"
                      title="把该天尚未记录的项记入运动记录"
                    >
                      打卡
                    </button>
                  )}
                  {/* 完成标记：该天计划全部完成，且日期是今天或过去才显示（未来的天不显示） */}
                  {allDone && !isFuture && (
                    <span
                      className="flex items-center gap-0.5 text-[11px] text-green-600"
                      title="该天计划已全部完成"
                      aria-label="已完成"
                    >
                      <Check size={14} /> 完成
                    </span>
                  )}
                  {items.length > 0 && (
                    <button
                      onClick={() => {
                        const prev = plan[day]
                        clearPlanDay(day)
                        showToast(`已清空 ${WEEKDAYS[day]} 的计划`, () => prev.forEach((it) => addPlanItem(day, it)))
                      }}
                      className="rounded p-1 text-gray-400 hover:bg-gray-100"
                      aria-label="清空该天计划"
                      title="清空该天计划"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                  <button
                    onClick={() => openAdd(day)}
                    className="rounded p-1 text-blue-500 hover:bg-blue-50"
                    aria-label="添加动作"
                    title="添加动作"
                  >
                    <Plus size={15} />
                  </button>
                </div>
              </div>
              {items.length === 0 ? (
                <p className="mt-1 text-[11px] text-gray-400">休息日</p>
              ) : (
                <ul className="mt-1.5 space-y-1">
                  {items.map((it) => {
                    const rowDone = rowProgress[it.id]?.doneMin ?? 0
                    const done = remainOf(it) === 0
                    return (
                      <li key={it.id} className="flex items-center justify-between text-sm">
                        <span className={done ? 'text-gray-400 line-through' : 'text-gray-700'}>
                          {done && '✓ '}
                          {it.type}
                          {it.note && <span className="ml-1 text-xs text-gray-400">· {it.note}</span>}
                        </span>
                        <span className="flex items-center gap-1">
                          <span className={`text-xs ${done ? 'text-green-600' : 'text-gray-500'}`}>
                            {rowDone}/{it.durationMin}min
                          </span>
                          <button
                            onClick={() => openEdit(day, it)}
                            className="rounded p-1 text-gray-400 hover:bg-gray-100"
                            aria-label="编辑"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => {
                              deletePlanItem(day, it.id)
                              showToast(`已删除「${it.type}」`, () => addPlanItem(day, it))
                            }}
                            className="rounded p-1 text-red-400 hover:bg-red-50"
                            aria-label="删除"
                          >
                            <Trash2 size={13} />
                          </button>
                        </span>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
            )
          })}
        </div>
      </Card>

      <p className="px-1 text-[11px] text-gray-400">
        计划里的动作来自「运动库」。完成情况按「运动名称」与**该行对应日期**的运动记录自动对照（日期标在星期旁）。「打卡」只出现在**所选日期**那一行，会把该天还没记录的项一键记入；该天全部完成后显示「✓ 完成」（未来的日期不显示任何标记）。
      </p>

      <Dialog
        open={dialogDay !== null}
        onClose={() => setDialogDay(null)}
        title={dialogDay !== null ? `${WEEKDAYS[dialogDay]} · ${editId ? '编辑动作' : '添加动作'}` : ''}
      >
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs text-gray-500">运动类型</label>
            <Select value={form.typeId} onChange={(e) => setForm({ ...form, typeId: e.target.value })}>
              {exercises.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}（MET {e.met}）
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-500">计划时长（分钟）</label>
            <Input type="number" min={0} value={form.minutes} onChange={(e) => setForm({ ...form, minutes: e.target.value })} />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-500">备注（可选）</label>
            <Input placeholder="如：核心 / 间歇" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
          </div>
          {exercises.length === 0 && <p className="text-xs text-red-500">运动库为空，请先在「运动 → 运动库」中新增。</p>}
          <Button className="w-full" onClick={saveForm} disabled={exercises.length === 0}>
            保存
          </Button>
        </div>
      </Dialog>
    </div>
  )
}
