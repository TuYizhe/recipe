// 首页随节日 / 节气换装。节日优先，其余日子跟二十四节气走。

export const SOLAR_TERMS: [number, number, string][] = [
  [1, 5, '小寒'], [1, 20, '大寒'], [2, 4, '立春'], [2, 19, '雨水'],
  [3, 5, '惊蛰'], [3, 20, '春分'], [4, 4, '清明'], [4, 20, '谷雨'],
  [5, 5, '立夏'], [5, 21, '小满'], [6, 5, '芒种'], [6, 21, '夏至'],
  [7, 7, '小暑'], [7, 22, '大暑'], [8, 7, '立秋'], [8, 23, '处暑'],
  [9, 7, '白露'], [9, 23, '秋分'], [10, 8, '寒露'], [10, 23, '霜降'],
  [11, 7, '立冬'], [11, 22, '小雪'], [12, 7, '大雪'], [12, 21, '冬至'],
]

export function solarTerm(d = new Date()): { index: number; name: string } {
  const m = d.getMonth() + 1, day = d.getDate()
  let idx = 23
  SOLAR_TERMS.forEach(([tm, td], i) => {
    if (m > tm || (m === tm && day >= td)) idx = i
  })
  return { index: idx, name: SOLAR_TERMS[idx][2] }
}

export type ThemeId = 'christmas' | 'solar'

export interface Theme {
  id: ThemeId
  /** 封面上的大字 */
  title: string
  /** 封面小英文 */
  en: string
  /** 角落的小印章 */
  seal: string
  /** 印章 / 点缀色 */
  accent: string
  /** 封面底色 */
  coverBg: string
  coverInk: string
  /** 菜品海报轮换的柔和底色 */
  tones: string[]
  snow: boolean
}

const SEASON_TONES = {
  spring: { name: '春', en: 'SPRING', accent: '#5f8f5a', bg: '#dfe8d6', tones: ['#dfe8d6', '#e9e3c9', '#f0dcd6', '#d9e4e2', '#e6e0ee'] },
  summer: { name: '夏', en: 'SUMMER', accent: '#2f7f86', bg: '#d6e7e6', tones: ['#d6e7e6', '#efe2bf', '#f1d8cc', '#dbe3ef', '#e3ecd5'] },
  autumn: { name: '秋', en: 'AUTUMN', accent: '#b56a2c', bg: '#efe1cd', tones: ['#efe1cd', '#e6dccb', '#ecd5c8', '#dfe0cf', '#e8dccf'] },
  winter: { name: '冬', en: 'WINTER', accent: '#44607e', bg: '#e1e5ea', tones: ['#e1e5ea', '#e8e1d8', '#e4dde6', '#dde5df', '#ece3d6'] },
}

function seasonOf(i: number) {
  if (i >= 2 && i < 8) return SEASON_TONES.spring
  if (i >= 8 && i < 14) return SEASON_TONES.summer
  if (i >= 14 && i < 20) return SEASON_TONES.autumn
  return SEASON_TONES.winter
}

const inRange = (d: Date, from: [number, number], to: [number, number]) => {
  const v = (d.getMonth() + 1) * 100 + d.getDate()
  return v >= from[0] * 100 + from[1] && v <= to[0] * 100 + to[1]
}

export function resolveTheme(choice: 'auto' | ThemeId, d = new Date()): Theme {
  const id: ThemeId = choice !== 'auto' ? choice : inRange(d, [11, 22], [12, 26]) ? 'christmas' : 'solar'
  if (id === 'christmas') {
    return {
      id,
      title: '冬日菜单',
      en: 'MERRY CHRISTMAS',
      seal: '圣诞',
      accent: '#b0302c',
      coverBg: '#efe8dc',
      coverInk: '#1d2a22',
      // 低饱和的圣诞色：松绿、浆果、奶油、雪灰、肉桂
      tones: ['#dfe6dc', '#f0ddd6', '#ece4d3', '#e2e4e6', '#eadbcd'],
      snow: true,
    }
  }
  const term = solarTerm(d)
  const s = seasonOf(term.index)
  return {
    id,
    title: term.name,
    en: `${s.en} · SOLAR TERM`,
    seal: s.name,
    accent: s.accent,
    coverBg: s.bg,
    coverInk: '#1c1c1a',
    tones: s.tones,
    snow: false,
  }
}
