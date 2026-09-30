import { useMemo, useState } from 'react'
import { Flame, Pencil, Plus, Trash2, Library } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AddMealDialog } from '@/components/AddMealDialog'
import { FoodLibraryDialog } from '@/components/FoodLibraryDialog'
import { MEAL_LABELS, MEAL_TYPES, type MealEntry, type MealType } from '@/types'
import { useStore } from '@/store/useStore'
import { useToast } from '@/store/useToast'
import { summarizeDay } from '@/utils/calc'

export function DietPage() {
  const selectedDate = useStore((s) => s.selectedDate)
  const profile = useStore((s) => s.profile)
  const log = useStore((s) => s.logs[selectedDate])

  const [open, setOpen] = useState(false)
  const [libOpen, setLibOpen] = useState(false)
  const [activeMeal, setActiveMeal] = useState<MealType>('breakfast')
  const [editEntry, setEditEntry] = useState<MealEntry | null>(null)

  const meals = log?.meals ?? []
  const summary = useMemo(() => summarizeDay(log ?? { date: selectedDate, meals: [], exercises: [], sleep: null }, profile), [log, profile, selectedDate])

  const openAdd = (m: MealType) => {
    setActiveMeal(m)
    setEditEntry(null)
    setOpen(true)
  }
  const openEdit = (e: MealEntry) => {
    setActiveMeal(e.mealType)
    setEditEntry(e)
    setOpen(true)
  }

  const deleteMeal = useStore((s) => s.deleteMeal)
  const addMeal = useStore((s) => s.addMeal)
  const showToast = useToast((s) => s.show)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-gray-900">饮食记录</h2>
        <Button variant="outline" size="sm" onClick={() => setLibOpen(true)}>
          <Library size={15} /> 食物库
        </Button>
      </div>
      {/* 全天总计 */}
      <Card>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame size={18} className="text-orange-500" />
            <span className="text-sm text-gray-500">全天摄入</span>
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold text-gray-900">{summary.intakeKcal}</span>
            <span className="ml-1 text-xs text-gray-400">kcal</span>
          </div>
        </div>
        <div className="mt-2 grid grid-cols-3 gap-2 text-center text-xs">
          <div className="rounded-lg bg-gray-50 py-1.5">
            <div className="font-semibold text-gray-800">{summary.protein}g</div>
            <div className="text-gray-400">蛋白质</div>
          </div>
          <div className="rounded-lg bg-gray-50 py-1.5">
            <div className="font-semibold text-gray-800">{summary.carbs}g</div>
            <div className="text-gray-400">碳水</div>
          </div>
          <div className="rounded-lg bg-gray-50 py-1.5">
            <div className="font-semibold text-gray-800">{summary.fat}g</div>
            <div className="text-gray-400">脂肪</div>
          </div>
        </div>
      </Card>

      {/* 按餐次分组 */}
      {MEAL_TYPES.map((m) => {
        const items = meals.filter((x) => x.mealType === m)
        const sub = items.reduce((s, x) => s + x.kcal, 0)
        return (
          <Card key={m} className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700">
                {MEAL_LABELS[m]}
                <span className="ml-2 text-xs font-normal text-gray-400">{items.length} 项</span>
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-900">{sub} kcal</span>
                <Button size="sm" variant="ghost" onClick={() => openAdd(m)}>
                  <Plus size={16} />
                </Button>
              </div>
            </div>

            {items.length === 0 ? (
              <p className="py-2 text-center text-xs text-gray-400">暂无记录，点 + 添加</p>
            ) : (
              <ul className="divide-y divide-gray-50">
                {items.map((e) => (
                  <li key={e.id} className="flex items-center justify-between py-2">
                    <div>
                      <div className="text-sm text-gray-800">
                        {e.name}
                        <span className="ml-1 text-xs text-gray-400">
                          {e.quantity}
                          {e.unit}
                          {e.grams ? ` · ${e.grams}g` : ''}
                        </span>
                      </div>
                      <div className="text-[11px] text-gray-400">
                        {e.kcal} kcal · 蛋{e.protein} 碳{e.carbs} 脂{e.fat}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(e)} className="rounded p-1.5 text-gray-400 hover:bg-gray-100" aria-label="编辑">
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => {
                          deleteMeal(selectedDate, e.id)
                          showToast(`已删除「${e.name}」`, () => addMeal(selectedDate, e))
                        }}
                        className="rounded p-1.5 text-red-400 hover:bg-red-50"
                        aria-label="删除"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        )
      })}

      <AddMealDialog open={open} onClose={() => setOpen(false)} date={selectedDate} mealType={activeMeal} editEntry={editEntry} />
      <FoodLibraryDialog open={libOpen} onClose={() => setLibOpen(false)} />
    </div>
  )
}
