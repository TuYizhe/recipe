<script lang="ts">
  let { name }: { name: string } = $props()
  const P: Record<string, string> = {
    search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM21 21l-4.5-4.5',
    more: 'M5 12h.01M12 12h.01M19 12h.01',
    back: 'M15 5l-7 7 7 7',
    close: 'M6 6l12 12M18 6L6 18',
    plus: 'M12 5v14M5 12h14',
    camera: 'M4 8h3l2-3h6l2 3h3v11H4zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
    up: 'M6 15l6-6 6 6',
    down: 'M6 9l6 6 6-6',
    check: 'M5 12l5 5 9-10',
  }
</script>

<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width={name === 'more' ? 3 : 1.7} stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <path d={P[name]} />
</svg>
