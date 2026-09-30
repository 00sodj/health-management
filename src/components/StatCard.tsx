import * as React from 'react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface StatCardProps {
  icon?: React.ReactNode
  label: string
  value: string | number
  unit?: string
  hint?: string
  accent?: 'blue' | 'green' | 'orange' | 'purple' | 'gray'
}

const accentMap = {
  blue: 'bg-blue-50 text-blue-600',
  green: 'bg-green-50 text-green-600',
  orange: 'bg-orange-50 text-orange-600',
  purple: 'bg-purple-50 text-purple-600',
  gray: 'bg-gray-100 text-gray-500',
}

/** 今日看板的小统计卡片。 */
export function StatCard({ icon, label, value, unit, hint, accent = 'gray' }: StatCardProps) {
  return (
    <Card className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5">
        {icon && <span className={cn('flex h-6 w-6 items-center justify-center rounded-md', accentMap[accent])}>{icon}</span>}
        <span className="text-xs text-gray-500">{label}</span>
      </div>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="text-2xl font-bold text-gray-900">{value}</span>
        {unit && <span className="text-xs text-gray-400">{unit}</span>}
      </div>
      {hint && <span className="text-[11px] text-gray-400">{hint}</span>}
    </Card>
  )
}
