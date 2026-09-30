import { useEffect, useState } from 'react'
import { Dialog } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { INTENSITIES, type ExerciseEntry, type Intensity } from '@/types'
import { INTENSITY_LABELS } from '@/types'
import { PACE_DEFAULTS, RUN_PACE_IDS, type ExerciseDef } from '@/data/exercises'
import {
  buildExerciseEntry,
  calcExerciseKcal,
  calcPaceExerciseKcal,
  calcPaceMet,
  calcStepsWalk,
} from '@/utils/calc'
import { useStore } from '@/store/useStore'

interface Props {
  open: boolean
  onClose: () => void
  date: string
  weight: number
  editEntry?: ExerciseEntry | null
}

function paceDefaults(ex?: ExerciseDef) {
  return (ex && PACE_DEFAULTS[ex.id]) || { speedKmh: 5, inclinePct: 0 }
}

export function AddExerciseDialog({ open, onClose, date, weight, editEntry }: Props) {
  const exercises = useStore((s) => s.exercises)
  const addExercise = useStore((s) => s.addExercise)
  const updateExercise = useStore((s) => s.updateExercise)
  const profile = useStore((s) => s.profile)

  const [typeId, setTypeId] = useState('run')
  const [duration, setDuration] = useState<number>(30)
  const [intensity, setIntensity] = useState<Intensity>('medium')
  const [speed, setSpeed] = useState<number>(9)
  const [incline, setIncline] = useState<number>(0)
  const [manual, setManual] = useState(false)
  const [manualKcal, setManualKcal] = useState<number>(0)
  // 走路：时长 / 步数 两种模式
  const [mode, setMode] = useState<'time' | 'steps'>('time')
  const [steps, setSteps] = useState<number>(0)
  const [stepsDuration, setStepsDuration] = useState<number | ''>('')

  useEffect(() => {
    if (!open) return
    if (editEntry) {
      const found = exercises.find((e) => e.name === editEntry.type)
      setTypeId(found?.id ?? 'run')
      setDuration(editEntry.durationMin)
      setIntensity(editEntry.intensity)
      if (editEntry.steps != null && found?.id === 'walk') {
        setMode('steps')
        setSteps(editEntry.steps)
        setStepsDuration(editEntry.durationMin)
        setIncline(editEntry.inclinePct ?? 0)
        setSpeed(editEntry.speedKmh ?? 5)
      } else {
        setMode('time')
        setSteps(0)
        setStepsDuration('')
        if (editEntry.speedKmh != null || editEntry.inclinePct != null) {
          setSpeed(editEntry.speedKmh ?? 5)
          setIncline(editEntry.inclinePct ?? 0)
        } else {
          const d = paceDefaults(found)
          setSpeed(d.speedKmh)
          setIncline(d.inclinePct)
        }
      }
      if (editEntry.isManual) {
        setManual(true)
        setManualKcal(editEntry.kcal)
      } else {
        setManual(false)
        setManualKcal(0)
      }
    } else {
      const d = paceDefaults(exercises.find((e) => e.id === 'run'))
      setTypeId('run')
      setDuration(30)
      setIntensity('medium')
      setSpeed(d.speedKmh)
      setIncline(d.inclinePct)
      setManual(false)
      setManualKcal(0)
      setMode('time')
      setSteps(0)
      setStepsDuration('')
    }
  }, [open, editEntry, exercises])

  const ex = exercises.find((e) => e.id === typeId) ?? exercises[0]
  const isPace = !!ex?.pace
  const isRun = RUN_PACE_IDS.has(ex?.id ?? '')
  const isWalk = ex?.id === 'walk'
  const useSteps = isWalk && mode === 'steps'

  const stepRes = useSteps
    ? calcStepsWalk(
        steps || 0,
        profile.height,
        weight,
        incline || 0,
        stepsDuration === '' ? undefined : Number(stepsDuration),
      )
    : null

  const computedMet = useSteps ? stepRes!.met : isPace ? calcPaceMet(speed, incline, isRun) : ex.met
  const computedDurationMin = useSteps ? stepRes!.durationMin : duration || 0
  const computed = useSteps
    ? stepRes!.kcal
    : isPace
      ? calcPaceExerciseKcal(speed, incline, isRun, weight, duration || 0)
      : calcExerciseKcal(ex.met, weight, duration || 0, intensity)
  const finalKcal = manual ? manualKcal : computed

  const handleTypeChange = (id: string) => {
    setTypeId(id)
    setMode('time')
    setSteps(0)
    setStepsDuration('')
    const nx = exercises.find((e) => e.id === id)
    if (nx?.pace) {
      const d = paceDefaults(nx)
      setSpeed(d.speedKmh)
      setIncline(d.inclinePct)
    }
  }

  const handleAdd = () => {
    const entry = buildExerciseEntry({
      type: ex.name,
      met: computedMet,
      durationMin: computedDurationMin,
      intensity,
      kcal: finalKcal || 0,
      isManual: manual || undefined,
      ...(useSteps
        ? { steps: Math.round(steps) || 0, inclinePct: incline, speedKmh: stepRes?.speedKmh }
        : isPace
          ? { speedKmh: speed, inclinePct: incline }
          : {}),
    })
    editEntry ? updateExercise(date, editEntry.id, entry) : addExercise(date, entry)
    onClose()
  }

  if (!ex) {
    return (
      <Dialog open={open} onClose={onClose} title={editEntry ? '编辑运动' : '添加运动'}>
        <p className="py-6 text-center text-sm text-gray-400">
          运动库为空，请先在「运动库」中新增一项运动后再记录。
        </p>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onClose={onClose} title={editEntry ? '编辑运动' : '添加运动'}>
      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-xs text-gray-500">运动类型</label>
          <Select value={typeId} onChange={(e) => handleTypeChange(e.target.value)}>
            {exercises.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}（MET {e.met}）
              </option>
            ))}
          </Select>
        </div>

        {/* 走路：时长 / 步数 切换 */}
        {isWalk && (
          <div className="flex rounded-lg bg-gray-100 p-1 text-sm">
            {(['time', 'steps'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 rounded-md py-1.5 ${mode === m ? 'bg-white font-medium text-blue-600 shadow-sm' : 'text-gray-500'}`}
              >
                {m === 'time' ? '按时长' : '按步数'}
              </button>
            ))}
          </div>
        )}

        {useSteps ? (
          <>
            <div>
              <label className="mb-1 block text-xs text-gray-500">步数</label>
              <Input type="number" min={0} placeholder="如 8000" value={steps || ''} onChange={(e) => setSteps(Number(e.target.value))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs text-gray-500">时长（分钟，选填）</label>
                <Input
                  type="number"
                  min={0}
                  placeholder="留空自动估算"
                  value={stepsDuration}
                  onChange={(e) => setStepsDuration(e.target.value === '' ? '' : Number(e.target.value))}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-500">坡度（%）</label>
                <Input type="number" step={1} value={incline} onChange={(e) => setIncline(Number(e.target.value))} />
              </div>
            </div>
            {stepRes && (
              <p className="text-[11px] text-gray-400">
                约 {stepRes.distanceKm} 公里 · 时长约 {stepRes.durationMin} 分钟 · 速度约 {stepRes.speedKmh} km/h · MET ≈{' '}
                {stepRes.met}
              </p>
            )}
          </>
        ) : (
          <>
            <div>
              <label className="mb-1 block text-xs text-gray-500">时长（分钟）</label>
              <Input type="number" min={0} value={duration} onChange={(e) => setDuration(Number(e.target.value))} />
            </div>

            {isPace ? (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-gray-500">速度（km/h）</label>
                  <Input type="number" min={0} step={0.1} value={speed} onChange={(e) => setSpeed(Number(e.target.value))} />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-500">坡度（%）</label>
                  <Input type="number" step={1} value={incline} onChange={(e) => setIncline(Number(e.target.value))} />
                </div>
              </div>
            ) : (
              <div>
                <label className="mb-1 block text-xs text-gray-500">强度</label>
                <Select value={intensity} onChange={(e) => setIntensity(e.target.value as Intensity)}>
                  {INTENSITIES.map((i) => (
                    <option key={i} value={i}>
                      {INTENSITY_LABELS[i]}
                    </option>
                  ))}
                </Select>
              </div>
            )}
          </>
        )}

        <div className="rounded-lg bg-gray-50 p-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-500">预计消耗</span>
            <span className="text-lg font-bold text-blue-600">
              {manual ? manualKcal : computed} <span className="text-xs font-normal text-gray-400">kcal</span>
            </span>
          </div>
          {useSteps ? (
            <p className="mt-1 text-[11px] text-gray-400">
              按步数估算：步幅≈身高×0.415，MET ≈ {computedMet} × {weight}kg × {computedDurationMin / 60} 小时
            </p>
          ) : isPace ? (
            <p className="mt-1 text-[11px] text-gray-400">
              按 ACSM 方程由「速度 {speed} km/h + 坡度 {incline}%」推算：MET ≈ {computedMet} × {weight}kg ×{' '}
              {(duration || 0) / 60} 小时
            </p>
          ) : (
            <p className="mt-1 text-[11px] text-gray-400">
              公式：{ex.met} MET × {weight}kg × {(duration || 0) / 60} 小时 × 强度系数
            </p>
          )}
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input type="checkbox" checked={manual} onChange={(e) => setManual(e.target.checked)} />
          手动调整消耗大卡
        </label>
        {manual && (
          <Input type="number" min={0} placeholder="输入消耗 kcal" value={manualKcal} onChange={(e) => setManualKcal(Number(e.target.value))} />
        )}

        <Button className="w-full" onClick={handleAdd} disabled={useSteps ? !(steps > 0) : duration <= 0}>
          {editEntry ? '保存' : '添加'}
        </Button>
      </div>
    </Dialog>
  )
}
