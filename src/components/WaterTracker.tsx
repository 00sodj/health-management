import { useState } from 'react'
import { Droplets, Minus, Plus } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useStore } from '@/store/useStore'

const CUP_ML = 250

/** 饮水追踪：进度条 + 固定水滴槽位 + 快捷加减 / 自定义水量（按钮位置固定不移动） */
export function WaterTracker({ date, currentMl, targetMl }: { date: string; currentMl: number; targetMl: number }) {
  const addWater = useStore((s) => s.addWater)
  const setWater = useStore((s) => s.setWater)
  const [customMl, setCustomMl] = useState('')

  const pct = targetMl ? Math.min(100, Math.round((currentMl / targetMl) * 100)) : 0
  const cups = Math.round(currentMl / CUP_ML)
  // 水滴槽位数量由「目标」决定（固定不变），饮水只影响填充，避免布局随饮水跳动
  const slots = Math.max(1, Math.ceil(targetMl / CUP_ML))

  const applyCustom = () => {
    const ml = Math.round(Number(customMl))
    if (Number.isFinite(ml) && ml !== 0) addWater(date, ml)
    setCustomMl('')
  }

  return (
    <Card>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Droplets size={16} className="text-blue-500" />
          <span className="text-sm text-gray-700">饮水</span>
        </div>
        <span className="text-xs text-gray-400">
          {currentMl} / {targetMl} ml · {cups} 杯
        </span>
      </div>

      <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
        <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${pct}%` }} />
      </div>

      {/* 固定槽位水滴（数量恒定 = 目标杯数） */}
      <div className="mt-3 flex flex-wrap justify-center gap-1">
        {Array.from({ length: slots }).map((_, i) => (
          <Droplets
            key={i}
            size={18}
            className={i < cups ? 'text-blue-500' : 'text-gray-200'}
            fill={i < cups ? '#3b82f6' : 'none'}
          />
        ))}
      </div>

      {/* 快捷加减（位置固定在两端） + 自定义水量 */}
      <div className="mt-3 grid grid-cols-[auto_1fr_auto] items-center gap-2">
        <Button size="icon" variant="outline" onClick={() => addWater(date, -CUP_ML)} disabled={currentMl <= 0} aria-label="减少250ml">
          <Minus size={16} />
        </Button>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            inputMode="numeric"
            placeholder="自定义 ml"
            value={customMl}
            onChange={(e) => setCustomMl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') applyCustom()
            }}
            className="text-center"
          />
          <Button variant="outline" onClick={applyCustom} disabled={!customMl} className="shrink-0">
            记录
          </Button>
        </div>
        <Button size="icon" onClick={() => addWater(date, CUP_ML)} aria-label="增加250ml">
          <Plus size={16} />
        </Button>
      </div>

      <button onClick={() => setWater(date, 0)} className="mt-2 w-full text-center text-[11px] text-gray-400 hover:text-gray-600">
        重置当日饮水
      </button>
    </Card>
  )
}
