import { useEffect, useState } from 'react'
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Scale } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useStore } from '@/store/useStore'

interface Point {
  label: string
  weight: number | null
}

/** 体重记录 + 近 7 天趋势（输入后需点「保存」才计入） */
export function WeightTracker({ date, currentWeight, week }: { date: string; currentWeight: number | null; week: Point[] }) {
  const setWeight = useStore((s) => s.setWeight)
  const [val, setVal] = useState(currentWeight != null ? String(currentWeight) : '')

  // 切换日期 / 外部数据变化时同步输入框
  useEffect(() => {
    setVal(currentWeight != null ? String(currentWeight) : '')
  }, [date, currentWeight])

  const saved = currentWeight != null ? String(currentWeight) : ''
  const dirty = val.trim() !== saved

  const commit = () => {
    const t = val.trim()
    const n = parseFloat(t)
    setWeight(date, !t || isNaN(n) || n <= 0 ? null : Math.round(n * 10) / 10)
  }

  const data = week.map((p) => ({ ...p, w: p.weight ?? null }))
  const hasData = week.some((p) => p.weight !== null)

  return (
    <Card>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Scale size={16} className="text-purple-500" />
          <span className="text-sm text-gray-700">体重</span>
        </div>
        <div className="flex items-center gap-1">
          <Input
            type="number"
            step={0.1}
            min={0}
            value={val}
            onChange={(e) => setVal(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commit()
            }}
            placeholder="记录体重"
            className="h-8 w-20 text-sm"
          />
          <span className="text-xs text-gray-400">kg</span>
          <Button size="sm" onClick={commit} disabled={!dirty}>
            保存
          </Button>
        </div>
      </div>
      {currentWeight != null && (
        <p className="mt-1 text-right text-[11px] text-gray-400">已记录 {currentWeight} kg</p>
      )}

      {hasData ? (
        <div className="mt-2 h-28 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 8, left: 0, bottom: 0 }}>
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <YAxis domain={['dataMin - 1', 'dataMax + 1']} tick={{ fontSize: 10, fill: '#94a3b8' }} width={34} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                formatter={(v: number) => [`${v} kg`, '体重']}
              />
              <Line type="monotone" dataKey="w" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="mt-3 py-2 text-center text-xs text-gray-400">记录体重可查看趋势曲线</p>
      )}
    </Card>
  )
}
