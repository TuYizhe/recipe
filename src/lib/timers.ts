// Find cook times inside a step ("simmer 20 minutes", "bake 1 hour 30 min",
// "rest 20–25 minutes") so each can become a tappable kitchen timer. Kept
// deliberately strict — a missed timer is fine, a false one on "180°C" is not.

export interface StepTimer {
  /** Human label shown on the idle chip, e.g. "20 min", "1 h 30 min", "20–25 min". */
  label: string
  /** Countdown length in seconds (lower bound for ranges). */
  seconds: number
}

// Order matters: hour+minute combo, then ranges, then a single value.
const RE = new RegExp(
  '(\\d+)\\s*(?:hours?|hrs?)\\s*(?:and\\s+)?(\\d+)\\s*(?:minutes?|mins?)' + // 1,2  "1 hour 30 minutes"
    '|(\\d+)\\s*(?:-|–|—|to)\\s*(\\d+)\\s*(hours?|hrs?|minutes?|mins?|seconds?|secs?)' + // 3,4,5  "20–25 min"
    '|(\\d+)\\s*(?:more\\s+|additional\\s+|further\\s+|extra\\s+)?(hours?|hrs?|minutes?|mins?|seconds?|secs?)', // 6,7  "20 minutes"
  'gi'
)

function unitFactor(u: string): number {
  const c = u[0].toLowerCase()
  return c === 'h' ? 3600 : c === 'm' ? 60 : 1
}

function unitLabel(u: string): string {
  const c = u[0].toLowerCase()
  return c === 'h' ? 'h' : c === 'm' ? 'min' : 'sec'
}

const MAX_SECONDS = 24 * 3600

// 中文时长："3分钟"、"1小时20分钟"、"30秒"、"半小时"、"5-8分钟"
const CN_RE = /(\d+)\s*(?:个)?小时\s*(\d+)\s*分(?:钟)?|(\d+)\s*[-~～到至]\s*(\d+)\s*(小时|分钟|分|秒)|(\d+(?:\.\d+)?|半)\s*(?:个)?(小时|分钟|分|秒)/g

function cnFactor(u: string) {
  return u === '小时' ? 3600 : u === '秒' ? 1 : 60
}
function cnLabel(n: number | string, u: string) {
  return `${n}${u === '分' ? '分钟' : u}`
}

/** 从中文文字里找计时 */
export function extractCnTimers(text: string): StepTimer[] {
  const out: StepTimer[] = []
  for (const m of text.matchAll(CN_RE)) {
    if (m[1] && m[2]) {
      const h = +m[1], min = +m[2]
      out.push({ label: `${h}小时${min}分钟`, seconds: h * 3600 + min * 60 })
    } else if (m[3] && m[4] && m[5]) {
      out.push({ label: `${m[3]}-${cnLabel(m[4], m[5])}`, seconds: +m[3] * cnFactor(m[5]) })
    } else if (m[6] && m[7]) {
      const n = m[6] === '半' ? 0.5 : +m[6]
      out.push({ label: m[6] === '半' ? `半${m[7]}` : cnLabel(m[6], m[7]), seconds: Math.round(n * cnFactor(m[7])) })
    }
  }
  return out.filter((t) => t.seconds > 0 && t.seconds <= MAX_SECONDS)
}

/** All cook timers detected in a step, in reading order. Empty if none. */
export function extractStepTimers(text: string): StepTimer[] {
  const cn = extractCnTimers(text)
  if (cn.length) return cn
  const out: StepTimer[] = []
  for (const m of text.matchAll(RE)) {
    if (m[1] && m[2]) {
      const h = parseInt(m[1], 10)
      const min = parseInt(m[2], 10)
      out.push({ label: `${h} h ${min} min`, seconds: h * 3600 + min * 60 })
    } else if (m[3] && m[4] && m[5]) {
      const lo = parseInt(m[3], 10)
      const hi = parseInt(m[4], 10)
      out.push({ label: `${lo}–${hi} ${unitLabel(m[5])}`, seconds: lo * unitFactor(m[5]) })
    } else if (m[6] && m[7]) {
      const n = parseInt(m[6], 10)
      out.push({ label: `${n} ${unitLabel(m[7])}`, seconds: n * unitFactor(m[7]) })
    }
  }
  return out.filter((t) => t.seconds > 0 && t.seconds <= MAX_SECONDS)
}

/** Seconds → clock string: "2:00", "25:00", "1:30:00". */
export function formatClock(total: number): string {
  const s = Math.max(0, Math.floor(total))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`
}
