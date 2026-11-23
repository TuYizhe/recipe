<script setup>
import { computed } from 'vue'
import AsyncImg from './AsyncImg.vue'
import DishArt from './DishArt.vue'
import { daysAgoText } from '../utils'
import { activeTheme } from '../themes'

const props = defineProps({ recipe: Object, no: Number })
const mains = computed(() => props.recipe.ingredients.filter(i => i.group !== 'seasoning').slice(0, 5))
const seasonings = computed(() => props.recipe.ingredients.filter(i => i.group === 'seasoning').map(i => i.name))
const corner = computed(() => activeTheme.value.corner)
</script>

<template>
  <div class="dish-page">
    <component :is="corner" v-if="corner" />
    <div class="border"></div>

    <header>
      <span>No.{{ String(no).padStart(2, '0') }}</span>
      <span>{{ recipe.category }}</span>
    </header>

    <div class="photo">
      <AsyncImg :id="recipe.coverId" :alt="recipe.name"><DishArt :name="recipe.name" /></AsyncImg>
    </div>

    <h2>{{ recipe.name }}</h2>
    <div class="orn"><i></i><b>✦</b><i></i></div>

    <ul class="ings">
      <li v-for="(i, k) in mains" :key="k"><span>{{ i.name }}</span><em></em><span>{{ i.amount }}</span></li>
    </ul>
    <p v-if="seasonings.length" class="season"><b>调料</b>{{ seasonings.join(' · ') }}</p>

    <footer>
      <span>{{ daysAgoText(recipe.lastCookedAt) }}</span>
      <span class="go">翻看做法 →</span>
    </footer>
  </div>
</template>

<style scoped>
.dish-page {
  position: absolute; inset: 0; background: var(--page-bg); color: var(--page-ink);
  display: flex; flex-direction: column; align-items: center;
  padding: 26px 26px 20px; cursor: pointer;
  background-image: radial-gradient(120% 80% at 50% 0%, rgba(255,255,255,.6), transparent 60%);
}
.border { position: absolute; inset: 10px; border: 1px solid color-mix(in srgb, var(--gold) 70%, transparent); border-radius: 4px; pointer-events: none; }
.border::after { content: ''; position: absolute; inset: 4px; border: .5px solid color-mix(in srgb, var(--gold) 45%, transparent); }
header {
  width: 100%; display: flex; justify-content: space-between; position: relative; z-index: 3;
  font-family: var(--font-display-en); font-size: 11px; letter-spacing: .25em; color: var(--accent);
  padding: 0 14px 0 34px;
}
.photo {
  width: 78%; flex: 1 1 auto; min-height: 120px; max-height: 42%; margin-top: 14px;
  border-radius: 999px 999px 14px 14px; overflow: hidden; position: relative;
  outline: 1px solid var(--gold); outline-offset: 4px;
}
.photo :deep(img) { width: 100%; height: 100%; object-fit: cover; }
h2 {
  font-family: var(--font-serif); font-weight: 900; font-size: clamp(24px, 7.6vw, 34px);
  margin: 18px 0 0; letter-spacing: .08em; text-align: center; line-height: 1.2;
}
.orn { display: flex; align-items: center; gap: 10px; width: 50%; margin: 8px 0 12px; color: var(--gold); font-size: 11px; }
.orn i { flex: 1; height: 1px; background: currentColor; opacity: .7; }
.ings { list-style: none; margin: 0; padding: 0; width: 82%; font-family: var(--font-serif); font-size: 14.5px; }
.ings li { display: flex; align-items: baseline; gap: 6px; padding: 3px 0; }
.ings em { flex: 1; border-bottom: 1.5px dotted color-mix(in srgb, var(--page-ink) 30%, transparent); transform: translateY(-4px); }
.season {
  width: 82%; margin: 8px 0 0; font-size: 12.5px; color: var(--page-muted); line-height: 1.6;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.season b { color: var(--accent); margin-right: 8px; font-weight: 600; }
footer {
  margin-top: auto; padding-top: 10px; width: 82%; display: flex; justify-content: space-between;
  font-size: 12px; color: var(--page-muted); position: relative; z-index: 3;
}
.go { color: var(--accent); font-weight: 600; }
</style>
