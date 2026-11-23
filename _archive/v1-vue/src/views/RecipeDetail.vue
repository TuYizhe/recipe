<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getRecipe, addLog, GROUPS, settings, saveSetting, saveRecipe } from '../db'
import AsyncImg from '../components/AsyncImg.vue'
import DishArt from '../components/DishArt.vue'
import Icon from '../components/Icon.vue'
import LogSheet from '../components/LogSheet.vue'
import { daysAgoText, formatDate, sourceInfo, latestLog } from '../utils'
import { showToast } from '../toast'

const route = useRoute()
const router = useRouter()
const r = ref(null)
const showLog = ref(false)

async function load() {
  r.value = await getRecipe(route.params.id)
  if (!r.value) router.replace('/')
}
load()

const groups = computed(() => GROUPS.map(g => ({ ...g, items: r.value.ingredients.filter(i => i.group === g.key) })).filter(g => g.items.length))
const last = computed(() => latestLog(r.value))
const logs = computed(() => [...(r.value?.logs || [])].sort((a, b) => b.date - a.date))
const src = computed(() => sourceInfo(r.value?.sourceUrl))
const inCart = computed(() => settings.shopping.recipeIds.includes(r.value?.id))

async function toggleCart() {
  const ids = settings.shopping.recipeIds
  if (inCart.value) settings.shopping.recipeIds = ids.filter(i => i !== r.value.id)
  else settings.shopping.recipeIds = [...ids, r.value.id]
  await saveSetting('shopping')
  showToast(inCart.value ? '已加入买菜清单' : '已从清单移除')
}

async function onLog(log) {
  await addLog(r.value.id, log)
  showLog.value = false
  showToast('记下了，下次翻开就能看到')
  await load()
}
async function removeLog(log) {
  if (!confirm('删除这条记录？')) return
  r.value.logs = r.value.logs.filter(l => l !== log)
  await saveRecipe(r.value)
  await load()
}
const back = () => (history.state?.back ? router.back() : router.replace('/'))
</script>

<template>
  <div v-if="r" class="page-wrap detail">
    <div class="hero">
      <AsyncImg :id="r.coverId" :alt="r.name"><DishArt :name="r.name" /></AsyncImg>
      <div class="hero-bar">
        <button class="icon-btn" aria-label="返回" @click="back"><Icon name="back" /></button>
        <button class="icon-btn" aria-label="编辑" @click="router.push(`/recipe/${r.id}/edit`)"><Icon name="edit" /></button>
      </div>
    </div>

    <section class="head">
      <p class="eyebrow">{{ r.category }}<template v-if="r.servings"> · {{ r.servings }}</template></p>
      <h1 class="h-display">{{ r.name }}</h1>
      <div class="meta">
        <span class="chip">{{ daysAgoText(r.lastCookedAt) }}</span>
        <span v-if="r.logs.length" class="chip">做过 {{ r.logs.length }} 次</span>
        <a v-if="src" class="chip src" :href="r.sourceUrl" target="_blank" rel="noopener" :style="{ '--c': src.color }">
          <Icon name="link" />看{{ src.name }}原教程
        </a>
      </div>
    </section>

    <section v-if="last?.note" class="last">
      <p class="eyebrow">上次的心得 · {{ formatDate(last.date) }}</p>
      <p class="quote">{{ last.note }}</p>
    </section>

    <section class="block">
      <div class="sec-title"><span class="eyebrow">Ingredients</span><h2>用料</h2></div>
      <div v-for="g in groups" :key="g.key" class="group">
        <h3>{{ g.label }}</h3>
        <ul>
          <li v-for="(i, k) in g.items" :key="k"><span>{{ i.name }}</span><b>{{ i.amount || '—' }}</b></li>
        </ul>
      </div>
      <p v-if="!groups.length" class="muted">还没有填用料</p>
    </section>

    <section class="block">
      <div class="sec-title"><span class="eyebrow">Method</span><h2>步骤</h2></div>
      <ol class="steps">
        <li v-for="(s, k) in r.steps" :key="k">
          <span class="num">{{ String(k + 1).padStart(2, '0') }}</span>
          <div class="body">
            <div v-if="s.heat || s.time" class="tags">
              <span v-if="s.heat" class="tag heat" :data-h="s.heat"><Icon name="fire" />{{ s.heat }}</span>
              <span v-if="s.time" class="tag"><Icon name="clock" />{{ s.time }}</span>
            </div>
            <p>{{ s.text }}</p>
            <AsyncImg v-if="s.imageId" :id="s.imageId" class="step-img" />
          </div>
        </li>
      </ol>
    </section>

    <section v-if="r.tips" class="block tips">
      <p class="eyebrow">Tips</p>
      <p>{{ r.tips }}</p>
    </section>

    <section class="block">
      <div class="sec-title"><span class="eyebrow">Journal</span><h2>做菜记录</h2></div>
      <p v-if="!logs.length" class="muted">还没有记录。做完点下面的“做了一次”，写两句心得，下次就不会忘。</p>
      <ul class="logs">
        <li v-for="(l, k) in logs" :key="k">
          <div class="log-head">
            <b>{{ formatDate(l.date) }}</b>
            <span class="stars">{{ '★'.repeat(l.rating || 0) }}<i>{{ '★'.repeat(5 - (l.rating || 0)) }}</i></span>
            <button class="del" aria-label="删除记录" @click="removeLog(l)"><Icon name="trash" /></button>
          </div>
          <p v-if="l.note">{{ l.note }}</p>
          <div v-if="l.imageIds?.length" class="log-imgs">
            <AsyncImg v-for="id in l.imageIds" :key="id" :id="id" />
          </div>
        </li>
      </ul>
    </section>

    <div class="bottom-bar">
      <button class="btn soft" @click="toggleCart"><Icon name="cart" style="width:18px" />{{ inCart ? '已在清单' : '加入买菜清单' }}</button>
      <button class="btn" @click="showLog = true"><Icon name="check" style="width:18px" />做了一次</button>
    </div>

    <LogSheet v-if="showLog" @close="showLog = false" @save="onLog" />
  </div>
</template>

<style scoped>
.hero { position: relative; aspect-ratio: 1 / .92; max-height: 480px; width: 100%; overflow: hidden; background: var(--paper-2); }
.hero :deep(img) { width: 100%; height: 100%; object-fit: cover; }
.hero-bar { position: absolute; top: calc(12px + var(--safe-top)); left: 16px; right: 16px; display: flex; justify-content: space-between; }
.head { padding: 26px 22px 6px; position: relative; }
.head h1 { font-size: clamp(36px, 11vw, 52px); margin: 8px 0 16px; }
.meta { display: flex; flex-wrap: wrap; gap: 8px; }
.src { text-decoration: none; background: color-mix(in srgb, var(--c) 12%, transparent); color: var(--c); font-weight: 600; }
.src svg { width: 14px; height: 14px; }

.last { margin: 18px 16px 0; padding: 18px 20px; background: var(--tint-4); border-radius: var(--radius); }
.last .eyebrow { color: var(--ink-2); letter-spacing: .12em; }
.quote { margin: 8px 0 0; font-size: 16px; line-height: 1.7; font-weight: 600; }

.block { padding: 34px 22px 0; }
.sec-title { display: flex; align-items: baseline; justify-content: space-between; border-bottom: 2px solid var(--ink); padding-bottom: 10px; margin-bottom: 6px; }
.sec-title h2 { margin: 0; font-size: 22px; font-weight: 900; order: -1; }
.group h3 { font-size: 12px; color: var(--ink-3); font-weight: 500; letter-spacing: .2em; margin: 18px 0 4px; }
.group ul { list-style: none; margin: 0; padding: 0; }
.group li { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid var(--line); font-size: 16px; }
.group li b { font-weight: 700; }
.muted { color: var(--ink-3); font-size: 14px; line-height: 1.7; }

.steps { list-style: none; margin: 0; padding: 0; }
.steps li { display: flex; gap: 16px; padding: 20px 0; border-bottom: 1px solid var(--line); }
.num { font-family: var(--font-display-en); font-size: 34px; line-height: .9; font-weight: 700; color: var(--ink); min-width: 44px; }
.body { flex: 1; min-width: 0; }
.body p { margin: 0; font-size: 16px; line-height: 1.75; }
.tags { display: flex; gap: 6px; margin-bottom: 8px; }
.tag { display: inline-flex; align-items: center; gap: 4px; font-size: 12px; font-weight: 700; padding: 3px 10px; border-radius: 999px; background: var(--paper-2); }
.tag svg { width: 13px; height: 13px; }
.heat[data-h='小火'] { background: #f6e3c8; color: #9a5b12; }
.heat[data-h='中火'] { background: #f7d3bd; color: #b4471a; }
.heat[data-h='大火'] { background: #f2c0b8; color: #b3241b; }
.step-img { margin-top: 12px; border-radius: 12px; width: 100%; aspect-ratio: 4/3; object-fit: cover; }

.tips p:last-child { margin: 8px 0 0; padding: 18px 20px; background: var(--tint-1); border-radius: var(--radius); line-height: 1.75; }

.logs { list-style: none; margin: 0; padding: 0; }
.logs li { padding: 16px 0; border-bottom: 1px solid var(--line); }
.log-head { display: flex; align-items: center; gap: 10px; }
.log-head b { font-family: var(--font-display-en); font-size: 15px; }
.stars { color: #d39a1d; font-size: 13px; letter-spacing: 1px; } .stars i { color: var(--line); font-style: normal; }
.del { margin-left: auto; color: var(--ink-3); width: 28px; height: 28px; display: grid; place-items: center; }
.del svg { width: 16px; height: 16px; }
.logs p { margin: 8px 0 0; line-height: 1.7; color: var(--ink-2); }
.log-imgs { display: flex; gap: 8px; margin-top: 10px; overflow-x: auto; }
.log-imgs :deep(img) { width: 96px; height: 96px; object-fit: cover; border-radius: 10px; flex: none; }
</style>
