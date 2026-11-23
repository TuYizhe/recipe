<!--
  单页翻书组件：手指向左拖动，当前页绕左侧书脊翻起，露出下一页；向右拖动把上一页翻回来。
  只渲染当前页附近的几页，几百道菜也不卡。
-->
<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

const props = defineProps({
  count: { type: Number, required: true },
  modelValue: { type: Number, default: 0 }
})
const emit = defineEmits(['update:modelValue'])

const book = ref(null)
const dir = ref(0)          // 1 向后翻，-1 向前翻，0 静止
const progress = ref(0)     // 0..1
const animating = ref(false)
const DURATION = 520

const cur = computed(() => props.modelValue)

/* 每一页的状态：角度 + 层级 */
function leafState(i) {
  const c = cur.value
  if (dir.value === 1) {
    if (i === c) return { angle: -180 * progress.value, z: 3, turning: true }
    if (i === c + 1) return { angle: 0, z: 2, under: true }
  } else if (dir.value === -1) {
    if (i === c - 1) return { angle: -180 * (1 - progress.value), z: 3, turning: true }
    if (i === c) return { angle: 0, z: 2, under: true }
  } else if (i === c) {
    return { angle: 0, z: 2 }
  }
  return null
}

const visible = computed(() => {
  const out = []
  for (let i = cur.value - 1; i <= cur.value + 1; i++) {
    if (i < 0 || i >= props.count) continue
    const s = leafState(i)
    if (s) out.push({ index: i, ...s })
  }
  return out
})

const turnAngle = computed(() => visible.value.find(v => v.turning)?.angle ?? 0)
// 下层页上的投影：跟着翻起的页边缘移动
const shadowLeft = computed(() => `${Math.max(0, Math.cos((turnAngle.value * Math.PI) / 180)) * 100}%`)
const shadowOpacity = computed(() => Math.sin((-turnAngle.value * Math.PI) / 180) * 0.55)

/* ---------- 手势 ---------- */
let start = null, width = 1, moved = false

function onDown(e) {
  if (animating.value || e.button > 0) return
  start = { x: e.clientX, y: e.clientY, t: performance.now() }
  width = book.value.clientWidth
  moved = false
}
function onMove(e) {
  if (!start || animating.value) return
  const dx = e.clientX - start.x, dy = e.clientY - start.y
  if (!dir.value) {
    if (Math.abs(dx) < 10 || Math.abs(dx) < Math.abs(dy)) return
    const d = dx < 0 ? 1 : -1
    if ((d === 1 && cur.value >= props.count - 1) || (d === -1 && cur.value <= 0)) return
    dir.value = d
    moved = true
    book.value.setPointerCapture?.(e.pointerId)
  }
  const p = dir.value === 1 ? -dx : dx
  progress.value = Math.min(1, Math.max(0, p / (width * 0.85)))
}
function onUp(e) {
  if (!start) return
  const dt = performance.now() - start.t
  const dx = e.clientX - start.x
  start = null
  if (!dir.value) return
  const v = (dir.value === 1 ? -dx : dx) / dt // px/ms，正数表示朝翻页方向
  finish(progress.value > 0.33 || v > 0.45)
}

function finish(commit) {
  animating.value = true
  requestAnimationFrame(() => { progress.value = commit ? 1 : 0 })
  setTimeout(() => {
    const d = dir.value
    animating.value = false
    // 先切页再复位，避免闪一下
    if (commit) emit('update:modelValue', cur.value + d)
    dir.value = 0
    progress.value = 0
  }, DURATION)
}

// 拖动过就吞掉这次点击，防止误开菜谱
function onClickCapture(e) {
  if (moved) { e.stopPropagation(); e.preventDefault(); moved = false }
}

function turn(d) {
  if (animating.value || dir.value) return
  if ((d === 1 && cur.value >= props.count - 1) || (d === -1 && cur.value <= 0)) return
  dir.value = d
  progress.value = 0
  requestAnimationFrame(() => finish(true))
}
const next = () => turn(1)
const prev = () => turn(-1)

function onKey(e) {
  if (e.target.closest?.('input, textarea')) return
  if (e.key === 'ArrowRight') next()
  if (e.key === 'ArrowLeft') prev()
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))

defineExpose({ next, prev })
</script>

<template>
  <div ref="book" class="book" :class="{ animating }"
    @pointerdown="onDown" @pointermove="onMove" @pointerup="onUp" @pointercancel="onUp"
    @click.capture="onClickCapture">
    <div class="stack" aria-hidden="true">
      <i v-for="n in Math.min(4, Math.max(0, count - cur - 1))" :key="n" :style="{ '--n': n }"></i>
    </div>

    <div v-for="leaf in visible" :key="leaf.index" class="leaf"
      :class="{ turning: leaf.turning }"
      :style="{ transform: `rotateY(${leaf.angle}deg)`, zIndex: leaf.z, transitionDuration: animating ? DURATION + 'ms' : '0ms' }">
      <div class="face front">
        <slot name="page" :index="leaf.index" />
        <div class="spine"></div>
        <div v-if="leaf.turning" class="fold-shade" :style="{ opacity: -leaf.angle / 180 * 0.6 }"></div>
        <div v-if="leaf.under && dir" class="cast" :style="{ left: shadowLeft, opacity: shadowOpacity }"></div>
      </div>
      <div class="face back"></div>
    </div>
  </div>
</template>

<style scoped>
.book {
  position: relative; width: 100%; height: 100%;
  perspective: 2200px; perspective-origin: 0% 50%;
  touch-action: pan-y; user-select: none; -webkit-user-select: none;
}
.leaf {
  position: absolute; inset: 0; transform-origin: 0 50%; transform-style: preserve-3d;
  transition-property: transform; transition-timing-function: cubic-bezier(.3, .7, .3, 1);
  will-change: transform;
}
.face {
  position: absolute; inset: 0; backface-visibility: hidden; -webkit-backface-visibility: hidden;
  border-radius: 3px 10px 10px 3px; overflow: hidden;
  box-shadow: 0 18px 40px -18px rgba(0,0,0,.55), 0 2px 6px rgba(0,0,0,.18);
}
.back {
  transform: rotateY(180deg);
  background: linear-gradient(90deg, #e6dcc6, var(--page-bg) 40%, #e9e0cc);
}
.spine { /* 书脊处的压痕 */
  position: absolute; left: 0; top: 0; bottom: 0; width: 22px; pointer-events: none; z-index: 5;
  background: linear-gradient(90deg, rgba(0,0,0,.22), rgba(0,0,0,.06) 40%, transparent);
}
.fold-shade { position: absolute; inset: 0; pointer-events: none; z-index: 6;
  background: linear-gradient(90deg, transparent 30%, rgba(0,0,0,.5)); }
.cast { position: absolute; top: 0; bottom: 0; width: 60px; pointer-events: none; z-index: 6;
  background: linear-gradient(90deg, rgba(0,0,0,.45), transparent); }
.stack i { /* 右下方露出的书页厚度 */
  position: absolute; inset: 0; border-radius: 3px 10px 10px 3px;
  background: #efe6d2; box-shadow: 0 1px 2px rgba(0,0,0,.15);
  transform: translate(calc(var(--n) * 2.5px), calc(var(--n) * 2.5px));
  z-index: 0;
}
</style>
