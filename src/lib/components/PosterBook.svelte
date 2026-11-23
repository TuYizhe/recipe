<!--
  全屏翻页：手指向左拖，当前海报绕左边翻起，露出下一张；向右拖翻回上一张。
  只渲染当前页前后各一页。
-->
<script lang="ts">
  import type { Snippet } from 'svelte'

  let { count, index = $bindable(0), page }: { count: number; index?: number; page: Snippet<[number]> } = $props()

  const DURATION = 560
  let el: HTMLDivElement
  let dir = $state(0) // 1 往后翻，-1 往前翻
  let progress = $state(0)
  let animating = $state(false)

  type Leaf = { i: number; angle: number; z: number; turning?: boolean; under?: boolean }
  const leaves = $derived.by<Leaf[]>(() => {
    const c = index
    if (dir === 1) return [{ i: c + 1, angle: 0, z: 1, under: true }, { i: c, angle: -180 * progress, z: 2, turning: true }]
    if (dir === -1) return [{ i: c, angle: 0, z: 1, under: true }, { i: c - 1, angle: -180 * (1 - progress), z: 2, turning: true }]
    return [{ i: c, angle: 0, z: 1 }]
  })
  const turnAngle = $derived(leaves.find((l) => l.turning)?.angle ?? 0)
  const shade = $derived(Math.sin((-turnAngle * Math.PI) / 180))
  const edge = $derived(Math.max(0, Math.cos((turnAngle * Math.PI) / 180)) * 100)

  let start: { x: number; y: number; t: number } | null = null
  let width = 1
  let moved = false

  function down(e: PointerEvent) {
    if (animating || e.button > 0) return
    if ((e.target as HTMLElement).closest('input, textarea, [data-noflip]')) return
    start = { x: e.clientX, y: e.clientY, t: performance.now() }
    width = el.clientWidth
    moved = false
  }
  function move(e: PointerEvent) {
    if (!start || animating) return
    const dx = e.clientX - start.x
    const dy = e.clientY - start.y
    if (!dir) {
      if (Math.abs(dx) < 10 || Math.abs(dx) < Math.abs(dy)) return
      const d = dx < 0 ? 1 : -1
      if ((d === 1 && index >= count - 1) || (d === -1 && index <= 0)) return
      dir = d
      moved = true
      el.setPointerCapture?.(e.pointerId)
    }
    const p = dir === 1 ? -dx : dx
    progress = Math.min(1, Math.max(0, p / (width * 0.8)))
  }
  function up(e: PointerEvent) {
    if (!start) return
    const dt = performance.now() - start.t
    const dx = e.clientX - start.x
    start = null
    if (!dir) return
    const v = (dir === 1 ? -dx : dx) / dt
    finish(progress > 0.3 || v > 0.45)
  }
  function finish(commit: boolean) {
    animating = true
    requestAnimationFrame(() => (progress = commit ? 1 : 0))
    setTimeout(() => {
      if (commit) index = index + dir
      dir = 0
      progress = 0
      animating = false
    }, DURATION)
  }
  function clickCapture(e: MouseEvent) {
    if (moved) {
      e.stopPropagation()
      e.preventDefault()
      moved = false
    }
  }

  export function turn(d: 1 | -1) {
    if (animating || dir) return
    if ((d === 1 && index >= count - 1) || (d === -1 && index <= 0)) return
    dir = d
    progress = 0
    requestAnimationFrame(() => finish(true))
  }

  function key(e: KeyboardEvent) {
    if ((e.target as HTMLElement).closest?.('input, textarea')) return
    if (e.key === 'ArrowRight') turn(1)
    if (e.key === 'ArrowLeft') turn(-1)
  }
</script>

<svelte:window onkeydown={key} />

<div
  class="book"
  bind:this={el}
  onpointerdown={down}
  onpointermove={move}
  onpointerup={up}
  onpointercancel={up}
  onclickcapture={clickCapture}
  role="region"
  aria-label="菜单，左右滑动翻页"
>
  {#each leaves as leaf (leaf.i)}
    <div
      class="leaf"
      style:transform="rotateY({leaf.angle}deg)"
      style:z-index={leaf.z}
      style:transition-duration={animating ? `${DURATION}ms` : '0ms'}
    >
      <div class="face">
        {@render page(leaf.i)}
        {#if leaf.turning}<div class="fold" style:opacity={(-leaf.angle / 180) * 0.5}></div>{/if}
        {#if leaf.under}<div class="cast" style:left="{edge}%" style:opacity={shade * 0.5}></div>{/if}
      </div>
      <div class="face back"></div>
    </div>
  {/each}
</div>

<style>
  .book { position: absolute; inset: 0; perspective: 2400px; perspective-origin: 0 50%; touch-action: pan-y; user-select: none; -webkit-user-select: none; }
  .leaf {
    position: absolute; inset: 0; transform-origin: 0 50%; transform-style: preserve-3d;
    transition-property: transform; transition-timing-function: cubic-bezier(0.3, 0.7, 0.25, 1); will-change: transform;
  }
  .face { position: absolute; inset: 0; backface-visibility: hidden; -webkit-backface-visibility: hidden; overflow: hidden; }
  .back { transform: rotateY(180deg); background: linear-gradient(90deg, #e9e4da, #f6f2ea 60%, #ece6db); }
  .fold { position: absolute; inset: 0; pointer-events: none; background: linear-gradient(90deg, transparent 20%, rgba(0, 0, 0, 0.45)); }
  .cast { position: absolute; top: 0; bottom: 0; width: 80px; pointer-events: none; background: linear-gradient(90deg, rgba(0, 0, 0, 0.35), transparent); }
</style>
