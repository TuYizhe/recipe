export function daysAgoText(ts) {
  if (!ts) return '还没做过'
  const days = Math.floor((startOfDay(Date.now()) - startOfDay(ts)) / 86400000)
  if (days <= 0) return '今天刚做过'
  if (days === 1) return '昨天做过'
  if (days < 30) return `${days} 天前做过`
  if (days < 365) return `${Math.floor(days / 30)} 个月前做过`
  return `${Math.floor(days / 365)} 年多前做过`
}
const startOfDay = t => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime() }

export function formatDate(ts) {
  const d = new Date(ts)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

export function sourceInfo(url) {
  if (!url) return null
  const u = url.toLowerCase()
  if (u.includes('bilibili.com') || u.includes('b23.tv')) return { name: 'B站', color: '#fb7299' }
  if (u.includes('xiaohongshu.com') || u.includes('xhslink.com')) return { name: '小红书', color: '#ff2442' }
  return { name: '网页', color: '#5c5852' }
}

/** 从分享文案里提取链接（B站/小红书分享出来的通常是“标题 + 链接”） */
export function extractUrl(text) {
  const m = (text || '').match(/https?:\/\/[^\s，。]+/)
  return m ? m[0] : (text || '').trim()
}

const TINTS = ['var(--tint-1)', 'var(--tint-2)', 'var(--tint-3)', 'var(--tint-4)', 'var(--tint-5)']
export function tintFor(str = '') {
  let h = 0
  for (const c of str) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return TINTS[h % TINTS.length]
}

export function latestLog(r) {
  if (!r?.logs?.length) return null
  return [...r.logs].sort((a, b) => b.date - a.date)[0]
}
