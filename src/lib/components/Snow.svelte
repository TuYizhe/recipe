<!-- 圣诞主题的细雪，很轻，不抢画面 -->
<script lang="ts">
  let canvas: HTMLCanvasElement
  $effect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const ctx = canvas.getContext('2d')!
    let w = 0, h = 0, raf = 0
    const dpr = Math.min(2, devicePixelRatio || 1)
    let flakes: { x: number; y: number; r: number; s: number; d: number }[] = []
    const resize = () => {
      w = canvas.clientWidth; h = canvas.clientHeight
      canvas.width = w * dpr; canvas.height = h * dpr
      flakes = Array.from({ length: Math.round((w * h) / 14000) }, () => ({
        x: Math.random() * w, y: Math.random() * h, r: Math.random() * 1.8 + 0.6, s: Math.random() * 0.4 + 0.2, d: Math.random() * 6,
      }))
    }
    const tick = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, w, h)
      for (const f of flakes) {
        f.y += f.s; f.d += 0.01; f.x += Math.sin(f.d) * 0.25
        if (f.y > h + 4) { f.y = -4; f.x = Math.random() * w }
        ctx.fillStyle = 'rgba(255,255,255,.95)'
        ctx.shadowColor = 'rgba(0,0,0,.18)'
        ctx.shadowBlur = 2
        ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2); ctx.fill()
      }
      raf = requestAnimationFrame(tick)
    }
    resize(); tick()
    addEventListener('resize', resize)
    return () => { cancelAnimationFrame(raf); removeEventListener('resize', resize) }
  })
</script>

<canvas bind:this={canvas} aria-hidden="true"></canvas>

<style>
  canvas { position: fixed; inset: 0; width: 100%; height: 100%; pointer-events: none; z-index: 15; }
</style>
