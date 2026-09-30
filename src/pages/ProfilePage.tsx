import { useEffect, useRef, useState } from 'react'
import { Download, Trash2, Upload, Smartphone, Check, Sun, Moon, RefreshCw } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { BodyAnalysis } from '@/components/BodyAnalysis'
import { z } from 'zod'
import {
  ACTIVITY_LABELS,
  ACTIVITY_LEVELS,
  DailyLogSchema,
  FoodItemSchema,
  PlanItemSchema,
  GENDERS,
  GOALS,
  GOAL_LABELS,
  UserProfileSchema,
  type UserProfile,
} from '@/types'
import { useStore, type ExportData } from '@/store/useStore'
import { useToast } from '@/store/useToast'
import { AI_PRESETS, testAiConnection } from '@/utils/foodVision'
import { todayStr } from '@/utils/calc'

/** 导入数据的严格校验（防止非法/超大/损坏 JSON 污染本地数据） */
const ImportSchema = z.object({
  // 兼容旧备份：允许缺少 碳水/脂肪 目标（导入时按身体数据补算）
  profile: UserProfileSchema.extend({
    carbsTarget: z.number().min(0).optional(),
    fatTarget: z.number().min(0).optional(),
  }),
  logs: z.array(DailyLogSchema),
  foods: z.array(FoodItemSchema).optional(),
  exercises: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        met: z.number(),
        category: z.string(),
        custom: z.boolean().optional(),
        pace: z.boolean().optional(),
      }),
    )
    .optional(),
  plan: z.array(z.array(PlanItemSchema)).optional(),
})

const MAX_IMPORT_BYTES = 5 * 1024 * 1024 // 5MB 上限

export function ProfilePage() {
  const profile = useStore((s) => s.profile)
  const setProfile = useStore((s) => s.setProfile)
  const recalcTargets = useStore((s) => s.recalcTargets)
  const selectedDate = useStore((s) => s.selectedDate)
  const clearDay = useStore((s) => s.clearDay)
  const restoreDay = useStore((s) => s.restoreDay)
  const showToast = useToast((s) => s.show)
  const importData = useStore((s) => s.importData)
  const resetAll = useStore((s) => s.resetAll)
  const aiConfig = useStore((s) => s.aiConfig)
  const setAiConfig = useStore((s) => s.setAiConfig)
  const theme = useStore((s) => s.theme)
  const setTheme = useStore((s) => s.setTheme)

  const fileRef = useRef<HTMLInputElement>(null)
  const [msg, setMsg] = useState('')

  // PWA 安装
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState(false)
  const isIOS =
    typeof navigator !== 'undefined' &&
    /iPad|iPhone|iPod/.test(navigator.userAgent) &&
    !((window as { MSStream?: unknown }).MSStream)

  // AI 连通性自检
  const [aiTesting, setAiTesting] = useState(false)
  const [aiTestMsg, setAiTestMsg] = useState('')
  const handleTestAi = async () => {
    setAiTesting(true)
    setAiTestMsg('')
    try {
      setAiTestMsg(await testAiConnection(aiConfig))
    } catch (err) {
      setAiTestMsg((err as Error).message)
    } finally {
      setAiTesting(false)
    }
  }

  useEffect(() => {
    const onBeforeInstall = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }
    const onInstalled = () => setInstalled(true)
    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    await deferredPrompt.userChoice
    setDeferredPrompt(null)
  }

  const update = (patch: Partial<UserProfile>) => setProfile(patch)

  // 导出 JSON
  const handleExport = () => {
    const st = useStore.getState()
    const data: ExportData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      profile,
      logs: Object.values(st.logs),
      foods: st.foods,
      exercises: st.exercises,
      plan: st.plan,
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `health-managem-${todayStr()}.json`
    a.click()
    URL.revokeObjectURL(url)
    setMsg('已导出 JSON 文件')
  }

  // 导入 JSON（严格校验：类型/大小）
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > MAX_IMPORT_BYTES) {
      setMsg('导入失败：文件过大（上限 5MB）')
      e.target.value = ''
      return
    }
    if (!/\.json$/i.test(file.name) && file.type !== 'application/json') {
      setMsg('导入失败：请选择 .json 备份文件')
      e.target.value = ''
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const raw = JSON.parse(String(reader.result))
        const parsed = ImportSchema.safeParse(raw)
        if (!parsed.success) throw new Error('数据格式校验未通过（可能不是本应用的备份文件）')
        importData({ version: 1, exportedAt: new Date().toISOString(), ...parsed.data } as ExportData)
        setMsg('导入成功，数据已恢复')
      } catch (err) {
        setMsg('导入失败：' + (err as Error).message)
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const handleClearDay = () => {
    if (confirm(`确定清空 ${selectedDate} 当天的所有记录吗？`)) {
      const prev = useStore.getState().logs[selectedDate]
      clearDay(selectedDate)
      if (prev) showToast(`已清空 ${selectedDate} 的全部记录`, () => restoreDay(selectedDate, prev))
      setMsg(`已清空 ${selectedDate} 的数据`)
    }
  }

  const handleReset = () => {
    if (confirm('确定清空全部数据并恢复默认设置吗？此操作不可撤销。')) {
      resetAll()
      setMsg('已恢复默认设置')
    }
  }

  return (
    <div className="space-y-3">
      <BodyAnalysis profile={profile} />

      <Card>
        <h3 className="mb-3 text-sm font-semibold text-gray-700">外观</h3>
        <div className="flex rounded-lg bg-gray-100 p-1 text-sm">
          {(
            [
              ['light', '浅色', Sun],
              ['dark', '深色', Moon],
            ] as const
          ).map(([val, label, Icon]) => (
            <button
              key={val}
              onClick={() => setTheme(val)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 ${
                theme === val ? 'bg-white font-medium text-blue-600 shadow-sm' : 'text-gray-500'
              }`}
            >
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <h3 className="mb-3 text-sm font-semibold text-gray-700">身体资料</h3>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs text-gray-500">性别</label>
            <Select value={profile.gender} onChange={(e) => update({ gender: e.target.value as UserProfile['gender'] })}>
              <option value="male">男</option>
              <option value="female">女</option>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-gray-500">年龄</label>
              <Input type="number" min={1} value={profile.age} onChange={(e) => update({ age: Number(e.target.value) })} />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-500">身高 (cm)</label>
              <Input type="number" min={50} value={profile.height} onChange={(e) => update({ height: Number(e.target.value) })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-gray-500">体重 (kg)</label>
              <Input type="number" min={20} value={profile.weight} onChange={(e) => update({ weight: Number(e.target.value) })} />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-500">健身目标</label>
              <Select value={profile.goal} onChange={(e) => update({ goal: e.target.value as UserProfile['goal'] })}>
                {GOALS.map((g) => (
                  <option key={g} value={g}>
                    {GOAL_LABELS[g]}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-500">活动水平</label>
            <Select value={profile.activity} onChange={(e) => update({ activity: e.target.value as UserProfile['activity'] })}>
              {ACTIVITY_LEVELS.map((a) => (
                <option key={a} value={a}>
                  {ACTIVITY_LABELS[a]}
                </option>
              ))}
            </Select>
          </div>
          <p className="text-[11px] text-gray-400">
            修改以上信息会自动重算热量与蛋白质目标。BMR 用 Mifflin-St Jeor 公式，TDEE = BMR × 活动系数。
          </p>
        </div>
      </Card>

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">每日目标（可自定义）</h3>
          <Button variant="outline" size="sm" onClick={recalcTargets}>
            <RefreshCw size={14} /> 按身体数据重算
          </Button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs text-gray-500">热量目标（kcal）</label>
            <Input type="number" min={0} value={profile.calorieTarget} onChange={(e) => update({ calorieTarget: Number(e.target.value) })} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="mb-1 block text-xs text-gray-500">蛋白质（g）</label>
              <Input type="number" min={0} value={profile.proteinTarget} onChange={(e) => update({ proteinTarget: Number(e.target.value) })} />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-500">碳水（g）</label>
              <Input type="number" min={0} value={profile.carbsTarget} onChange={(e) => update({ carbsTarget: Number(e.target.value) })} />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-500">脂肪（g）</label>
              <Input type="number" min={0} value={profile.fatTarget} onChange={(e) => update({ fatTarget: Number(e.target.value) })} />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-500">睡眠目标（小时）</label>
            <Input type="number" min={0} step={0.5} value={profile.sleepTarget} onChange={(e) => update({ sleepTarget: Number(e.target.value) })} />
          </div>
          <p className="text-[11px] leading-relaxed text-gray-400">
            推荐算法：热量 = TDEE × 目标系数；蛋白质 1.6g/kg；脂肪占总热量 25%；碳水为剩余热量。改动上方身体资料会自动重算，也可点「按身体数据重算」或直接手改。
          </p>
        </div>
      </Card>

      <Card>
        <h3 className="mb-3 text-sm font-semibold text-gray-700">安装到本机</h3>
        {installed ? (
          <p className="flex items-center justify-center gap-1.5 text-sm text-green-600">
            <Check size={16} /> 已安装到本机，可离线使用
          </p>
        ) : deferredPrompt ? (
          <Button className="w-full" onClick={handleInstall}>
            <Smartphone size={16} /> 安装到桌面 / 主屏
          </Button>
        ) : isIOS ? (
          <p className="text-xs leading-relaxed text-gray-500">
            在 Safari 中点击底部「分享」按钮 → 选择「添加到主屏幕」即可安装为 App，可离线使用。
          </p>
        ) : (
          <p className="text-xs leading-relaxed text-gray-500">
            使用 Chrome / Edge 打开本应用，菜单中选择「安装应用」即可作为独立 App 使用（可离线访问）。
          </p>
        )}
      </Card>

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">AI 拍照识别设置</h3>
          <label className="flex cursor-pointer items-center gap-2 text-xs text-gray-500">
            <input
              type="checkbox"
              checked={aiConfig.enabled}
              onChange={(e) => setAiConfig({ enabled: e.target.checked })}
              className="h-4 w-4 accent-blue-600"
            />
            {aiConfig.enabled ? '已开启' : '未开启'}
          </label>
        </div>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs text-gray-500">API 地址（兼容 OpenAI 接口）</label>
            <Input
              value={aiConfig.baseUrl}
              onChange={(e) => setAiConfig({ baseUrl: e.target.value })}
              placeholder="https://api.openai.com/v1"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-500">API Key（仅保存在本机）</label>
            <Input
              type="password"
              value={aiConfig.apiKey}
              onChange={(e) => setAiConfig({ apiKey: e.target.value })}
              placeholder="sk-..."
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-500">视觉模型</label>
            <Input
              value={aiConfig.model}
              onChange={(e) => setAiConfig({ model: e.target.value })}
              placeholder="gpt-4o-mini"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-500">快捷选择服务商的接口与模型</label>
            <div className="flex flex-wrap gap-2">
              {AI_PRESETS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => setAiConfig({ baseUrl: p.baseUrl, model: p.model })}
                  className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-gray-600 hover:bg-gray-50"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleTestAi} disabled={aiTesting} className="shrink-0">
              {aiTesting ? '测试中…' : '测试连接'}
            </Button>
            {aiTestMsg && <span className="text-[11px] text-gray-500">{aiTestMsg}</span>}
          </div>
          <p className="text-[11px] leading-relaxed text-gray-400">
            开启后，在「饮食」页点击相机按钮即可拍照/上传，由视觉模型识别食物并估算热量。
            密钥仅存储于本机浏览器，不会上传到本应用服务器。可接入任何兼容 OpenAI 视觉接口的模型
            （OpenAI、Azure、本地 Ollama + 視觉模型、国内兼容网关等）。
          </p>
        </div>
      </Card>

      <Card>
        <h3 className="mb-3 text-sm font-semibold text-gray-700">数据管理</h3>
        <div className="space-y-2">
          <Button variant="outline" className="w-full" onClick={handleExport}>
            <Download size={16} /> 导出 JSON
          </Button>
          <Button variant="outline" className="w-full" onClick={() => fileRef.current?.click()}>
            <Upload size={16} /> 导入 JSON
          </Button>
          <input ref={fileRef} type="file" accept="application/json" hidden onChange={handleImport} />
          <Button variant="outline" className="w-full" onClick={handleClearDay}>
            <Trash2 size={16} /> 清空 {selectedDate} 当天数据
          </Button>
          <Button variant="destructive" className="w-full" onClick={handleReset}>
            恢复默认并清空全部
          </Button>
        </div>
        {msg && <p className="mt-2 text-center text-xs text-blue-500">{msg}</p>}
      </Card>

      <p className="px-1 text-center text-[11px] text-gray-400">health-managem · 所有数据仅保存在本机浏览器</p>
    </div>
  )
}
