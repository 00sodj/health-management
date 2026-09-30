import { useEffect, useMemo, useRef, useState } from 'react'
import { Camera, Check, Loader2, Plus } from 'lucide-react'
import { Dialog } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { MEAL_LABELS, MEAL_TYPES, type DetectedFood, type MealEntry, type MealType } from '@/types'
import { buildMealEntry, calcMealNutrients, uid } from '@/utils/calc'
import { loadPinyin, pinyinReady, matchesQuery } from '@/utils/search'
import { analyzeFoodImage } from '@/utils/foodVision'
import { useStore } from '@/store/useStore'

interface Props {
  open: boolean
  onClose: () => void
  date: string
  mealType: MealType
  editEntry?: MealEntry | null
}

export function AddMealDialog({ open, onClose, date, mealType, editEntry }: Props) {
  const foods = useStore((s) => s.foods)
  const addMeal = useStore((s) => s.addMeal)
  const updateMeal = useStore((s) => s.updateMeal)
  const addFood = useStore((s) => s.addFood)
  const aiConfig = useStore((s) => s.aiConfig)
  const profile = useStore((s) => s.profile)

  const [mode, setMode] = useState<'food' | 'manual'>('food')
  const [search, setSearch] = useState('')
  const [pickedId, setPickedId] = useState<string>('')
  const [curMeal, setCurMeal] = useState<MealType>(mealType)
  const [quantity, setQuantity] = useState<number>(1)
  const [unit, setUnit] = useState<string>('')

  const [mName, setMName] = useState('')
  const [mKcal, setMKcal] = useState<number>(0)
  const [mP, setMP] = useState<number>(0)
  const [mC, setMC] = useState<number>(0)
  const [mF, setMF] = useState<number>(0)

  // 拍照识别
  const photoRef = useRef<HTMLInputElement>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [detected, setDetected] = useState<DetectedFood[]>([])
  const [gramsAdj, setGramsAdj] = useState<number[]>([]) // 识别结果可手动修正重量
  const [addedIdx, setAddedIdx] = useState<number[]>([])
  const [savedIdx, setSavedIdx] = useState<number[]>([])
  const [analyzeError, setAnalyzeError] = useState('')

  // 编辑态：回填
  useEffect(() => {
    if (!open) return
    if (editEntry) {
      setCurMeal(editEntry.mealType)
      if (editEntry.isManual) {
        setMode('manual')
        setMName(editEntry.name)
        setMKcal(editEntry.kcal)
        setMP(editEntry.protein)
        setMC(editEntry.carbs)
        setMF(editEntry.fat)
      } else {
        setMode('food')
        const food = foods.find((f) => f.name === editEntry.name)
        if (food) {
          setPickedId(food.id)
          setUnit(editEntry.unit)
          setQuantity(editEntry.quantity)
        }
      }
    } else {
      setMode('food')
      setSearch('')
      setPickedId('')
      setCurMeal(mealType)
      setQuantity(1)
      setUnit('')
      setMName('')
      setMKcal(0)
      setMP(0)
      setMC(0)
      setMF(0)
      setDetected([])
      setGramsAdj([])
      setAddedIdx([])
      setSavedIdx([])
      setAnalyzeError('')
      setAnalyzing(false)
    }
  }, [open, editEntry, mealType])

  const picked = pickedId ? foods.find((f) => f.id === pickedId) : undefined

  // 打开弹窗时按需加载拼音库，加载完成后触发一次重新过滤
  const [pyVer, setPyVer] = useState(0)
  useEffect(() => {
    if (!open || pinyinReady()) return
    loadPinyin().then(() => setPyVer((v) => v + 1))
  }, [open])

  const filtered = useMemo(
    () => foods.filter((f) => matchesQuery(search, f.name, f.category)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [search, foods, pyVer],
  )

  const preview = picked ? calcMealNutrients(picked, quantity || 0, unit || picked.defaultUnit) : null

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAnalyzing(true)
    setAnalyzeError('')
    setDetected([])
    setAddedIdx([])
    try {
      const res = await analyzeFoodImage(file, aiConfig, profile)
      setDetected(res)
      setGramsAdj(res.map((d) => d.grams))
    } catch (err) {
      setAnalyzeError((err as Error).message)
    } finally {
      setAnalyzing(false)
    }
    e.target.value = ''
  }

  /** 按可编辑的克数，对识别结果做等比缩放 */
  const scaledFood = (d: DetectedFood, idx: number) => {
    const g = gramsAdj[idx] ?? d.grams
    const base = d.grams > 0 ? d.grams : g
    const f = base > 0 ? g / base : 1
    const round1 = (n: number) => Math.round(n * 10) / 10
    return {
      grams: Math.round(g),
      kcal: Math.round(d.kcal * f),
      protein: round1(d.protein * f),
      carbs: round1(d.carbs * f),
      fat: round1(d.fat * f),
    }
  }

  const addDetected = (d: DetectedFood, idx: number) => {
    const s = scaledFood(d, idx)
    const entry = buildMealEntry({
      mealType: curMeal,
      name: d.name,
      quantity: 1,
      unit: '份',
      grams: s.grams,
      kcal: s.kcal,
      protein: s.protein,
      carbs: s.carbs,
      fat: s.fat,
      isManual: true,
    })
    addMeal(date, entry)
    setAddedIdx((prev) => [...prev, idx])
  }

  const saveDetectedToLibrary = (d: DetectedFood, idx: number) => {
    const s = scaledFood(d, idx)
    if (s.grams <= 0) return
    const f = 100 / s.grams
    const round1 = (n: number) => Math.round(n * 10) / 10
    addFood({
      id: uid(),
      name: d.name,
      category: 'AI识别',
      per100g: {
        kcal: Math.round(s.kcal * f),
        protein: round1(s.protein * f),
        carbs: round1(s.carbs * f),
        fat: round1(s.fat * f),
      },
      units: [
        { name: 'g', grams: 1 },
        { name: '份', grams: s.grams },
      ],
      defaultUnit: 'g',
      custom: true,
    })
    setSavedIdx((prev) => [...prev, idx])
  }

  const handleAdd = () => {
    if (mode === 'food' && picked) {
      const u = unit || picked.defaultUnit
      const n = calcMealNutrients(picked, quantity || 0, u)
      const entry = buildMealEntry({
        mealType: curMeal,
        name: picked.name,
        quantity: quantity || 0,
        unit: u,
        grams: n.grams,
        kcal: n.kcal,
        protein: n.protein,
        carbs: n.carbs,
        fat: n.fat,
      })
      editEntry ? updateMeal(date, editEntry.id, entry) : addMeal(date, entry)
    } else {
      const entry = buildMealEntry({
        mealType: curMeal,
        name: mName.trim() || '手动记录',
        quantity: 1,
        unit: '份',
        grams: 0,
        kcal: mKcal || 0,
        protein: mP || 0,
        carbs: mC || 0,
        fat: mF || 0,
        isManual: true,
      })
      editEntry ? updateMeal(date, editEntry.id, entry) : addMeal(date, entry)
    }
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} title={editEntry ? '编辑饮食' : '添加饮食'}>
      <div className="space-y-3">
        {/* 拍照识别入口 */}
        <button
          onClick={() => photoRef.current?.click()}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-blue-300 bg-blue-50 py-2.5 text-sm font-medium text-blue-600"
        >
          <Camera size={18} />
          {analyzing ? '识别中…' : '拍照 / 上传图片，自动识别食物热量'}
        </button>
        <input ref={photoRef} type="file" accept="image/*" capture="environment" hidden onChange={handlePhoto} />

        {analyzing && (
          <div className="flex items-center justify-center gap-2 py-2 text-sm text-gray-500">
            <Loader2 size={16} className="animate-spin" /> 正在调用视觉模型识别…
          </div>
        )}

        {analyzeError && (
          <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{analyzeError}</div>
        )}

        {detected.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-500">
              识别结果（「添加」记入 {MEAL_LABELS[curMeal]}，「存库」可加入食物库复用）
            </p>
            {detected.map((d, i) => {
              const s = scaledFood(d, i)
              return (
              <div key={i} className="rounded-lg border border-gray-100 bg-gray-50 p-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="text-sm font-medium text-gray-800">
                    {d.name}
                    <span
                      className={`ml-1.5 rounded px-1 py-0.5 text-[10px] ${
                        d.confidence === 'high'
                          ? 'bg-green-100 text-green-600'
                          : d.confidence === 'low'
                            ? 'bg-amber-100 text-amber-600'
                            : 'bg-blue-100 text-blue-600'
                      }`}
                    >
                      {d.confidence === 'high' ? '高置信' : d.confidence === 'low' ? '低置信' : '中置信'}
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    {savedIdx.includes(i) ? (
                      <span className="flex items-center gap-1 text-[11px] text-green-600">
                        <Check size={12} /> 已存库
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => saveDetectedToLibrary(d, i)}
                        disabled={s.grams <= 0}
                        title={s.grams <= 0 ? '缺少重量，无法换算每100g营养' : '加入食物库'}
                      >
                        存库
                      </Button>
                    )}
                    {addedIdx.includes(i) ? (
                      <span className="flex items-center gap-1 text-[11px] text-green-600">
                        <Check size={12} /> 已添加
                      </span>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => addDetected(d, i)}>
                        <Plus size={14} /> 添加
                      </Button>
                    )}
                  </div>
                </div>
                <div className="mt-1 grid grid-cols-4 gap-1 text-center text-[11px] text-gray-500">
                  <div>
                    {s.kcal}
                    <div className="text-[9px] text-gray-400">kcal</div>
                  </div>
                  <div>
                    {s.protein}g
                    <div className="text-[9px] text-gray-400">蛋白</div>
                  </div>
                  <div>
                    {s.carbs}g
                    <div className="text-[9px] text-gray-400">碳水</div>
                  </div>
                  <div>
                    {s.fat}g
                    <div className="text-[9px] text-gray-400">脂肪</div>
                  </div>
                </div>
                <div className="mt-1 flex items-center gap-1 text-[10px] text-gray-400">
                  <span>约</span>
                  <input
                    type="number"
                    min={0}
                    value={gramsAdj[i] ?? d.grams}
                    onChange={(e) => {
                      const v = Number(e.target.value)
                      setGramsAdj((prev) => {
                        const nx = [...prev]
                        nx[i] = v
                        return nx
                      })
                    }}
                    className="w-16 rounded border border-gray-200 px-1 py-0.5 text-center text-[11px] text-gray-700"
                  />
                  <span>克（可改，营养按比例更新）</span>
                </div>
              </div>
              )
            })}
          </div>
        )}

        <Select value={curMeal} onChange={(e) => setCurMeal(e.target.value as MealType)}>
          {MEAL_TYPES.map((m) => (
            <option key={m} value={m}>
              {MEAL_LABELS[m]}
            </option>
          ))}
        </Select>

        {/* 模式切换 */}
        <div className="flex rounded-lg bg-gray-100 p-1 text-sm">
          {(['food', 'manual'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 rounded-md py-1.5 ${mode === m ? 'bg-white font-medium text-blue-600 shadow-sm' : 'text-gray-500'}`}
            >
              {m === 'food' ? '从食物库选' : '手动输入'}
            </button>
          ))}
        </div>

        {mode === 'food' ? (
          <>
            <Input placeholder="搜索：鸡蛋 / jidan / jd 都行" value={search} onChange={(e) => setSearch(e.target.value)} />
            <div className="max-h-48 space-y-1 overflow-y-auto">
              {filtered.map((f) => (
                <button
                  key={f.id}
                  onClick={() => {
                    setPickedId(f.id)
                    setUnit(f.defaultUnit)
                  }}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm ${
                    pickedId === f.id ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'
                  }`}
                >
                  <span>
                    {f.name}
                    <span className="ml-1 text-xs text-gray-400">{f.category}</span>
                  </span>
                  <span className="text-xs text-gray-400">{f.per100g.kcal} kcal/100g</span>
                </button>
              ))}
              {filtered.length === 0 && <p className="py-4 text-center text-sm text-gray-400">没有找到该食物</p>}
            </div>

            {picked && (
              <div className="rounded-lg bg-gray-50 p-3">
                <div className="mb-2 flex items-center gap-2">
                  <Input
                    type="number"
                    min={0}
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-20"
                  />
                  <Select value={unit || picked.defaultUnit} onChange={(e) => setUnit(e.target.value)} className="flex-1">
                    {picked.units.map((u) => (
                      <option key={u.name} value={u.name}>
                        {u.name}
                      </option>
                    ))}
                  </Select>
                </div>
                {preview && (
                  <div className="grid grid-cols-4 gap-1 text-center text-xs">
                    <div className="text-gray-500">
                      {preview.kcal}
                      <div className="text-[10px] text-gray-400">kcal</div>
                    </div>
                    <div className="text-gray-500">
                      {preview.protein}
                      <div className="text-[10px] text-gray-400">蛋白g</div>
                    </div>
                    <div className="text-gray-500">
                      {preview.carbs}
                      <div className="text-[10px] text-gray-400">碳水g</div>
                    </div>
                    <div className="text-gray-500">
                      {preview.fat}
                      <div className="text-[10px] text-gray-400">脂肪g</div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="space-y-2">
            <Input placeholder="食物名称（如：外卖奶茶）" value={mName} onChange={(e) => setMName(e.target.value)} />
            <Input type="number" min={0} placeholder="热量 kcal" value={mKcal} onChange={(e) => setMKcal(Number(e.target.value))} />
            <div className="grid grid-cols-3 gap-2">
              <Input type="number" min={0} placeholder="蛋白 g" value={mP} onChange={(e) => setMP(Number(e.target.value))} />
              <Input type="number" min={0} placeholder="碳水 g" value={mC} onChange={(e) => setMC(Number(e.target.value))} />
              <Input type="number" min={0} placeholder="脂肪 g" value={mF} onChange={(e) => setMF(Number(e.target.value))} />
            </div>
          </div>
        )}

        <Button className="w-full" onClick={handleAdd} disabled={mode === 'food' ? !picked : mKcal <= 0}>
          {editEntry ? '保存' : '添加'}
        </Button>
      </div>
    </Dialog>
  )
}
