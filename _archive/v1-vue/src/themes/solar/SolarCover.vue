<script setup>
import { computed } from 'vue'
import { activeTheme } from '../index'
defineProps({ count: Number })
const t = computed(() => activeTheme.value)
</script>

<template>
  <div class="solar-cover">
    <span class="cap">{{ t.season.en.toUpperCase() }} · SOLAR TERM</span>
    <div class="sun"></div>
    <h1>{{ t.term.name }}</h1>
    <p class="sub">{{ t.season.name }} 季 菜 单</p>
    <footer>共 {{ count }} 道 · 向左翻开 ←</footer>
  </div>
</template>

<style scoped>
.solar-cover {
  position: absolute; inset: 0; background: var(--home-bg); color: var(--home-ink);
  display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 12%;
}
.cap { position: absolute; top: 9%; letter-spacing: .3em; font-size: 11px; font-family: var(--font-display-en); }
.sun { width: 42%; aspect-ratio: 1; border-radius: 50%; background: var(--accent-2); opacity: .9; margin-bottom: -16%; }
h1 { font-family: var(--font-serif); font-size: clamp(64px, 22vw, 110px); margin: 0; font-weight: 900; letter-spacing: .05em; }
.sub { letter-spacing: .5em; font-size: 14px; margin: 12px 0 0; }
footer { position: absolute; bottom: 9%; font-size: 12px; opacity: .7; letter-spacing: .1em; }
</style>
