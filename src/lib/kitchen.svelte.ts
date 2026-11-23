// 做菜模式用到的厨房工具：屏幕常亮 + 计时器 + 提醒音。
// 逻辑取自 recipe-jar 的 RecipeView（wake lock、单一 ticker、到点连续提醒），整理成独立模块。

/* ---------- 屏幕常亮 ---------- */
let sentinel: WakeLockSentinel | null = null
let wanted = false

async function acquire() {
  try {
    sentinel = await navigator.wakeLock.request('screen')
    sentinel.addEventListener('release', () => (sentinel = null))
  } catch {
    /* 不支持或被拒绝：不影响使用 */
  }
}
function onVisible() {
  if (wanted && !sentinel && document.visibilityState === 'visible') void acquire()
}
export function keepAwake(on: boolean) {
  if (!('wakeLock' in navigator)) return
  wanted = on
  if (on) {
    void acquire()
    document.addEventListener('visibilitychange', onVisible)
  } else {
    document.removeEventListener('visibilitychange', onVisible)
    sentinel?.release().catch(() => {})
    sentinel = null
  }
}

/* ---------- 计时器 ---------- */
export interface Timer {
  label: string
  total: number
  remaining: number
  running: boolean
  done: boolean
}

export const kitchen = $state({ timers: {} as Record<string, Timer>, alarming: false })

let audio: AudioContext | null = null
let ticker: ReturnType<typeof setInterval> | null = null
let alarmLeft = 0

function ensureAudio() {
  try {
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    audio ??= new Ctor()
    if (audio.state === 'suspended') void audio.resume()
  } catch {
    /* 没声音也能看倒计时 */
  }
}

function beep() {
  try {
    if (audio) {
      const now = audio.currentTime
      for (let i = 0; i < 3; i++) {
        const o = audio.createOscillator()
        const g = audio.createGain()
        o.frequency.value = 880
        o.connect(g)
        g.connect(audio.destination)
        const t = now + i * 0.3
        g.gain.setValueAtTime(0.0001, t)
        g.gain.exponentialRampToValueAtTime(0.3, t + 0.02)
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22)
        o.start(t)
        o.stop(t + 0.24)
      }
    }
  } catch {
    /* ignore */
  }
  navigator.vibrate?.([200, 100, 200, 100, 200])
}

function tick() {
  let anyRunning = false
  for (const k in kitchen.timers) {
    const t = kitchen.timers[k]
    if (!t.running) continue
    t.remaining -= 1
    if (t.remaining <= 0) {
      t.remaining = 0
      t.running = false
      t.done = true
      kitchen.alarming = true
      alarmLeft = 48 // 大约 2 分钟后自动停
    } else anyRunning = true
  }
  if (kitchen.alarming) {
    if (alarmLeft % 3 === 0) beep()
    alarmLeft -= 1
    if (alarmLeft <= 0) kitchen.alarming = false
  }
  if (!anyRunning && !kitchen.alarming && ticker) {
    clearInterval(ticker)
    ticker = null
  }
}

/** 点一下：开始 / 暂停；已响铃的点一下就静音并清掉 */
export function tapTimer(key: string, label: string, seconds: number) {
  ensureAudio()
  const t = kitchen.timers[key]
  if (t?.done) {
    delete kitchen.timers[key]
    kitchen.alarming = Object.values(kitchen.timers).some((x) => x.done)
    return
  }
  if (!t) kitchen.timers[key] = { label, total: seconds, remaining: seconds, running: true, done: false }
  else t.running = !t.running
  ticker ??= setInterval(tick, 1000)
}

export function clearTimers() {
  kitchen.timers = {}
  kitchen.alarming = false
  if (ticker) clearInterval(ticker)
  ticker = null
}
