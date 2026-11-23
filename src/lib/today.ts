// 首页"今日"信息：农历、节日倒数、今天吃什么
import type { SavedRecipe } from './db'
import { SOLAR_TERMS, solarTerm } from './season'

const DAY = ['初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
  '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
  '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十']

export function lunar(d = new Date()): string {
  try {
    const parts = new Intl.DateTimeFormat('zh-CN-u-ca-chinese', { year: 'numeric', month: 'long', day: 'numeric' }).formatToParts(d)
    const get = (t: string) => parts.find((p) => p.type === t)?.value ?? ''
    const day = parseInt(get('day'), 10)
    return `农历${get('month')}${DAY[day - 1] ?? get('day')} · ${get('yearName')}年`
  } catch {
    return ''
  }
}

export const WEEK = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
export const MONTH_EN = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
export const MONTH_CN = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']

const daysUntil = (m: number, d: number, from = new Date()) => {
  const today = new Date(from.getFullYear(), from.getMonth(), from.getDate())
  let target = new Date(from.getFullYear(), m - 1, d)
  if (target < today) target = new Date(from.getFullYear() + 1, m - 1, d)
  return Math.round((target.getTime() - today.getTime()) / 86400000)
}

/** 圣诞季倒数圣诞，其余时候倒数下一个节气 */
export function countdown(themeId: string, d = new Date()): string {
  if (themeId === 'christmas') {
    const n = daysUntil(12, 25, d)
    return n === 0 ? '今天是圣诞节' : `距圣诞还有 ${n} 天`
  }
  const next = SOLAR_TERMS[(solarTerm(d).index + 1) % 24]
  const n = daysUntil(next[0], next[1], d)
  return n === 0 ? `今天${next[2]}` : `距${next[2]}还有 ${n} 天`
}

/** 本月做了几次 */
export function cookedThisMonth(list: SavedRecipe[], d = new Date()): number {
  const start = new Date(d.getFullYear(), d.getMonth(), 1).getTime()
  return list.reduce((n, e) => n + (e.logs ?? []).filter((l) => l.date >= start).length, 0)
}

/**
 * 今天吃什么：天冷或下雨推荐汤和炖菜，天热推荐凉菜，
 * 否则推荐最久没做（或从没做过）的那道。
 */
export function todaysPick(list: SavedRecipe[], temp: number | null, rainy: boolean): { index: number; reason: string } | null {
  if (!list.length) return null
  const stale = (e: SavedRecipe) => (e.lastCooked ? e.lastCooked : 0)
  const byStale = list.map((e, index) => ({ e, index })).sort((a, b) => stale(a.e) - stale(b.e))
  const warm = (e: SavedRecipe) => e.recipe.tags.includes('汤羹') || /汤|炖|煲|粥|锅/.test(e.title)
  const cool = (e: SavedRecipe) => e.recipe.tags.includes('凉菜') || /凉|拌|冰/.test(e.title)

  if (temp !== null && (temp <= 12 || rainy)) {
    const hit = byStale.find((x) => warm(x.e))
    if (hit) return { index: hit.index, reason: rainy ? `下雨天，来一碗${hit.e.title}` : `${temp}°，天冷喝碗${hit.e.title}` }
  }
  if (temp !== null && temp >= 28) {
    const hit = byStale.find((x) => cool(x.e))
    if (hit) return { index: hit.index, reason: `${temp}°，吃点清爽的${hit.e.title}` }
  }
  const top = byStale[0]
  if (!top.e.lastCooked) return { index: top.index, reason: `${top.e.title}，记下来还没做过` }
  const days = Math.floor((Date.now() - top.e.lastCooked) / 86400000)
  return { index: top.index, reason: days >= 7 ? `${days} 天没做${top.e.title}了` : `再做一次${top.e.title}？` }
}
