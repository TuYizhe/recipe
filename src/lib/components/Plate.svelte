<!-- 圆盘里的菜：有照片放照片，没有就画一个俯视的白瓷盘 -->
<script lang="ts">
  import { imageUrl } from '../image'
  let { coverId = null, title = '' }: { coverId?: number | null; title?: string } = $props()
  let src = $state<string | null>(null)
  $effect(() => {
    const id = coverId
    src = null
    imageUrl(id).then((u) => (src = u))
  })
</script>

<div class="plate">
  {#if src}
    <img {src} alt={title} draggable="false" />
  {:else}
    <svg viewBox="0 0 200 200" aria-hidden="true">
      <circle cx="100" cy="100" r="96" fill="#fbfaf7" />
      <circle cx="100" cy="100" r="70" fill="none" stroke="rgba(0,0,0,.08)" stroke-width="1.5" />
      <circle cx="100" cy="100" r="64" fill="#f3efe7" />
      <text x="100" y="118" text-anchor="middle" font-size="52" font-weight="900" fill="#1b1b19" font-family="var(--serif)">{title.trim().charAt(0) || '菜'}</text>
    </svg>
  {/if}
</div>

<style>
  .plate {
    width: 100%; height: 100%; border-radius: 50%; overflow: hidden;
    box-shadow: 0 30px 50px -24px rgba(0, 0, 0, 0.35), 0 4px 10px -4px rgba(0, 0, 0, 0.12);
  }
  img, svg { width: 100%; height: 100%; object-fit: cover; }
</style>
