<!-- 没有照片时的扁平插画：一只冒热气的碗 -->
<script setup>
import { computed } from 'vue'
import { tintFor } from '../utils'
const props = defineProps({ name: { type: String, default: '' } })
const bg = computed(() => tintFor(props.name))
const initial = computed(() => props.name.trim().charAt(0) || '菜')
</script>

<template>
  <div class="art" :style="{ background: bg }">
    <svg viewBox="0 0 200 160" aria-hidden="true">
      <g fill="none" stroke="var(--ink)" stroke-width="3" stroke-linecap="round" opacity=".55">
        <path class="steam s1" d="M78 52c-8-10 8-16 0-28" />
        <path class="steam s2" d="M100 48c-8-10 8-16 0-30" />
        <path class="steam s3" d="M122 52c-8-10 8-16 0-28" />
      </g>
      <ellipse cx="100" cy="138" rx="62" ry="6" fill="var(--ink)" opacity=".08" />
      <path d="M36 74h128c0 36-28 60-64 60S36 110 36 74z" fill="var(--card)" stroke="var(--ink)" stroke-width="3" />
      <path d="M44 74h112" stroke="var(--ink)" stroke-width="3" stroke-linecap="round" />
      <path d="M80 134h40l-4 8H84z" fill="var(--ink)" />
      <text x="100" y="112" text-anchor="middle" font-size="30" font-weight="900" fill="var(--ink)" font-family="var(--font-serif)">{{ initial }}</text>
    </svg>
  </div>
</template>

<style scoped>
.art { width: 100%; height: 100%; display: grid; place-items: center; }
svg { width: 64%; max-width: 220px; }
.steam { animation: rise 3s ease-in-out infinite; }
.s2 { animation-delay: -1s; } .s3 { animation-delay: -2s; }
@keyframes rise { 0%,100% { transform: translateY(0); opacity: .55 } 50% { transform: translateY(-5px); opacity: .2 } }
</style>
