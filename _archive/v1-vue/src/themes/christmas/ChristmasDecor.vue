<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue'
const canvas = ref(null)
let raf, flakes = [], w, h, dpr

function resize() {
  const c = canvas.value
  dpr = Math.min(2, window.devicePixelRatio || 1)
  w = c.clientWidth; h = c.clientHeight
  c.width = w * dpr; c.height = h * dpr
  const n = Math.round((w * h) / 9000)
  flakes = Array.from({ length: n }, () => ({
    x: Math.random() * w, y: Math.random() * h,
    r: Math.random() * 2.2 + .6, s: Math.random() * .5 + .25, d: Math.random() * Math.PI * 2
  }))
}
function tick() {
  const ctx = canvas.value.getContext('2d')
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, w, h)
  ctx.fillStyle = 'rgba(255,255,255,.85)'
  for (const f of flakes) {
    f.y += f.s; f.d += .01; f.x += Math.sin(f.d) * .3
    if (f.y > h + 4) { f.y = -4; f.x = Math.random() * w }
    ctx.globalAlpha = .35 + f.r / 4
    ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2); ctx.fill()
  }
  raf = requestAnimationFrame(tick)
}
onMounted(() => {
  resize(); window.addEventListener('resize', resize)
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) tick()
})
onBeforeUnmount(() => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) })
</script>

<template>
  <canvas ref="canvas" class="snow" aria-hidden="true"></canvas>
  <div class="lights" aria-hidden="true">
    <span v-for="i in 14" :key="i" :style="{ '--i': i }"></span>
  </div>
</template>

<style scoped>
.snow { position: fixed; inset: 0; width: 100%; height: 100%; pointer-events: none; z-index: 0; }
.lights {
  position: fixed; top: 0; left: 0; right: 0; height: 26px; z-index: 1; pointer-events: none;
  display: flex; justify-content: space-around; align-items: flex-start;
  background: radial-gradient(60% 18px at 50% 0, rgba(0,0,0,.25), transparent);
}
.lights::before { /* 电线 */
  content: ''; position: absolute; left: -5%; right: -5%; top: -14px; height: 28px;
  border-bottom: 1px solid rgba(246,236,214,.25); border-radius: 0 0 50% 50%;
}
.lights span {
  width: 6px; height: 9px; border-radius: 50% 50% 45% 45%; margin-top: calc(6px + (var(--i) * 7 % 8) * 1px);
  background: hsl(calc(var(--i) * 47), 80%, 65%);
  box-shadow: 0 0 10px 2px hsl(calc(var(--i) * 47), 90%, 60%);
  animation: twinkle 2.4s ease-in-out infinite; animation-delay: calc(var(--i) * -.37s);
}
@keyframes twinkle { 50% { opacity: .35; box-shadow: none; } }
@media (prefers-reduced-motion: reduce) { .lights span { animation: none; } }
</style>
