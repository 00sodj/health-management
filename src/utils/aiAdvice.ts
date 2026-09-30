import type { AiConfig, UserProfile } from '@/types'
import type { DailySummary } from '@/utils/calc'

export interface AiAdvicePayload {
  summary: DailySummary
  profile: UserProfile
  week: DailySummary[]
  /** 今日训练计划完成情况（可选） */
  planText?: string
}

function fmtDay(s: DailySummary, label: string): string {
  const q = s.sleepQuality != null ? `/质${s.sleepQuality}` : ''
  return `${label} 摄入${s.intakeKcal}kcal 运动${s.exerciseKcal}kcal 睡眠${s.sleepHours}h${q} 饮水${s.waterMl}ml`
}

function buildPrompt(p: AiAdvicePayload): string {
  const { summary: s, profile: u } = p
  const last = p.week.length - 1
  const weekTxt = p.week.map((d, i) => fmtDay(d, i === last ? '今天' : `前${last - i}天`)).join('\n')
  const goalMap: Record<string, string> = { lose: '减脂', maintain: '维持', gain: '增肌' }
  return [
    '【用户资料】',
    `性别${u.gender === 'male' ? '男' : '女'}，${u.age}岁，身高${u.height}cm，体重${u.weight}kg，目标：${goalMap[u.goal] ?? u.goal}`,
    `BMI ${s.analysis.bmi}（${s.analysis.bmiLabel}），体脂率约 ${s.analysis.bodyFat ?? '—'}%，基础代谢 ${s.analysis.bmr} kcal，日常总消耗 ${s.analysis.tdee} kcal`,
    '',
    '【今日】',
    `摄入 ${s.intakeKcal} kcal（目标 ${s.calorieTarget}）｜运动消耗 ${s.exerciseKcal} kcal｜净热量 ${s.netKcal} kcal`,
    `蛋白质 ${s.protein}/${s.proteinTarget} g｜碳水 ${s.carbs} g｜脂肪 ${s.fat} g`,
    `睡眠 ${s.sleepHours} h（目标 ${s.sleepTarget}，质量 ${s.sleepQuality ?? '—'}/5）｜饮水 ${s.waterMl}/${s.waterTarget} ml`,
    p.planText ? `训练计划：${p.planText}` : '',
    '',
    '【近 7 天】',
    weekTxt,
  ]
    .filter(Boolean)
    .join('\n')
}

/**
 * 根据已有数据调用 AI 生成个性化建议。
 * 复用「AI 拍照识别设置」里的接口/密钥/模型（视觉模型同样能处理纯文本对话）。
 * @returns 建议正文（纯文本，含换行）
 */
export async function generateAiAdvice(config: AiConfig, payload: AiAdvicePayload): Promise<string> {
  if (!config.enabled) throw new Error('AI 未启用：请先在「我的 → AI 拍照识别设置」里开启')
  if (!config.apiKey.trim()) throw new Error('缺少 API Key：请先在「我的 → AI 拍照识别设置」里填写')
  if (!config.baseUrl.trim() || !config.model.trim()) throw new Error('请先在「我的 → AI 拍照识别设置」里填写接口地址与模型')

  const url = `${config.baseUrl.replace(/\/$/, '')}/chat/completions`
  const system =
    '你是一位资深的健康与运动管理教练。请基于用户数据给出**具体、可执行**的建议：' +
    '3~5 条，每条一行、以「• 」开头、不超过 40 字，先给结论再给做法；' +
    '最后另起一行写一句总体评价（以「总结：」开头）。' +
    '只做生活方式建议，不做医疗诊断；不要复述原始数字。'

  const body = {
    model: config.model,
    temperature: 0.5,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: buildPrompt(payload) },
    ],
  }

  let resp: Response
  try {
    resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.apiKey.trim()}` },
      body: JSON.stringify(body),
    })
  } catch {
    throw new Error('网络请求失败（Failed to fetch）：请检查「AI 拍照识别设置」里的地址是否可访问')
  }

  if (!resp.ok) {
    let detail = ''
    try {
      const err = (await resp.json()) as { error?: { message?: string }; message?: string }
      detail = err.error?.message ?? err.message ?? ''
    } catch {
      /* ignore */
    }
    throw new Error(`AI 建议请求失败 (${resp.status})${detail ? '：' + detail : ''}`)
  }

  const data = (await resp.json()) as { choices?: { message?: { content?: string } }[] }
  const content = data.choices?.[0]?.message?.content
  if (!content || !content.trim()) throw new Error('模型未返回内容，请重试')
  return content.trim()
}
