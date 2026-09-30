import { Apple, CalendarCheck, Dumbbell, Home, Moon, User } from 'lucide-react'
import { cn } from '@/lib/utils'

export type TabKey = 'today' | 'diet' | 'exercise' | 'plan' | 'sleep' | 'profile'

const TABS: { key: TabKey; label: string; icon: typeof Home }[] = [
  { key: 'today', label: '今日', icon: Home },
  { key: 'diet', label: '饮食', icon: Apple },
  { key: 'exercise', label: '运动', icon: Dumbbell },
  { key: 'plan', label: '计划', icon: CalendarCheck },
  { key: 'sleep', label: '睡眠', icon: Moon },
  { key: 'profile', label: '我的', icon: User },
]

export function BottomNav({ active, onChange }: { active: TabKey; onChange: (t: TabKey) => void }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 mx-auto max-w-md border-t border-gray-100 bg-white/95 backdrop-blur">
      <div className="flex items-stretch justify-around">
        {TABS.map((t) => {
          const Icon = t.icon
          const isActive = active === t.key
          return (
            <button
              key={t.key}
              onClick={() => onChange(t.key)}
              className={cn(
                'flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] transition-colors',
                isActive ? 'text-blue-600' : 'text-gray-400',
              )}
            >
              <Icon size={20} strokeWidth={isActive ? 2.4 : 2} />
              {t.label}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
