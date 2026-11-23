<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { allRecipes, settings, saveSetting } from '../db'
import Icon from '../components/Icon.vue'

const router = useRouter()
const all = ref([])
const picking = ref(false)
allRecipes().then(list => (all.value = list))

const sh = settings.shopping
const chosen = computed(() => sh.recipeIds.map(id => all.value.find(r => r.id === id)).filter(Boolean))

const items = computed(() => {
  const map = new Map()
  for (const r of chosen.value) {
    for (const i of r.ingredients) {
      const key = i.name.trim()
      if (!key) continue
      const it = map.get(key) || { name: key, group: i.group, parts: [] }
      if (i.group !== 'seasoning') it.group = i.group === 'main' || it.group === 'seasoning' ? i.group : it.group
      it.parts.push({ amount: i.amount, from: r.name })
      map.set(key, it)
    }
  }
  return [...map.values()]
})
const toBuy = computed(() => sortChecked(items.value.filter(i => i.group !== 'seasoning')))
const seasonings = computed(() => sortChecked(items.value.filter(i => i.group === 'seasoning')))
const sortChecked = list => list.sort((a, b) => !!sh.checked[a.name] - !!sh.checked[b.name])
const left = computed(() => toBuy.value.filter(i => !sh.checked[i.name]).length)

const amountText = it => it.parts.map(p => p.amount).filter(Boolean).join(' + ') || ''
const fromText = it => [...new Set(it.parts.map(p => p.from))].join('、')

async function toggle(it) {
  sh.checked = { ...sh.checked, [it.name]: !sh.checked[it.name] }
  await saveSetting('shopping')
}
async function toggleRecipe(id) {
  sh.recipeIds = sh.recipeIds.includes(id) ? sh.recipeIds.filter(i => i !== id) : [...sh.recipeIds, id]
  await saveSetting('shopping')
}
async function toggleSeasoning() { sh.hideSeasoning = !sh.hideSeasoning; await saveSetting('shopping') }
async function clearAll() {
  if (!confirm('清空买菜清单？')) return
  sh.recipeIds = []; sh.checked = {}
  await saveSetting('shopping')
}
async function resetChecks() { sh.checked = {}; await saveSetting('shopping') }
const back = () => (history.state?.back ? router.back() : router.replace('/'))
</script>

<template>
  <div class="page-wrap shopping">
    <div class="topbar">
      <button class="icon-btn" aria-label="返回" @click="back"><Icon name="back" /></button>
      <span class="title">买菜清单</span>
      <button class="btn small soft" :disabled="!chosen.length" @click="clearAll">清空</button>
    </div>

    <header class="hero">
      <p class="eyebrow">Shopping List</p>
      <h1 class="h-display">{{ chosen.length ? `还要买 ${left} 样` : '想做什么菜？' }}</h1>
      <div class="dishes">
        <span v-for="r in chosen" :key="r.id" class="chip on">{{ r.name }}<button aria-label="移除" @click="toggleRecipe(r.id)"><Icon name="close" /></button></span>
        <button class="chip add" @click="picking = true"><Icon name="plus" />选菜</button>
      </div>
    </header>

    <template v-if="chosen.length">
      <section class="list">
        <div class="sec-title"><h2>要买的</h2><button v-if="Object.keys(sh.checked).length" class="reset" @click="resetChecks">全部取消勾选</button></div>
        <ul>
          <li v-for="it in toBuy" :key="it.name" :class="{ done: sh.checked[it.name] }" @click="toggle(it)">
            <span class="box"><Icon v-if="sh.checked[it.name]" name="check" /></span>
            <div class="txt"><b>{{ it.name }}</b><small>{{ fromText(it) }}</small></div>
            <span class="amt">{{ amountText(it) }}</span>
          </li>
        </ul>
      </section>

      <section v-if="seasonings.length" class="list">
        <div class="sec-title">
          <h2>调料 <small>{{ seasonings.length }}</small></h2>
          <button class="reset" @click="toggleSeasoning">{{ sh.hideSeasoning ? '展开（家里一般都有）' : '收起' }}</button>
        </div>
        <ul v-if="!sh.hideSeasoning">
          <li v-for="it in seasonings" :key="it.name" :class="{ done: sh.checked[it.name] }" @click="toggle(it)">
            <span class="box"><Icon v-if="sh.checked[it.name]" name="check" /></span>
            <div class="txt"><b>{{ it.name }}</b><small>{{ fromText(it) }}</small></div>
            <span class="amt">{{ amountText(it) }}</span>
          </li>
        </ul>
        <p v-else class="muted">{{ seasonings.map(s => s.name).join(' · ') }}</p>
      </section>
    </template>
    <p v-else class="muted empty">点“选菜”挑几道想做的菜，<br />会自动把要买的食材汇总到一起。</p>

    <div v-if="picking" class="sheet-mask" @click.self="picking = false">
      <div class="sheet">
        <div class="sheet-head"><h3>选几道菜</h3><button class="btn small" @click="picking = false">好了</button></div>
        <p v-if="!all.length" class="muted">还没有菜谱，先去记一道吧。</p>
        <ul class="pick">
          <li v-for="r in all" :key="r.id" :class="{ on: sh.recipeIds.includes(r.id) }" @click="toggleRecipe(r.id)">
            <span class="box"><Icon v-if="sh.recipeIds.includes(r.id)" name="check" /></span>
            <b>{{ r.name }}</b><small>{{ r.category }}</small>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style scoped>
.hero { padding: 18px 20px 10px; }
.hero h1 { font-size: clamp(32px, 10vw, 44px); margin: 8px 0 18px; }
.dishes { display: flex; flex-wrap: wrap; gap: 8px; }
.dishes .chip button { display: grid; place-items: center; margin-left: 2px; color: inherit; opacity: .7; }
.dishes svg { width: 14px; height: 14px; }
.chip.add { background: transparent; box-shadow: inset 0 0 0 1.5px var(--ink); color: var(--ink); font-weight: 600; }
.list { padding: 26px 20px 0; }
.sec-title { display: flex; align-items: baseline; justify-content: space-between; border-bottom: 2px solid var(--ink); padding-bottom: 8px; }
.sec-title h2 { margin: 0; font-size: 20px; font-weight: 900; }
.sec-title small { font-size: 13px; color: var(--ink-3); font-weight: 500; }
.reset { font-size: 13px; color: var(--ink-2); text-decoration: underline; text-underline-offset: 3px; }
ul { list-style: none; margin: 0; padding: 0; }
.list li { display: flex; align-items: center; gap: 14px; padding: 14px 0; border-bottom: 1px solid var(--line); cursor: pointer; transition: opacity .2s; }
.box { width: 24px; height: 24px; border-radius: 8px; border: 1.5px solid var(--ink); display: grid; place-items: center; flex: none; }
.box svg { width: 16px; height: 16px; stroke-width: 2.6; }
li.done .box, .pick li.on .box { background: var(--ink); color: var(--paper); }
li.done { opacity: .4; }
li.done b { text-decoration: line-through; }
.txt { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.txt b { font-size: 16px; }
.txt small { font-size: 12px; color: var(--ink-3); margin-top: 2px; }
.amt { font-weight: 700; font-size: 14px; text-align: right; }
.muted { color: var(--ink-3); font-size: 14px; line-height: 1.8; }
.empty { text-align: center; margin-top: 60px; }
.sheet-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.sheet-head h3 { margin: 0; font-size: 20px; font-weight: 900; }
.pick li { display: flex; align-items: center; gap: 12px; padding: 14px 0; border-bottom: 1px solid var(--line); cursor: pointer; }
.pick small { margin-left: auto; color: var(--ink-3); }
</style>
