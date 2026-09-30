import { Activity, Droplets, Flame, Target } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { ProgressRing } from '@/components/ProgressRing'
import { analyzeBody } from '@/utils/calc'
import { type UserProfile } from '@/types'

const GENDER_LABEL: Record<UserProfile['gender'], string> = { male: '男', female: '女' }

const bmiColor: Record<string, string> = {
  low: 'text-blue-600',
  normal: 'text-green-600',
  over: 'text-amber-600',
  obese: 'text-red-600',
}

/** 综合身体分析卡片：BMI / 体脂 / 理想体重 / BMR / TDEE / 饮水目标（结合性别、年龄、身高、体重） */
export function BodyAnalysis({ profile }: { profile: UserProfile }) {
  const a = analyzeBody(profile)
  const bmiOfTarget = Math.min(a.bmi / 24, 1) // 以 24 为满格参考
  return (
    <Card>
      <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-gray-700">
        <Activity size={16} className="text-blue-500" /> 身体分析
        <span className="ml-auto text-[11px] font-normal text-gray-400">
          {GENDER_LABEL[profile.gender]} · {profile.age}岁 · {profile.height}cm · {profile.weight}kg
        </span>
      </h3>

      <div className="flex items-center gap-4">
        <ProgressRing value={a.bmi} max={24} size={104} stroke={11} label="BMI" />
        <div className="flex-1 space-y-2">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900">{a.bmi}</span>
            <span className={`text-sm font-medium ${bmiColor[a.bmiLevel]}`}>{a.bmiLabel}</span>
          </div>
          <div className="text-xs text-gray-500">
            理想体重 <span className="font-semibold text-gray-700">{a.idealMin}-{a.idealMax}kg</span>
          </div>
          {a.bodyFat !== null && (
            <div className="text-xs text-gray-500">
              估算体脂率 <span className="font-semibold text-gray-700">{a.bodyFat}%</span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-center text-xs">
        <div className="rounded-lg bg-gray-50 py-2">
          <div className="flex items-center justify-center gap-1 text-gray-400">
            <Flame size={12} /> 基础代谢
          </div>
          <div className="font-semibold text-gray-800">{a.bmr} kcal</div>
        </div>
        <div className="rounded-lg bg-gray-50 py-2">
          <div className="flex items-center justify-center gap-1 text-gray-400">
            <Flame size={12} /> 每日消耗 TDEE
          </div>
          <div className="font-semibold text-gray-800">{a.tdee} kcal</div>
        </div>
        <div className="rounded-lg bg-gray-50 py-2">
          <div className="flex items-center justify-center gap-1 text-gray-400">
            <Target size={12} /> 热量目标
          </div>
          <div className="font-semibold text-gray-800">{profile.calorieTarget} kcal</div>
        </div>
        <div className="rounded-lg bg-gray-50 py-2">
          <div className="flex items-center justify-center gap-1 text-gray-400">
            <Droplets size={12} /> 饮水目标
          </div>
          <div className="font-semibold text-gray-800">{a.waterTargetMl} ml</div>
        </div>
      </div>
      <p className="mt-2 text-[11px] leading-relaxed text-gray-400">
        BMI / 体脂率为估算值，仅供参考，不能作为诊断依据。
      </p>
    </Card>
  )
}
