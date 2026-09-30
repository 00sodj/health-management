import * as React from 'react'
import { cn } from '@/lib/utils'

type BadgeVariant = 'default' | 'good' | 'warn' | 'info'

const variants: Record<BadgeVariant, string> = {
  default: 'bg-gray-100 text-gray-600',
  good: 'bg-green-100 text-green-700',
  warn: 'bg-amber-100 text-amber-700',
  info: 'bg-blue-100 text-blue-700',
}

export function Badge({
  variant = 'default',
  className,
  children,
}: {
  variant?: BadgeVariant
  className?: string
  children: React.ReactNode
}) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', variants[variant], className)}>
      {children}
    </span>
  )
}
