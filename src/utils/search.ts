/**
 * 中文搜索工具：支持「原文 / 全拼 / 首字母」匹配。
 * pinyin-pro 体积较大，这里**按需动态加载**（独立 chunk），不拖慢首屏；
 * 未加载完成时自动退化为纯文本匹配。
 */
type PinyinFn = (text: string, opts: { toneType: 'none'; type: 'array' }) => string[]

let converter: PinyinFn | null = null
let pending: Promise<void> | null = null
const cache = new Map<string, string>()

/**
 * 按需加载拼音库（首次搜索时调用）。返回 Promise，加载完成后可重新过滤一次。
 * 体积较大 → 独立 chunk，仅在真正用到搜索时才下载。
 */
export function loadPinyin(): Promise<void> {
  if (converter) return Promise.resolve()
  if (!pending) {
    pending = import('pinyin-pro')
      .then((m) => {
        converter = m.pinyin as unknown as PinyinFn
        cache.clear()
      })
      .catch(() => {
        /* 加载失败 → 退化为纯文本匹配 */
      })
  }
  return pending
}

/** 拼音库是否已就绪 */
export function pinyinReady(): boolean {
  return converter != null
}

/** 文本 → 全拼 + 首字母（小写、无声调） */
export function pinyinIndex(text: string): string {
  if (!converter || !text) return ''
  const hit = cache.get(text)
  if (hit != null) return hit
  let idx = ''
  try {
    const arr = converter(text, { toneType: 'none', type: 'array' })
    const full = arr.join('')
    const initials = arr.map((s) => (s ? s[0] : '')).join('')
    idx = `${full} ${initials}`.toLowerCase()
  } catch {
    idx = ''
  }
  cache.set(text, idx)
  return idx
}

/** 查询是否命中任一字段（原文包含，或拼音/首字母包含） */
export function matchesQuery(query: string, ...fields: (string | undefined)[]): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  for (const f of fields) {
    if (!f) continue
    if (f.toLowerCase().includes(q)) return true
    const py = pinyinIndex(f)
    if (py && py.includes(q)) return true
  }
  return false
}
