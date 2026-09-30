import { useMemo, useState } from 'react'
import { Dumbbell, Flame, Library, Pencil, Plus, Timer, Trash2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AddExerciseDialog } from '@/components/AddExerciseDialog'
import { ExerciseLibraryDialog } from '@/components/ExerciseLibraryDialog'
import { INTENSITY_LABELS, type ExerciseEntry } from '@/types'
import { useStore } from '@/store/useStore'
import { useToast } from '@/store/useToast'
import { summarizeDay } from '@/utils/calc'

export function ExercisePage() {
  const selectedDate = useStore((s) => s.selectedDate)
  const profile = useStore((s) => s.profile)
  const log = useStore((s) => s.logs[selectedDate])

  const [open, setOpen] = useState(false)
  const [libOpen, setLibOpen] = useState(false)
  const [editEntry, setEditEntry] = useState<ExerciseEntry | null>(null)

  const exercises = log?.exercises ?? []
  const summary = useMemo(() => summarizeDay(log ?? { date: selectedDate, meals: [], exercises: [], sleep: null }, profile), [log, profile, selectedDate])
  const totalKcal = summary.exerciseKcal
  const totalMin = exercises.reduce((s, e) => s + e.durationMin, 0)

  const openAdd = () => {
    setEditEntry(null)
    setOpen(true)
  }
  const openEdit = (e: ExerciseEntry) => {
    setEditEntry(e)
    setOpen(true)
  }
  const deleteExercise = useStore((s) => s.deleteExercise)
  const addExercise = useStore((s) => s.addExercise)
  const showToast = useToast((s) => s.show)

  return (
    <div className="space-y-3">
      <Card>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Dumbbell size={18} className="text-blue-500" />
            <span className="text-sm text-gray-500">运动总消耗</span>
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold text-gray-900">{totalKcal}</span>
            <span className="ml-1 text-xs text-gray-400">kcal</span>
          </div>
        </div>
        <div className="mt-2 flex items-center gap-4 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <Timer size={13} /> 总时长 {totalMin} 分钟
          </span>
          <span className="flex items-center gap-1">
            <Flame size={13} /> 平均 {totalMin ? Math.round(totalKcal / (totalMin / 60)) : 0} kcal/小时
          </span>
        </div>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => setLibOpen(true)}>
          <Library size={16} /> 运动库
        </Button>
        <Button onClick={openAdd}>
          <Plus size={16} /> 添加运动
        </Button>
      </div>

      {exercises.length === 0 ? (
        <Card>
          <p className="py-6 text-center text-sm text-gray-400">还没有运动记录，点上方按钮添加</p>
        </Card>
      ) : (
        <ul className="space-y-2">
          {exercises.map((e) => (
            <Card key={e.id} className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-800">
                  {e.type}
                  {e.speedKmh == null && (
                    <span className="ml-2 text-xs font-normal text-gray-400">{INTENSITY_LABELS[e.intensity]}</span>
                  )}
                </div>
                <div className="text-[11px] text-gray-400">
                  {e.durationMin} 分钟 · MET {e.met}
                  {e.steps != null && e.steps > 0 && <> · {e.steps} 步</>}
                  {e.speedKmh != null && <> · {e.speedKmh} km/h</>}
                  {e.inclinePct != null && e.inclinePct !== 0 && <> · 坡度 {e.inclinePct}%</>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-blue-600">
                  {e.kcal}
                  <span className="text-[11px] font-normal text-gray-400"> kcal</span>
                </span>
                <button onClick={() => openEdit(e)} className="rounded p-1.5 text-gray-400 hover:bg-gray-100" aria-label="编辑">
                  <Pencil size={15} />
                </button>
                <button
                  onClick={() => {
                    deleteExercise(selectedDate, e.id)
                    showToast(`已删除「${e.type}」`, () => addExercise(selectedDate, e))
                  }}
                  className="rounded p-1.5 text-red-400 hover:bg-red-50"
                  aria-label="删除"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </Card>
          ))}
        </ul>
      )}

      <AddExerciseDialog open={open} onClose={() => setOpen(false)} date={selectedDate} weight={profile.weight} editEntry={editEntry} />
      <ExerciseLibraryDialog open={libOpen} onClose={() => setLibOpen(false)} />
    </div>
  )
}
