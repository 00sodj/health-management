import type { AiConfig, DetectedFood } from '@/types'

/** 常用兼容网关预设（baseUrl + 默认视觉模型，Key 由用户填写）。免费/国内可直连的排在前面。 */
export const AI_PRESETS: { label: string; baseUrl: string; model: string }[] = [
  {
    label: '硅基流动 Qwen3-VL（免费）',
    baseUrl: 'https://api.siliconflow.cn/v1',
    model: 'Qwen/Qwen3-VL-8B-Instruct',
  },
  { label: '智谱 GLM-4V-Flash（免费）', baseUrl: 'https://open.bigmodel.cn/api/paas/v4', model: 'glm-4v-flash' },
  { label: '本地 Ollama（免费离线）', baseUrl: 'http://localhost:11434/v1', model: 'llava:latest' },
  { label: 'OpenAI', baseUrl: 'https://api.openai.com/v1', model: 'gpt-4o-mini' },
  {
    label: '阿里云百炼（通义千问 VL）',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    model: 'qwen2.5-vl-72b-instruct',
  },
]

/**
 * 将图片文件读取为 base64 data URL（用于传给视觉模型）。
 */
function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('图片读取失败'))
    reader.readAsDataURL(file)
  })
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('图片解码失败'))
    img.src = src
  })
}

/**
 * 读取图片并**压缩**后再转 data URL：长边压到 1024px、JPEG 质量 0.85。
 * 手机原图常有数 MB，base64 后更大，容易导致请求体过大 / 连接被重置（表现为 Failed to fetch）。
 */
async function fileToCompressedDataUrl(file: File, maxDim = 1024, quality = 0.85): Promise<string> {
  const raw = await fileToDataUrl(file)
  try {
    const img = await loadImage(raw)
    const w0 = img.naturalWidth || img.width
    const h0 = img.naturalHeight || img.height
    const longest = Math.max(w0, h0) || maxDim
    const scale = Math.min(1, maxDim / longest)
    if (scale >= 1 && file.size <= 900 * 1024) return raw // 本来就小，直接用
    const w = Math.max(1, Math.round(w0 * scale))
    const h = Math.max(1, Math.round(h0 * scale))
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) return raw
    ctx.drawImage(img, 0, 0, w, h)
    const out = canvas.toDataURL('image/jpeg', quality)
    return out.length < raw.length ? out : raw
  } catch {
    return raw // 解码失败则退回原图
  }
}

/** 从模型自由文本/JSON 中尽量解析出 DetectedFood[] */
function parseDetectedFoods(raw: string): DetectedFood[] {
  // 去掉可能的 markdown 代码块包裹
  let text = raw.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim()

  // 尝试直接 JSON
  const tryParse = (s: string): unknown => JSON.parse(s)

  let obj: unknown
  try {
    obj = tryParse(text)
  } catch {
    // 退而求其次：在文本中找第一个 [ 到最后一个 ] 的数组
    const start = text.indexOf('[')
    const end = text.lastIndexOf(']')
    if (start >= 0 && end > start) {
      try {
        obj = tryParse(text.slice(start, end + 1))
      } catch {
        obj = null
      }
    }
  }
  if (!obj) return []

  const arr: unknown[] = Array.isArray(obj) ? obj : (obj as { foods?: unknown[] }).foods ?? []
  const out: DetectedFood[] = []
  for (const item of arr) {
    if (!item || typeof item !== 'object') continue
    const f = item as Record<string, unknown>
    const num = (v: unknown) => {
      const n = Number(v)
      return Number.isFinite(n) && n >= 0 ? n : 0
    }
    const name = String(f.name ?? f.食物 ?? '').trim()
    if (!name) continue
    const conf = String(f.confidence ?? f.置信度 ?? '').toLowerCase()
    const confidence: DetectedFood['confidence'] =
      conf.includes('high') || conf.includes('高')
        ? 'high'
        : conf.includes('low') || conf.includes('低')
          ? 'low'
          : 'medium'
    out.push({
      name,
      grams: num(f.grams ?? f.重量 ?? f.克),
      kcal: num(f.kcal ?? f.热量 ?? f.卡路里),
      protein: num(f.protein ?? f.蛋白 ?? f.蛋白质),
      carbs: num(f.carbs ?? f.碳水),
      fat: num(f.fat ?? f.脂肪),
      confidence,
    })
  }
  return out
}

/**
 * 调用兼容 OpenAI 接口的视觉模型，识别图片中的食物与营养。
 * @returns 识别到的食物列表（按热量从高到低排序）
 */
export async function analyzeFoodImage(
  file: File,
  config: AiConfig,
  profile?: { gender: string; age: number; height: number; weight: number },
): Promise<DetectedFood[]> {
  if (!config.enabled) throw new Error('拍照识别未启用，请先在「我的 → AI 设置」中开启并填写密钥')
  if (!config.apiKey.trim()) throw new Error('缺少 API Key，请先在「我的 → AI 设置」中填写')
  if (!config.baseUrl.trim()) throw new Error('缺少 API 地址')

  const dataUrl = await fileToCompressedDataUrl(file)
  const url = `${config.baseUrl.replace(/\/$/, '')}/chat/completions`

  const profileHint = profile
    ? `用户资料：性别${profile.gender === 'male' ? '男' : '女'}，年龄${profile.age}岁，身高${profile.height}cm，体重${profile.weight}kg。请结合餐具大小、常见份量合理估算重量。`
    : ''

  const systemPrompt = [
    '你是专业的营养师与食物识别助手。请识别图片中所有可见的食物与饮品，',
    '对每一种给出尽可能准确的中文名称、估算重量（克）、热量（kcal）以及蛋白质/碳水/脂肪（克）。',
    '若无法确定，请给出最合理的估算并标注较低置信度。仅输出 JSON，不要任何解释文字。',
    'JSON 格式：{"foods":[{"name":"食物名","grams":0,"kcal":0,"protein":0,"carbs":0,"fat":0,"confidence":"high"}]}。',
    profileHint,
  ].join('')

  const body = {
    model: config.model,
    temperature: 0.2,
    messages: [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: [
          { type: 'text', text: '请识别这张图片里的食物并估算营养。' },
          { type: 'image_url', image_url: { url: dataUrl } },
        ],
      },
    ],
    response_format: { type: 'json_object' },
  }

  let resp: Response
  try {
    resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey.trim()}`,
      },
      body: JSON.stringify(body),
    })
  } catch {
    throw new Error(
      '网络请求失败（Failed to fetch）。可能原因：' +
        '①「API 地址」填错或不可访问（注意是否少了 /v1）；' +
        '②该接口不允许浏览器跨域直连（CORS 被拒）；' +
        '③本页是 https 而接口是 http（被浏览器按混合内容拦截）；' +
        '④网络不通。可在设置里点「测试连接」排查。',
    )
  }

  if (!resp.ok) {
    let detail = ''
    try {
      const err = (await resp.json()) as { error?: { message?: string } }
      detail = err.error?.message ?? ''
    } catch {
      /* ignore */
    }
    throw new Error(`识别失败 (${resp.status})${detail ? '：' + detail : ''}`)
  }

  const data = (await resp.json()) as {
    choices?: { message?: { content?: string } }[]
  }
  const content = data.choices?.[0]?.message?.content
  if (!content) throw new Error('模型未返回内容')
  const foods = parseDetectedFoods(content)
  if (foods.length === 0) throw new Error('未能从图片中识别出食物，请换一张更清晰的照片')
  return foods.sort((a, b) => b.kcal - a.kcal)
}

/**
 * 连通性自检：向 {baseUrl}/models 发一个轻量 GET，用于区分
 * 「地址/CORS/混合内容」问题 与 「模型名/密钥」问题。
 * @returns 人类可读的结果描述
 */
export async function testAiConnection(config: AiConfig): Promise<string> {
  if (!config.baseUrl.trim()) throw new Error('请先填写 API 地址')
  const url = `${config.baseUrl.replace(/\/$/, '')}/models`
  let resp: Response
  try {
    resp = await fetch(url, {
      method: 'GET',
      headers: config.apiKey.trim() ? { Authorization: `Bearer ${config.apiKey.trim()}` } : {},
    })
  } catch {
    throw new Error(
      '连不上（Failed to fetch）：地址错误 / 接口不允许浏览器跨域(CORS) / https 页面调 http 接口。' +
        '请核对地址，或换用支持浏览器直连的网关。',
    )
  }
  if (resp.status === 401 || resp.status === 403) return `能连通，但密钥无效或无权限（HTTP ${resp.status}）`
  if (!resp.ok) return `能连通，但接口返回 HTTP ${resp.status}`

  // 进一步校验「模型名」是否存在（这一项能提前发现 Model does not exist）
  let ids: string[] = []
  try {
    const data = (await resp.json()) as { data?: { id?: string }[]; models?: { id?: string }[] }
    ids = (data.data ?? data.models ?? []).map((m) => m.id).filter((x): x is string => typeof x === 'string')
  } catch {
    /* 接口未返回模型列表则跳过校验 */
  }
  const model = config.model.trim()
  if (ids.length > 0 && model && !ids.includes(model)) {
    const vls = ids.filter((i) => /vl|vision|glm-4v|internvl/i.test(i)).slice(0, 5)
    return `接口可访问，但模型名「${model}」不在服务列表里。${vls.length ? '可用的视觉模型示例：' + vls.join('、') : ''}`
  }
  return ids.length > 0 ? '连接成功，接口可访问，模型有效 ✅' : '连接成功，接口可访问 ✅'
}
