import { useEffect, useState } from 'react'
import { Clock, Moon, Save } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useStore } from '@/store/useStore'
import { useToast } from '@/store/useToast'
import { buildSleepEntry, calcSleepDuration } from '@/utils/calc'

export function SleepPage() {
  const selectedDate = useStore((s) => s.selectedDate)
  const log = useStore((s) => s.logs[selectedDate])
  const setSleep = useStore((s) => s.setSleep)
  const showToast = useToast((s) => s.show)

  const [bedtime, setBedtime] = useState('23:30')
  const [wakeTime, setWakeTime] = useState('07:00')
  const [quality, setQuality] = useState(3)
  const [nap, setNap] = useState<number>(0)

  // 回填已有记录
  useEffect(() => {
    const s = log?.sleep
    if (s) {
      setBedtime(s.bedtime)
      setWakeTime(s.wakeTime)
      setQuality(s.quality)
      setNap(s.napMin ?? 0)
    }
  }, [log])

  const duration = calcSleepDuration(bedtime, wakeTime)
  const total = Math.round((duration + (nap || 0) / 60) * 10) / 10

  const save = () => {
    if (!bedtime || !wakeTime) return
    setSleep(
      selectedDate,
      buildSleepEntry({
        bedtime,
        wakeTime,
        quality,
        napMin: nap || undefined,
        durationHours: duration,
      }),
    )
  }

  const clear = () => {
    const prev = log?.sleep ?? null
    setSleep(selectedDate, null)
    if (prev) showToast('已清除睡眠记录', () => setSleep(selectedDate, prev))
  }

  return (
    <div className="space-y-3">
      <Card>
        <div className="mb-3 flex items-center gap-2">
          <Moon size={18} className="text-purple-500" />
          <span className="text-sm font-medium text-gray-700">睡眠记录</span>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-gray-500">入睡时间</label>
              <Input type="time" value={bedtime} onChange={(e) => setBedtime(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-500">起床时间</label>
              <Input type="time" value={wakeTime} onChange={(e) => setWakeTime(e.target.value)} />
            </div>
          </div>

          <div className="rounded-lg bg-purple-50 p-3 text-center">
            <div className="flex items-center justify-center gap-1 text-xs text-purple-500">
              <Clock size={13} /> 夜间睡眠
            </div>
            <div className="text-2xl font-bold text-purple-700">
              {duration} <span className="text-sm font-normal">小时</span>
            </div>
            {nap > 0 && <div className="text-[11px] text-purple-400">+ 午睡 {nap} 分钟</div>}
          </div>

          <div>
            <label className="mb-1 block text-xs text-gray-500">午睡时长（分钟，可选）</label>
            <Input type="number" min={0} value={nap} onChange={(e) => setNap(Number(e.target.value))} placeholder="0" />
          </div>

          <div>
            <label className="mb-1 block text-xs text-gray-500">睡眠质量：{quality} / 5</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((q) => (
                <button
                  key={q}
                  onClick={() => setQuality(q)}
                  className={`h-9 flex-1 rounded-lg text-sm font-medium transition ${
                    quality >= q ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
            <div className="mt-1 flex justify-between text-[10px] text-gray-400">
              <span>很差</span>
              <span>极好</span>
            </div>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <Button className="flex-1" onClick={save}>
            <Save size={16} /> 保存（共 {total}h）
          </Button>
          <Button variant="outline" onClick={clear}>
            清除
          </Button>
        </div>
      </Card>

      <p className="px-1 text-[11px] leading-relaxed text-gray-400">
        睡眠作为恢复指标参与健康建议，不换算为大卡。成人推荐 7-9 小时睡眠。
      </p>
    </div>
  )
}
