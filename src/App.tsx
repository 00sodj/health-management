import { useEffect, useState } from 'react'
import { HeartPulse } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { DateSwitcher } from '@/components/DateSwitcher'
import { BottomNav, type TabKey } from '@/components/BottomNav'
import { InstallBanner } from '@/components/InstallBanner'
import { UndoToast } from '@/components/UndoToast'
import { TodayPage } from '@/pages/TodayPage'
import { DietPage } from '@/pages/DietPage'
import { ExercisePage } from '@/pages/ExercisePage'
import { PlanPage } from '@/pages/PlanPage'
import { SleepPage } from '@/pages/SleepPage'
import { ProfilePage } from '@/pages/ProfilePage'

export default function App() {
  const [tab, setTab] = useState<TabKey>('today')
  const theme = useStore((s) => s.theme)

  // 应用主题到 <html>（并同步 PWA 主题色）
  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', theme === 'dark')
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#0b1220' : '#3b82f6')
  }, [theme])

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-gray-50">
      {/* 顶部栏 */}
      <header className="sticky top-0 z-30 space-y-2 bg-gray-50/95 px-4 pb-2 pt-3 backdrop-blur">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
            <HeartPulse size={18} />
          </span>
          <div className="flex-1">
            <h1 className="text-base font-bold leading-none text-gray-900">健康管理</h1>
            <p className="text-[11px] text-gray-400">记录每天的摄入与消耗</p>
          </div>
        </div>
        <DateSwitcher />
      </header>

      {/* 安装引导（仅在浏览器允许安装时出现） */}
      <InstallBanner />

      {/* 主内容 */}
      <main className="flex-1 px-4 pb-24 pt-2">
        {tab === 'today' && <TodayPage />}
        {tab === 'diet' && <DietPage />}
        {tab === 'exercise' && <ExercisePage />}
        {tab === 'plan' && <PlanPage />}
        {tab === 'sleep' && <SleepPage />}
        {tab === 'profile' && <ProfilePage />}
      </main>

      <BottomNav active={tab} onChange={setTab} />
      <UndoToast />
    </div>
  )
}
