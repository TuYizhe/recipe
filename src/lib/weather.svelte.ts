// 天气：Open-Meteo（免费、无需注册和密钥）。
// 位置优先用手机定位，拒绝了就让用户输入城市名。结果缓存 30 分钟。
import { getMeta, setMeta } from './db'

export interface Place { lat: number; lon: number; name: string }
export interface Weather { temp: number; code: number; max: number; min: number; at: number }

export const weather = $state({
  place: null as Place | null,
  now: null as Weather | null,
  status: 'idle' as 'idle' | 'loading' | 'ok' | 'denied' | 'error',
})

const CACHE = 'recipe-notes:weather'

export async function initWeather() {
  weather.place = await getMeta<Place | null>('place', null)
  if (!weather.place) return
  try {
    const c = JSON.parse(localStorage.getItem(CACHE) || 'null') as (Weather & { lat: number }) | null
    if (c && c.lat === weather.place.lat && Date.now() - c.at < 30 * 60 * 1000) {
      weather.now = c
      weather.status = 'ok'
      return
    }
  } catch {}
  await refresh()
}

async function refresh() {
  const p = weather.place
  if (!p) return
  weather.status = 'loading'
  try {
    const u = `https://api.open-meteo.com/v1/forecast?latitude=${p.lat}&longitude=${p.lon}&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=1`
    const d = await (await fetch(u)).json()
    weather.now = {
      temp: Math.round(d.current.temperature_2m),
      code: d.current.weather_code,
      max: Math.round(d.daily.temperature_2m_max[0]),
      min: Math.round(d.daily.temperature_2m_min[0]),
      at: Date.now(),
    }
    weather.status = 'ok'
    try { localStorage.setItem(CACHE, JSON.stringify({ ...weather.now, lat: p.lat })) } catch {}
  } catch {
    weather.status = 'error'
  }
}

async function setPlace(p: Place) {
  weather.place = p
  await setMeta('place', p)
  await refresh()
}

/** 用手机定位 */
export function locate(): Promise<boolean> {
  return new Promise((res) => {
    if (!navigator.geolocation) return res(false)
    weather.status = 'loading'
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        await setPlace({ lat: +pos.coords.latitude.toFixed(2), lon: +pos.coords.longitude.toFixed(2), name: '当前位置' })
        res(true)
      },
      () => {
        weather.status = 'denied'
        res(false)
      },
      { timeout: 8000, maximumAge: 3600_000 },
    )
  })
}

/** 按城市名查（支持中文） */
export async function setCity(name: string): Promise<boolean> {
  try {
    const d = await (await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name.trim())}&count=1&language=zh`)).json()
    const r = d.results?.[0]
    if (!r) return false
    await setPlace({ lat: +r.latitude.toFixed(2), lon: +r.longitude.toFixed(2), name: r.name })
    return true
  } catch {
    return false
  }
}

/** WMO 天气代码 → 中文 + 图标类型 */
export function describe(code: number): { text: string; icon: 'sun' | 'cloud' | 'rain' | 'snow' | 'fog' | 'storm' } {
  if (code === 0) return { text: '晴', icon: 'sun' }
  if (code <= 2) return { text: '多云', icon: 'cloud' }
  if (code === 3) return { text: '阴', icon: 'cloud' }
  if (code <= 48) return { text: '雾', icon: 'fog' }
  if (code <= 57) return { text: '毛毛雨', icon: 'rain' }
  if (code <= 67) return { text: code >= 65 ? '大雨' : '雨', icon: 'rain' }
  if (code <= 77) return { text: '雪', icon: 'snow' }
  if (code <= 82) return { text: '阵雨', icon: 'rain' }
  if (code <= 86) return { text: '阵雪', icon: 'snow' }
  return { text: '雷雨', icon: 'storm' }
}
