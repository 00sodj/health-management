import { cn } from '@/lib/utils'

interface ProgressRingProps {
  value: number // 当前值
  max: number // 目标值
  size?: number
  stroke?: number
  label?: string
  unit?: string
  className?: string
}

/** SVG 进度环，展示目标完成度（0-100%+）。 */
export function ProgressRing({
  value,
  max,
  size = 120,
  stroke = 12,
  label,
  unit = '',
  className,
}: ProgressRingProps) {
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const pct = max > 0 ? value / max : 0
  const clamped = Math.min(pct, 1)
  const offset = circumference * (1 - clamped)
  const over = pct > 1

  return (
    <div className={cn('relative flex items-center justify-center', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#eef2f7" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={over ? '#f59e0b' : '#3b82f6'}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.4s ease' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-xl font-bold text-gray-900">
          {Math.round(value)}
          <span className="text-xs font-normal text-gray-400">{unit}</span>
        </span>
        {label && <span className="text-[11px] text-gray-400">{label}</span>}
      </div>
    </div>
  )
}
