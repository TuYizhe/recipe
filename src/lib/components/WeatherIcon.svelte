<!-- 线描天气图标 -->
<script lang="ts">
  let { kind }: { kind: 'sun' | 'cloud' | 'rain' | 'snow' | 'fog' | 'storm' } = $props()
</script>

<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  {#if kind === 'sun'}
    <circle cx="16" cy="16" r="6" />
    <path d="M16 3v3M16 26v3M3 16h3M26 16h3M6.8 6.8l2.1 2.1M23.1 23.1l2.1 2.1M6.8 25.2l2.1-2.1M23.1 8.9l2.1-2.1" />
  {:else}
    <path d="M9 20h14a5 5 0 0 0 0-10 7 7 0 0 0-13.4 2A4 4 0 0 0 9 20z" />
    {#if kind === 'rain'}<path d="M11 24l-1 3M17 24l-1 3M23 24l-1 3" />{/if}
    {#if kind === 'snow'}<path d="M11 25h.01M16 27h.01M21 25h.01M13.5 29h.01M18.5 29h.01" stroke-width="2.4" />{/if}
    {#if kind === 'fog'}<path d="M6 24h20M9 28h14" />{/if}
    {#if kind === 'storm'}<path d="M17 22l-3 4h4l-3 4" />{/if}
  {/if}
</svg>

<style>
  svg { width: 30px; height: 30px; flex: none; }
</style>
