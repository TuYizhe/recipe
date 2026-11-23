import { computed } from 'vue'
import { settings } from '../db'
import ChristmasCover from './christmas/ChristmasCover.vue'
import ChristmasDecor from './christmas/ChristmasDecor.vue'
import ChristmasCorner from './christmas/ChristmasCorner.vue'
import SolarCover from './solar/SolarCover.vue'

/* 二十四节气（公历近似日期，误差 ±1 天，足够用于换皮肤） */
export const SOLAR_TERMS = [
  [1, 5, '小寒'], [1, 20, '大寒'], [2, 4, '立春'], [2, 19, '雨水'],
  [3, 5, '惊蛰'], [3, 20, '春分'], [4, 4, '清明'], [4, 20, '谷雨'],
  [5, 5, '立夏'], [5, 21, '小满'], [6, 5, '芒种'], [6, 21, '夏至'],
  [7, 7, '小暑'], [7, 22, '大暑'], [8, 7, '立秋'], [8, 23, '处暑'],
  [9, 7, '白露'], [9, 23, '秋分'], [10, 8, '寒露'], [10, 23, '霜降'],
  [11, 7, '立冬'], [11, 22, '小雪'], [12, 7, '大雪'], [12, 21, '冬至']
]

export function currentSolarTerm(date = new Date()) {
  const m = date.getMonth() + 1, d = date.getDate()
  let idx = SOLAR_TERMS.length - 1 // 1月5日前仍属冬至
  SOLAR_TERMS.forEach(([tm, td], i) => { if (m > tm || (m === tm && d >= td)) idx = i })
  return { index: idx, name: SOLAR_TERMS[idx][2] }
}

const SEASONS = {
  spring: { name: '春', en: 'Spring', bg: '#e9efe1', ink: '#2f4a32', accent: '#6f9a62', deep: '#3e6b45' },
  summer: { name: '夏', en: 'Summer', bg: '#e6f0ee', ink: '#173f45', accent: '#e0794f', deep: '#1f6b73' },
  autumn: { name: '秋', en: 'Autumn', bg: '#f3eadb', ink: '#4a2e17', accent: '#c7792f', deep: '#8a4b1f' },
  winter: { name: '冬', en: 'Winter', bg: '#e7ebf0', ink: '#1d2a3a', accent: '#7c93ad', deep: '#2c3e55' }
}
function seasonOf(termIndex) {
  // 立春=2 … 立夏=8 … 立秋=14 … 立冬=20
  if (termIndex >= 2 && termIndex < 8) return 'spring'
  if (termIndex >= 8 && termIndex < 14) return 'summer'
  if (termIndex >= 14 && termIndex < 20) return 'autumn'
  return 'winter'
}

/* 节日主题：优先于节气。月日区间 [起, 止]（含） */
const FESTIVALS = [
  { id: 'christmas', from: [11, 22], to: [12, 26] }
]

const inRange = (date, [fm, fd], [tm, td]) => {
  const v = (date.getMonth() + 1) * 100 + date.getDate()
  return v >= fm * 100 + fd && v <= tm * 100 + td
}

export const THEMES = {
  christmas: {
    id: 'christmas',
    name: '圣诞',
    vars: {
      '--home-bg': 'radial-gradient(120% 80% at 50% 0%, #2c4a36 0%, #142a1e 55%, #0c1a12 100%)',
      '--home-ink': '#f6ecd6',
      '--page-bg': '#f8f1e2',
      '--page-ink': '#2a1a14',
      '--page-muted': '#8a7562',
      '--accent': '#9b1c1c',
      '--accent-2': '#1f4a33',
      '--gold': '#c8a35a'
    },
    cover: ChristmasCover,
    decor: ChristmasDecor,
    corner: ChristmasCorner
  },
  solar: {
    id: 'solar',
    name: '节气',
    dynamic(date) {
      const term = currentSolarTerm(date)
      const s = SEASONS[seasonOf(term.index)]
      return {
        term, season: s,
        vars: {
          '--home-bg': s.bg,
          '--home-ink': s.ink,
          '--page-bg': '#fbf9f4',
          '--page-ink': s.ink,
          '--page-muted': s.accent,
          '--accent': s.deep,
          '--accent-2': s.accent,
          '--gold': s.accent
        }
      }
    },
    cover: SolarCover,
    decor: null,
    corner: null
  }
}

export function resolveTheme(date = new Date(), choice = 'auto') {
  let id = choice
  if (choice === 'auto') {
    id = FESTIVALS.find(f => inRange(date, f.from, f.to))?.id || 'solar'
  }
  const t = THEMES[id] || THEMES.solar
  const extra = t.dynamic ? t.dynamic(date) : {}
  return { ...t, ...extra, vars: { ...t.vars, ...(extra.vars || {}) }, term: extra.term || currentSolarTerm(date) }
}

export const activeTheme = computed(() => resolveTheme(new Date(), settings.theme))
