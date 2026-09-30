import { useEffect, useMemo, useState } from 'react'
import { Pencil, Plus, Trash2, X } from 'lucide-react'
import { Dialog } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useStore } from '@/store/useStore'
import { uid } from '@/utils/calc'
import type { ExerciseDef } from '@/data/exercises'

interface Props {
  open: boolean
  onClose: () => void
}

interface FormState {
  id: string | null
  name: string
  category: string
  met: string
  pace: boolean
}

const emptyForm: FormState = { id: null, name: '', category: '', met: '', pace: false }

export function ExerciseLibraryDialog({ open, onClose }: Props) {
  const exercises = useStore((s) => s.exercises)
  const addExerciseDef = useStore((s) => s.addExerciseDef)
  const updateExerciseDef = useStore((s) => s.updateExerciseDef)
  const deleteExerciseDef = useStore((s) => s.deleteExerciseDef)

  const [search, setSearch] = useState('')
  const [form, setForm] = useState<FormState | null>(null)

  // 每次重新打开都回到"列表"这一层，不残留上次的新增/编辑表单
  useEffect(() => {
    if (open) setForm(null)
  }, [open])

  const categories = useMemo(() => Array.from(new Set(exercises.map((e) => e.category))), [exercises])
  const filtered = useMemo(() => {
    const q = search.trim()
    const list = q ? exercises.filter((e) => e.name.includes(q) || e.category.includes(q)) : exercises
    return [...list].sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name))
  }, [exercises, search])

  const openAdd = () => setForm({ ...emptyForm })
  const openEdit = (e: ExerciseDef) =>
    setForm({ id: e.id, name: e.name, category: e.category, met: String(e.met), pace: !!e.pace })

  const saveForm = () => {
    if (!form || !form.name.trim() || !form.met) return
    const item: ExerciseDef = {
      id: form.id ?? uid(),
      name: form.name.trim(),
      category: form.category.trim() || '自定义',
      met: Number(form.met) || 0,
      custom: true,
      pace: form.pace || undefined,
    }
    if (form.id) updateExerciseDef(form.id, item)
    else addExerciseDef(item)
    setForm(null)
  }

  return (
    <Dialog open={open} onClose={onClose} title="运动库">
      <div className="space-y-3">
        {form === null ? (
          <>
            <div className="flex gap-2">
              <Input placeholder="搜索运动 / 分类" value={search} onChange={(e) => setSearch(e.target.value)} />
              <Button onClick={openAdd}>
                <Plus size={16} /> 新增
              </Button>
            </div>
            <p className="text-[11px] text-gray-400">共 {exercises.length} 种运动 · 可新增自定义运动（MET 值）</p>
            <div className="max-h-[50vh] space-y-1 overflow-y-auto">
              {filtered.map((e) => (
                <div key={e.id} className="flex items-center justify-between rounded-lg px-2 py-2 hover:bg-gray-50">
                  <div>
                    <div className="text-sm text-gray-800">
                      {e.name}
                      {e.custom && <span className="ml-1 rounded bg-blue-50 px-1 text-[10px] text-blue-500">自定义</span>}
                    </div>
                    <div className="text-[11px] text-gray-400">
                      {e.category} · MET {e.met}
                      {e.pace && <span className="ml-1 text-blue-500">· 速度/坡度</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEdit(e)} className="rounded p-1.5 text-gray-400 hover:bg-gray-100" aria-label="编辑">
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => deleteExerciseDef(e.id)} className="rounded p-1.5 text-red-400 hover:bg-red-50" aria-label="删除">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-gray-700">{form.id ? '编辑运动' : '新增运动'}</h4>
              <button onClick={() => setForm(null)} className="rounded-full p-1 text-gray-400 hover:bg-gray-100">
                <X size={18} />
              </button>
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-500">运动名称</label>
              <Input placeholder="如：搏击操" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-500">分类</label>
              <Input placeholder="如有氧 / 自定义" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} list="ex-cats" />
              <datalist id="ex-cats">
                {categories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-500">MET 值（代谢当量）</label>
              <Input type="number" step={0.1} placeholder="静坐=1.0，跑步≈9.8" value={form.met} onChange={(e) => setForm({ ...form, met: e.target.value })} />
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input type="checkbox" checked={form.pace} onChange={(e) => setForm({ ...form, pace: e.target.checked })} />
              支持速度 / 坡度（走、快走、跑、爬坡类）
            </label>
            <p className="text-[11px] text-gray-400">
              {form.pace
                ? '勾选后记录时按「速度 + 坡度」用 ACSM 方程估算消耗，MET 值可忽略。'
                : '消耗 = MET × 体重(kg) × 时长(小时) × 强度系数'}
            </p>
            <div className="flex gap-2 pt-1">
              <Button className="flex-1" onClick={saveForm}>
                保存
              </Button>
              <Button variant="outline" onClick={() => setForm(null)}>
                取消
              </Button>
            </div>
          </div>
        )}
      </div>
    </Dialog>
  )
}
