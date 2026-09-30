import { useEffect, useMemo, useState } from 'react'
import { Pencil, Plus, Trash2, X } from 'lucide-react'
import { Dialog } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useStore } from '@/store/useStore'
import { uid } from '@/utils/calc'
import { loadPinyin, pinyinReady, matchesQuery } from '@/utils/search'
import type { FoodItem } from '@/types'

interface Props {
  open: boolean
  onClose: () => void
}

interface FormState {
  id: string | null
  name: string
  category: string
  kcal: string
  protein: string
  carbs: string
  fat: string
  unitName: string
  unitGrams: string
}

const emptyForm: FormState = { id: null, name: '', category: '', kcal: '', protein: '', carbs: '', fat: '', unitName: '', unitGrams: '' }

export function FoodLibraryDialog({ open, onClose }: Props) {
  const foods = useStore((s) => s.foods)
  const addFood = useStore((s) => s.addFood)
  const updateFood = useStore((s) => s.updateFood)
  const deleteFood = useStore((s) => s.deleteFood)

  const [search, setSearch] = useState('')
  const [cat, setCat] = useState('全部')
  const [form, setForm] = useState<FormState | null>(null)

  const categories = useMemo(
    () => ['全部', ...Array.from(new Set(foods.map((f) => f.category)))],
    [foods],
  )
  // 打开弹窗时按需加载拼音库，加载完成后重新过滤
  const [pyVer, setPyVer] = useState(0)
  useEffect(() => {
    if (!open || pinyinReady()) return
    loadPinyin().then(() => setPyVer((v) => v + 1))
  }, [open])

  // 每次重新打开都回到"列表"这一层，不残留上次的新增/编辑表单
  useEffect(() => {
    if (open) setForm(null)
  }, [open])

  const filtered = useMemo(() => {
    const base = cat === '全部' ? foods : foods.filter((f) => f.category === cat)
    const list = base.filter((f) => matchesQuery(search, f.name, f.category))
    return [...list].sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [foods, search, cat, pyVer])

  const openAdd = () => setForm({ ...emptyForm })
  const openEdit = (f: FoodItem) =>
    setForm({
      id: f.id,
      name: f.name,
      category: f.category,
      kcal: String(f.per100g.kcal),
      protein: String(f.per100g.protein),
      carbs: String(f.per100g.carbs),
      fat: String(f.per100g.fat),
      unitName: f.units[1]?.name ?? '',
      unitGrams: f.units[1]?.grams ? String(f.units[1].grams) : '',
    })

  const saveForm = () => {
    if (!form || !form.name.trim()) return
    const per100g = {
      kcal: Number(form.kcal) || 0,
      protein: Number(form.protein) || 0,
      carbs: Number(form.carbs) || 0,
      fat: Number(form.fat) || 0,
    }
    const units = [{ name: 'g', grams: 1 }]
    if (form.unitName.trim()) {
      units.push({ name: form.unitName.trim(), grams: Number(form.unitGrams) || 1 })
    }
    const item: FoodItem = {
      id: form.id ?? uid(),
      name: form.name.trim(),
      category: form.category.trim() || '自定义',
      per100g,
      units,
      defaultUnit: units[1]?.name ?? 'g',
      custom: true,
    }
    if (form.id) updateFood(form.id, item)
    else addFood(item)
    setForm(null)
  }

  return (
    <Dialog open={open} onClose={onClose} title="食物库">
      <div className="space-y-3">
        {form === null ? (
          <>
            <div className="flex gap-2">
              <Input placeholder="搜索食物 / 拼音 / 首字母" value={search} onChange={(e) => setSearch(e.target.value)} />
              <Button onClick={openAdd}>
                <Plus size={16} /> 新增
              </Button>
            </div>
            <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setCat(c)}
                  className={`shrink-0 rounded-full px-2.5 py-1 text-xs ${
                    cat === c ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-gray-400">
              共 {foods.length} 种 · 当前显示 {filtered.length} 种 · 预设可修改，也可新增自定义食物与分类
            </p>
            <div className="max-h-[50vh] space-y-1 overflow-y-auto">
              {filtered.map((f) => (
                <div key={f.id} className="flex items-center justify-between rounded-lg px-2 py-2 hover:bg-gray-50">
                  <div>
                    <div className="text-sm text-gray-800">
                      {f.name}
                      {f.custom && <span className="ml-1 rounded bg-blue-50 px-1 text-[10px] text-blue-500">自定义</span>}
                    </div>
                    <div className="text-[11px] text-gray-400">
                      {f.category} · {f.per100g.kcal} kcal/100g
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEdit(f)} className="rounded p-1.5 text-gray-400 hover:bg-gray-100" aria-label="编辑">
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => deleteFood(f.id)} className="rounded p-1.5 text-red-400 hover:bg-red-50" aria-label="删除">
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
              <h4 className="text-sm font-semibold text-gray-700">{form.id ? '编辑食物' : '新增食物'}</h4>
              <button onClick={() => setForm(null)} className="rounded-full p-1 text-gray-400 hover:bg-gray-100">
                <X size={18} />
              </button>
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-500">食物名称</label>
              <Input placeholder="如：自制鸡胸沙拉" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-500">分类</label>
              <Input placeholder="如：家常菜 / 自定义" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} list="food-cats" />
              <datalist id="food-cats">
                {categories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
            <div>
              <p className="mb-1 text-xs text-gray-500">每 100 克营养素</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block text-[11px] text-gray-400">热量（kcal）</label>
                  <Input type="number" placeholder="如 160" value={form.kcal} onChange={(e) => setForm({ ...form, kcal: e.target.value })} />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] text-gray-400">蛋白质（g）</label>
                  <Input type="number" placeholder="如 13" value={form.protein} onChange={(e) => setForm({ ...form, protein: e.target.value })} />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] text-gray-400">碳水（g）</label>
                  <Input type="number" placeholder="如 2.5" value={form.carbs} onChange={(e) => setForm({ ...form, carbs: e.target.value })} />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] text-gray-400">脂肪（g）</label>
                  <Input type="number" placeholder="如 11" value={form.fat} onChange={(e) => setForm({ ...form, fat: e.target.value })} />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-xs text-gray-500">常用单位（可选）</label>
                <Input placeholder="如 个 / 碗 / 份" value={form.unitName} onChange={(e) => setForm({ ...form, unitName: e.target.value })} />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-500">每单位克数</label>
                <Input type="number" placeholder="如 10" value={form.unitGrams} onChange={(e) => setForm({ ...form, unitGrams: e.target.value })} />
              </div>
            </div>
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
