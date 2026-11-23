<!-- 菜单页角落的冬青叶装饰 -->
<template>
  <svg v-for="pos in ['tl', 'br']" :key="pos" :class="['holly', pos]" viewBox="0 0 60 60" aria-hidden="true">
    <path d="M6 30c6-2 8-8 6-14 6 2 12 0 14-6 2 6 8 9 14 8-3 5-2 11 3 15-14 4-26 3-37-3z" fill="#1f4a33" />
    <path d="M24 8c8 2 12 10 10 18 6-2 12 2 14 8-6 0-10 4-10 10-6-4-12-2-16 3 0-10-3-24 2-39z" fill="#2f6b47" opacity=".9" />
    <circle cx="30" cy="36" r="4.5" fill="#9b1c1c" />
    <circle cx="38" cy="33" r="4" fill="#b3201f" />
    <circle cx="33" cy="42" r="3.6" fill="#9b1c1c" />
  </svg>
</template>

<style scoped>
.holly { position: absolute; width: 54px; height: 54px; pointer-events: none; z-index: 2; }
.tl { top: 2px; left: 2px; }
.br { bottom: 2px; right: 2px; transform: rotate(180deg); }
</style>
