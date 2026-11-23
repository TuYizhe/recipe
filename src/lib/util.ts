export function daysAgo(ts?: number | null): string {
  if (!ts) return '还没做过'
  const day = (t: number) => {
    const d = new Date(t)
    d.setHours(0, 0, 0, 0)
    return d.getTime()
  }
  const n = Math.round((day(Date.now()) - day(ts)) / 86400000)
  if (n <= 0) return '今天做过'
  if (n === 1) return '昨天做过'
  if (n < 30) return `${n} 天前做过`
  if (n < 365) return `${Math.floor(n / 30)} 个月前做过`
  return `${Math.floor(n / 365)} 年前做过`
}

export const fmtDate = (ts: number) => {
  const d = new Date(ts)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

export function sourceName(url: string): string | null {
  if (!url) return null
  if (/bilibili\.com|b23\.tv/i.test(url)) return 'B站'
  if (/xiaohongshu\.com|xhslink\.com/i.test(url)) return '小红书'
  return '原网页'
}

/** B站 / 小红书的分享文案里通常是"标题 + 链接"，把链接挑出来 */
export function pickUrl(text: string): string {
  const m = (text || '').match(/https?:\/\/[^\s，。]+/)
  return m ? m[0] : (text || '').trim()
}

export const CATEGORY_EN: Record<string, string> = {
  家常菜: 'HOME STYLE', 下饭菜: 'WITH RICE', 快手菜: 'QUICK', 汤羹: 'SOUP', 凉菜: 'COLD DISH', 主食: 'STAPLE', 早餐: 'BREAKFAST', 甜品: 'DESSERT',
}

export function hashPick<T>(s: string, list: T[]): T {
  let h = 0
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return list[h % list.length]
}

/* ---------- 用量合并（买菜清单）：1 小勺 + 半小勺 = 1.5 小勺 ---------- */
const CN: Record<string, number> = { 半: 0.5, 一: 1, 两: 2, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10 }

export function parseAmount(a: string): { qty: number; unit: string } | null {
  const m = a.trim().match(/^(\d+(?:\.\d+)?|[半一两二三四五六七八九十])\s*(.*)$/)
  if (!m) return null
  const qty = CN[m[1]] ?? parseFloat(m[1])
  return isFinite(qty) ? { qty, unit: m[2].trim() } : null
}

export function mergeAmounts(list: string[]): string {
  const byUnit = new Map<string, number>()
  const free: string[] = []
  for (const a of list.filter(Boolean)) {
    const p = parseAmount(a)
    if (p) byUnit.set(p.unit, (byUnit.get(p.unit) ?? 0) + p.qty)
    else if (!free.includes(a)) free.push(a)
  }
  const nums = [...byUnit].map(([u, q]) => `${+q.toFixed(2)}${u ? ' ' + u : ''}`)
  return [...nums, ...free].join(' + ')
}
