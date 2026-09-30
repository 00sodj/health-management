import { Bar, CartesianGrid, ComposedChart, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card } from '@/components/ui/card'

export interface TrendPoint {
  label: string
  intake: number
  exercise: number
  sleep: number
  quality?: number | null
}

const axisTick = { fontSize: 10, fill: '#94a3b8' }
const tooltipStyle = {
  fontSize: 12,
  borderRadius: 8,
  border: 'none',
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
}

/**
 * 近 7 天趋势。
 * 摄入/运动同为 kcal → 合到一张图（同一坐标轴，可比）；
 * 睡眠是小时 → **单独一张图**。避免两套量纲共用/并排双轴造成的"假重合/假波动"。
 */
export default function TrendChart({ data }: { data: TrendPoint[] }) {
  return (
    <Card>
      <h3 className="mb-2 text-sm font-semibold text-gray-700">近 7 天趋势</h3>

      {/* 热量（kcal） */}
      <div className="mb-1 flex items-center justify-between">
        <span className="text-[11px] text-gray-400">热量（kcal）</span>
        <span className="flex gap-3 text-[11px] text-gray-500">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-orange-500" /> 摄入
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-emerald-500" /> 运动
          </span>
        </span>
      </div>
      <div className="h-32 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 8, left: -22, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="label" tick={axisTick} />
            <YAxis tick={axisTick} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v as number} kcal`]} />
            <Line type="monotone" dataKey="intake" name="摄入" stroke="#f97316" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="exercise" name="运动" stroke="#10b981" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 睡眠（小时）：时长用线，质量(1~5)用柱 */}
      <div className="mb-1 mt-3 flex items-center justify-between border-t border-gray-100 pt-2">
        <span className="text-[11px] text-gray-400">睡眠（小时）</span>
        <span className="flex items-center gap-3 text-[11px] text-gray-500">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-purple-500" /> 时长·线
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-sm bg-purple-300" /> 质量·柱
          </span>
        </span>
      </div>
      <div className="h-28 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 5, right: 2, left: -22, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="label" tick={axisTick} />
            <YAxis yAxisId="h" tick={axisTick} />
            <YAxis yAxisId="q" orientation="right" domain={[0, 5]} ticks={[1, 2, 3, 4, 5]} width={20} tick={axisTick} />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v, n) =>
                n === '质量' ? [`${v as number}/5`, '睡眠质量'] : [`${v as number} 小时`, '睡眠时长']
              }
            />
            <Bar yAxisId="q" dataKey="quality" name="质量" fill="#c4b5fd" radius={[3, 3, 0, 0]} maxBarSize={14} />
            <Line
              yAxisId="h"
              type="monotone"
              dataKey="sleep"
              name="时长"
              stroke="#8b5cf6"
              strokeWidth={2}
              dot={{ r: 2.5 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
