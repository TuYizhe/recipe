<script setup>
defineOptions({ name: 'Home' })
import { computed, onActivated, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import FlipBook from '../components/FlipBook.vue'
import MenuDishPage from '../components/MenuDishPage.vue'
import Icon from '../components/Icon.vue'
import { allRecipes, saveRecipe, settings } from '../db'
import { activeTheme } from '../themes'
import { SAMPLES } from '../samples'

const router = useRouter()
const recipes = ref([])
const page = ref(0)
const bookRef = ref(null)
const jumping = ref(false)

async function load() {
  const list = await allRecipes()
  const order = c => { const i = settings.categories.indexOf(c); return i < 0 ? 999 : i }
  recipes.value = list.sort((a, b) => order(a.category) - order(b.category) || a.createdAt - b.createdAt)
  if (page.value > pageCount.value - 1) page.value = pageCount.value - 1
}
onActivated(load)
load()

/* 页序：0 封面 · 1 目录 · 2..n+1 菜 · 最后 添加页 */
const DISH_START = 2
const pageCount = computed(() => recipes.value.length + 3)
const pageType = i => i === 0 ? 'cover' : i === 1 ? 'toc' : i === pageCount.value - 1 ? 'add' : 'dish'

const toc = computed(() => {
  const groups = []
  recipes.value.forEach((r, i) => {
    let g = groups.find(g => g.name === r.category)
    if (!g) groups.push(g = { name: r.category, items: [] })
    g.items.push({ r, page: i + DISH_START })
  })
  return groups
})

function jumpTo(p) {
  if (p === page.value) return
  jumping.value = true
  setTimeout(() => { page.value = p; jumping.value = false }, 160)
}

/* ---------- 搜索 ---------- */
const q = ref('')
const focused = ref(false)
const results = computed(() => {
  const k = q.value.trim().toLowerCase()
  if (!k) return []
  return recipes.value
    .map((r, i) => {
      let hit = ''
      if (r.name.toLowerCase().includes(k)) hit = '菜名'
      else if (r.ingredientNames.some(n => n.toLowerCase().includes(k))) hit = '用了「' + r.ingredientNames.find(n => n.toLowerCase().includes(k)) + '」'
      else if (r.category.includes(k)) hit = r.category
      else if ((r.tips || '').includes(k) || r.steps.some(s => s.text.includes(k))) hit = '做法里提到'
      return hit && { r, page: i + DISH_START, hit }
    })
    .filter(Boolean)
})
const onBlur = () => setTimeout(() => (focused.value = false), 150)
function pick(res) {
  q.value = ''
  focused.value = false
  document.activeElement?.blur()
  jumpTo(res.page)
}

async function loadSamples() {
  for (const s of SAMPLES) await saveRecipe(JSON.parse(JSON.stringify(s)))
  await load()
}

const theme = computed(() => activeTheme.value)
watch(theme, t => document.querySelector('meta[name=theme-color]')?.setAttribute('content', t.id === 'christmas' ? '#142a1e' : t.season?.bg || '#f4f1ea'), { immediate: true })
</script>

<template>
  <div class="home" :style="theme.vars" :class="'theme-' + theme.id">
    <component :is="theme.decor" v-if="theme.decor" />

    <div class="top">
      <label class="search" :class="{ focused }">
        <Icon name="search" />
        <input v-model="q" type="search" placeholder="搜菜名、食材，比如“土豆”"
          @focus="focused = true" @blur="onBlur" />
      </label>
      <button class="icon-btn" aria-label="买菜清单" @click="router.push('/shopping')"><Icon name="cart" /></button>
      <button class="icon-btn" aria-label="设置" @click="router.push('/settings')"><Icon name="gear" /></button>

      <transition name="fade">
        <ul v-if="q.trim()" class="results">
          <li v-for="res in results" :key="res.r.id" @mousedown.prevent @click="pick(res)">
            <b>{{ res.r.name }}</b><span>{{ res.hit }}</span><em>P.{{ res.page - 1 }}</em>
          </li>
          <li v-if="!results.length" class="none">没找到“{{ q }}”，<a @mousedown.prevent @click="router.push('/recipe/new')">记一道新菜？</a></li>
        </ul>
      </transition>
    </div>

    <div class="book-area" :class="{ jumping }">
      <FlipBook ref="bookRef" v-model="page" :count="pageCount">
        <template #page="{ index }">
          <!-- 封面 -->
          <component v-if="pageType(index) === 'cover'" :is="theme.cover" :count="recipes.length" />

          <!-- 目录 -->
          <div v-else-if="pageType(index) === 'toc'" class="paper toc">
            <div class="border"></div>
            <component :is="theme.corner" v-if="theme.corner" />
            <p class="cap">CONTENTS</p>
            <h2>目 录</h2>
            <div class="toc-body">
              <p v-if="!recipes.length" class="empty">菜单还是空的</p>
              <section v-for="g in toc" :key="g.name">
                <h3>{{ g.name }}</h3>
                <a v-for="it in g.items" :key="it.r.id" @click="jumpTo(it.page)">
                  <span>{{ it.r.name }}</span><em></em><span>{{ it.page - 1 }}</span>
                </a>
              </section>
            </div>
          </div>

          <!-- 菜 -->
          <MenuDishPage v-else-if="pageType(index) === 'dish'"
            :recipe="recipes[index - DISH_START]" :no="index - 1"
            @click="router.push('/recipe/' + recipes[index - DISH_START].id)" />

          <!-- 末页：添加 -->
          <div v-else class="paper add">
            <div class="border"></div>
            <component :is="theme.corner" v-if="theme.corner" />
            <p class="cap">NEW DISH</p>
            <button class="plus" @click="router.push('/recipe/new')">＋</button>
            <h2>再添一道菜</h2>
            <p class="hint">做完一道新菜，趁还记得，<br />把用料和步骤记下来。</p>
            <button v-if="!recipes.length" class="sample" @click="loadSamples">先载入几道示例菜看看效果</button>
          </div>
        </template>
      </FlipBook>
    </div>

    <div class="bottom">
      <button class="nav" :disabled="page === 0" @click="bookRef.prev()">‹</button>
      <span class="pno">{{ page === 0 ? '封面' : page === 1 ? '目录' : page === pageCount - 1 ? '末页' : `第 ${page - 1} 道 / 共 ${recipes.length}` }}</span>
      <button class="nav" :disabled="page === pageCount - 1" @click="bookRef.next()">›</button>
      <button class="fab" aria-label="记一道新菜" @click="router.push('/recipe/new')"><Icon name="plus" /></button>
    </div>
  </div>
</template>

<style scoped>
.home {
  position: fixed; inset: 0; background: var(--home-bg); color: var(--home-ink);
  display: flex; flex-direction: column; overflow: hidden;
}
.top {
  position: relative; z-index: 20; display: flex; gap: 8px; align-items: center;
  padding: calc(18px + var(--safe-top)) 16px 10px; max-width: 560px; width: 100%; margin: 0 auto;
}
.search {
  flex: 1; display: flex; align-items: center; gap: 8px; height: 42px; padding: 0 14px; border-radius: 999px;
  background: color-mix(in srgb, var(--home-ink) 14%, transparent); backdrop-filter: blur(12px);
  border: 1px solid color-mix(in srgb, var(--home-ink) 22%, transparent); transition: background .2s;
}
.search.focused { background: color-mix(in srgb, var(--home-ink) 22%, transparent); }
.search svg { width: 18px; height: 18px; opacity: .8; flex: none; }
.search input { flex: 1; min-width: 0; border: 0; outline: 0; background: transparent; font-size: 15px; color: var(--home-ink); }
.search input::placeholder { color: color-mix(in srgb, var(--home-ink) 60%, transparent); }
.search input::-webkit-search-cancel-button { filter: invert(1); }
.top .icon-btn { background: color-mix(in srgb, var(--home-ink) 14%, transparent); color: var(--home-ink); }
.results {
  position: absolute; left: 16px; right: 16px; top: 100%; margin: 4px 0 0; padding: 6px; list-style: none;
  background: var(--card); color: var(--ink); border-radius: 16px; box-shadow: 0 20px 40px -10px rgba(0,0,0,.4);
  max-height: 50vh; overflow: auto;
}
.results li { display: flex; align-items: baseline; gap: 10px; padding: 12px; border-radius: 10px; cursor: pointer; }
.results li:active { background: var(--paper-2); }
.results b { font-size: 15px; }
.results span { font-size: 12px; color: var(--ink-3); flex: 1; }
.results em { font-style: normal; font-size: 12px; color: var(--ink-3); font-family: var(--font-display-en); }
.results .none { color: var(--ink-2); font-size: 14px; cursor: default; display: block; }
.results .none a { color: var(--accent); text-decoration: underline; cursor: pointer; }

.book-area {
  flex: 1; min-height: 0; position: relative; z-index: 5;
  width: min(calc(100% - 40px), calc((100vh - 170px) * .66), 460px);
  margin: 6px auto 0; transition: opacity .16s, transform .16s;
}
.book-area.jumping { opacity: 0; transform: scale(.98); }

.bottom {
  position: relative; z-index: 10; display: flex; align-items: center; justify-content: center; gap: 14px;
  padding: 16px 16px calc(16px + var(--safe-bottom)); max-width: 560px; width: 100%; margin: 0 auto;
}
.nav { width: 36px; height: 36px; border-radius: 50%; font-size: 22px; line-height: 1; color: var(--home-ink);
  border: 1px solid color-mix(in srgb, var(--home-ink) 30%, transparent); }
.nav:disabled { opacity: .3; }
.pno { min-width: 110px; text-align: center; font-size: 13px; letter-spacing: .08em; font-family: var(--font-serif); }
.fab { position: absolute; right: 16px; width: 48px; height: 48px; border-radius: 50%;
  background: var(--gold); color: #1b1410; display: grid; place-items: center; box-shadow: 0 8px 20px -6px rgba(0,0,0,.5); }
.fab svg { width: 22px; height: 22px; stroke-width: 2.4; }

/* ---------- 纸页（目录、末页） ---------- */
.paper {
  position: absolute; inset: 0; background: var(--page-bg); color: var(--page-ink);
  display: flex; flex-direction: column; align-items: center; padding: 34px 30px 24px;
  background-image: radial-gradient(120% 80% at 50% 0%, rgba(255,255,255,.6), transparent 60%);
}
.paper .border { position: absolute; inset: 10px; border: 1px solid color-mix(in srgb, var(--gold) 70%, transparent); border-radius: 4px; pointer-events: none; }
.paper .cap { font-family: var(--font-display-en); letter-spacing: .32em; font-size: 11px; color: var(--accent); margin: 0; }
.paper h2 { font-family: var(--font-serif); font-weight: 900; font-size: 28px; margin: 8px 0 14px; letter-spacing: .2em; }
.toc-body { width: 100%; overflow: auto; flex: 1; padding: 0 6px; position: relative; z-index: 3; }
.toc h3 { font-family: var(--font-serif); font-size: 13px; color: var(--accent); letter-spacing: .3em; margin: 14px 0 4px;
  display: flex; align-items: center; gap: 8px; }
.toc h3::after { content: ''; flex: 1; height: 1px; background: color-mix(in srgb, var(--gold) 60%, transparent); }
.toc a { display: flex; gap: 6px; align-items: baseline; padding: 7px 0; font-family: var(--font-serif); font-size: 15px; cursor: pointer; }
.toc a em { flex: 1; border-bottom: 1.5px dotted color-mix(in srgb, var(--page-ink) 30%, transparent); transform: translateY(-4px); }
.toc .empty { text-align: center; color: var(--page-muted); margin-top: 40%; font-family: var(--font-serif); }
.add { justify-content: center; text-align: center; }
.add .cap { position: absolute; top: 34px; }
.plus { width: 92px; height: 92px; border-radius: 50%; border: 1.5px dashed var(--gold); font-size: 40px; color: var(--accent); margin-bottom: 18px; }
.add .hint { color: var(--page-muted); font-size: 13.5px; line-height: 1.8; margin: 0; }
.sample { margin-top: 26px; font-size: 13px; color: var(--accent); text-decoration: underline; text-underline-offset: 4px; }
</style>
