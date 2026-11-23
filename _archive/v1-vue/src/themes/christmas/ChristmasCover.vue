<script setup>
defineProps({ count: Number })
const year = new Date().getFullYear()

// 花环叶子：两圈交错的椭圆叶片
const leaves = []
for (let ring = 0; ring < 2; ring++) {
  const n = 28
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + ring * 0.11
    const r = 86 + (ring ? 12 : -2)
    leaves.push({
      x: 120 + Math.cos(a) * r,
      y: 120 + Math.sin(a) * r,
      rot: (a * 180) / Math.PI + (ring ? 60 : 120),
      fill: ring ? '#2f6b47' : '#1d4a31'
    })
  }
}
const berries = Array.from({ length: 9 }, (_, i) => {
  const a = (i / 9) * Math.PI * 2 + 0.4
  return { x: 120 + Math.cos(a) * 92, y: 120 + Math.sin(a) * 92 }
})
</script>

<template>
  <div class="xmas-cover">
    <div class="frame"><div class="frame-inner"></div></div>

    <header>
      <span class="cap">WINTER MENU · {{ year }}</span>
    </header>

    <div class="center">
    <svg class="wreath" viewBox="0 0 240 240" aria-hidden="true">
      <ellipse v-for="(l, i) in leaves" :key="i" :cx="l.x" :cy="l.y" rx="15" ry="6.5"
        :fill="l.fill" :transform="`rotate(${l.rot} ${l.x} ${l.y})`" />
      <circle v-for="(b, i) in berries" :key="'b' + i" :cx="b.x" :cy="b.y" r="5.5" fill="#b3201f" />
      <circle v-for="(b, i) in berries" :key="'h' + i" :cx="b.x - 1.6" :cy="b.y - 1.8" r="1.6" fill="#f3b3a8" />
      <!-- 蝴蝶结 -->
      <g transform="translate(120 212)">
        <path d="M0 0 C-22 -18 -40 -8 -34 8 C-28 20 -10 10 0 0Z" fill="#9b1c1c" />
        <path d="M0 0 C22 -18 40 -8 34 8 C28 20 10 10 0 0Z" fill="#9b1c1c" />
        <path d="M-4 2 L-16 30 L-8 27 L-4 34 Z M4 2 L16 30 L8 27 L4 34 Z" fill="#7d1414" />
        <circle r="6" fill="#c8a35a" />
      </g>
    </svg>

    <div class="title">
      <h1>菜<span>·</span>单</h1>
      <p class="script">Merry Christmas</p>
    </div>
    </div>

    <footer>
      <p>我 的 冬 日 菜 谱</p>
      <p class="count">共 {{ count }} 道 · 向左翻开 <span class="arrow">←</span></p>
    </footer>
  </div>
</template>

<style scoped>
.xmas-cover {
  position: absolute; inset: 0;
  background:
    radial-gradient(90% 60% at 50% 40%, #a42424 0%, #7a1515 55%, #5a0e0e 100%);
  color: #f6ecd6;
  display: flex; flex-direction: column; align-items: center; justify-content: space-between;
  padding: 11% 10% 10%;
  overflow: hidden;
}
.xmas-cover::after { /* 纸纹 */
  content: ''; position: absolute; inset: 0; pointer-events: none; opacity: .18;
  background-image: radial-gradient(rgba(255,255,255,.35) 1px, transparent 1px);
  background-size: 5px 5px; mix-blend-mode: soft-light;
}
.frame { position: absolute; inset: 14px; border: 1.5px solid var(--gold); border-radius: 4px; }
.frame-inner { position: absolute; inset: 5px; border: .5px solid color-mix(in srgb, var(--gold) 60%, transparent); border-radius: 2px; }
.cap { font-family: var(--font-display-en); letter-spacing: .32em; font-size: 11px; color: var(--gold); }
.center { position: relative; width: 74%; max-width: 300px; aspect-ratio: 1; }
.wreath { width: 100%; height: 100%; filter: drop-shadow(0 6px 14px rgba(0,0,0,.35)); }
.title { position: absolute; inset: 0 0 8% 0; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
.title h1 {
  font-family: var(--font-serif); font-weight: 900; font-size: clamp(44px, 13vw, 64px);
  letter-spacing: .06em; margin: 0; line-height: 1;
}
.title h1 span { color: var(--gold); margin: 0 .08em; }
.script { font-family: var(--font-script); font-style: italic; color: var(--gold); font-size: 20px; margin: 10px 0 0; }
footer { text-align: center; font-family: var(--font-serif); position: relative; }
footer p { margin: 0; font-size: 14px; letter-spacing: .2em; }
.count { margin-top: 8px !important; font-size: 12px !important; opacity: .75; letter-spacing: .12em !important; }
.arrow { display: inline-block; animation: nudge 1.6s ease-in-out infinite; }
@keyframes nudge { 50% { transform: translateX(-6px); } }
</style>
