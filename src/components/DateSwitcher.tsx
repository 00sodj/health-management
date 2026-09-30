import { addDays, format, isToday } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useStore } from '@/store/useStore'

/** 顶部日期切换器：支持前一天/后一天，并显示"今天"。 */
export function DateSwitcher() {
  const selectedDate = useStore((s) => s.selectedDate)
  const setSelectedDate = useStore((s) => s.setSelectedDate)

  const dateObj = new Date(selectedDate + 'T00:00:00')
  const label = format(dateObj, 'M月d日 EEE', { locale: zhCN })
  const todayMark = isToday(dateObj) ? '今天' : ''

  const shift = (delta: number) => setSelectedDate(format(addDays(dateObj, delta), 'yyyy-MM-dd'))

  return (
    <div className="flex items-center justify-between rounded-xl bg-white px-2 py-1.5 shadow-sm">
      <button onClick={() => shift(-1)} className="rounded-full p-2 text-gray-500 hover:bg-gray-100" aria-label="前一天">
        <ChevronLeft size={20} />
      </button>
      <div className="flex flex-col items-center">
        <span className="text-sm font-semibold text-gray-900">{label}</span>
        {todayMark && <span className="text-[10px] text-blue-500">{todayMark}</span>}
      </div>
      <button onClick={() => shift(1)} className="rounded-full p-2 text-gray-500 hover:bg-gray-100" aria-label="后一天">
        <ChevronRight size={20} />
      </button>
    </div>
  )
}
