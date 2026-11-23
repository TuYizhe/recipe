<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { emptyRecipe, getRecipe, saveRecipe, deleteRecipe, GROUPS, HEATS, settings } from '../db'
import ImagePicker from '../components/ImagePicker.vue'
import Icon from '../components/Icon.vue'
import { extractUrl, sourceInfo } from '../utils'
import { showToast } from '../toast'

const route = useRoute()
const router = useRouter()
const isNew = !route.params.id
const r = ref(null)
let snapshot = ''

;(async () => {
  r.value = isNew ? emptyRecipe() : await getRecipe(route.params.id)
  if (!r.value) return router.replace('/')
  if (!r.value.ingredients.length) r.value.ingredients.push({ group: 'main', name: '', amount: '' })
  if (!r.value.steps.length) addStep()
  snapshot = JSON.stringify(r.value)
})()

const src = computed(() => sourceInfo(r.value?.sourceUrl))
function onPasteUrl(e) {
  const text = e.clipboardData?.getData('text')
  if (text) { e.preventDefault(); r.value.sourceUrl = extractUrl(text) }
}

/* ---------- 用料 ---------- */
const byGroup = g => r.value.ingredients.filter(i => i.group === g)
function addIng(group) { r.value.ingredients.push({ group, name: '', amount: '' }) }
function delIng(item) { r.value.ingredients = r.value.ingredients.filter(i => i !== item) }

const focusIng = ref(null)
const UNITS = ['小勺', '大勺', '克', '个', '根', '片', '瓣', '毫升']
const FREE = ['适量', '少许', '半小勺', '1 小勺', '1 大勺']
function quick(item, chip) {
  if (!UNITS.includes(chip)) { item.amount = chip; return }
  const num = (item.amount.match(/^[\d.半一二三四五六七八九十]+/) || ['1'])[0]
  item.amount = `${num} ${chip}`
}
const COMMON = {
  main: ['猪肉', '五花肉', '排骨', '鸡蛋', '鸡翅', '鸡腿', '牛肉', '虾', '土豆', '番茄', '青椒', '豆腐', '白菜', '茄子'],
  side: ['葱', '姜', '蒜', '小米辣', '干辣椒', '香菜', '洋葱', '胡萝卜'],
  seasoning: ['盐', '白糖', '冰糖', '生抽', '老抽', '蚝油', '料酒', '香醋', '白醋', '鸡精', '胡椒粉', '淀粉', '食用油', '香油', '辣椒油', '豆瓣酱', '花椒', '八角', '桂皮', '香叶', '番茄酱']
}

/* ---------- 步骤 ---------- */
function addStep() { r.value.steps.push({ text: '', heat: '', time: '', imageId: null }) }
function move(i, d) {
  const s = r.value.steps, j = i + d
  if (j < 0 || j >= s.length) return
  ;[s[i], s[j]] = [s[j], s[i]]
}
function delStep(i) {
  const s = r.value.steps[i]
  if ((s.text || s.imageId) && !confirm(`删除第 ${i + 1} 步？`)) return
  r.value.steps.splice(i, 1)
}
const TIMES = ['30秒', '1分钟', '3分钟', '5分钟', '10分钟', '20分钟']

/* ---------- 保存 ---------- */
const saving = ref(false)
async function save() {
  if (!r.value.name.trim()) { showToast('先给这道菜起个名字'); return }
  saving.value = true
  r.value.name = r.value.name.trim()
  const id = await saveRecipe(r.value)
  snapshot = JSON.stringify(r.value)
  showToast('已保存')
  router.replace(`/recipe/${id}`)
}
async function remove() {
  if (!confirm(`确定删除「${r.value.name}」？照片和做菜记录也会一起删掉，不能恢复。`)) return
  await deleteRecipe(r.value.id)
  showToast('已删除')
  router.replace('/')
}
function back() {
  if (JSON.stringify(r.value) !== snapshot && !confirm('改动还没保存，确定离开？')) return
  history.state?.back ? router.back() : router.replace('/')
}
</script>

<template>
  <div v-if="r" class="page-wrap edit">
    <div class="topbar">
      <button class="icon-btn" aria-label="返回" @click="back"><Icon name="back" /></button>
      <span class="title">{{ isNew ? '记一道新菜' : '编辑菜谱' }}</span>
      <button class="btn small" :disabled="saving" @click="save">保存</button>
    </div>

    <div class="pad">
      <ImagePicker v-model="r.coverId" label="成品照片（可以以后再补）" ratio="1 / .8" />

      <input v-model="r.name" class="name-input" placeholder="菜名，比如 番茄炒蛋" maxlength="30" />

      <div class="cats">
        <button v-for="c in settings.categories" :key="c" type="button" class="chip" :class="{ on: r.category === c }" @click="r.category = c">{{ c }}</button>
      </div>

      <div class="row2">
        <label class="field"><span>几人份</span><input v-model="r.servings" class="input" placeholder="2人份" /></label>
        <label class="field grow"><span>原教程链接 <i v-if="src" class="src" :style="{ color: src.color }">· {{ src.name }}</i></span>
          <input v-model="r.sourceUrl" class="input" placeholder="把 B站 / 小红书 的分享内容粘贴进来" @paste="onPasteUrl" @blur="r.sourceUrl = extractUrl(r.sourceUrl)" />
        </label>
      </div>
    </div>

    <!-- 用料 -->
    <section class="sec">
      <div class="sec-title"><h2>用料</h2><span class="eyebrow">Ingredients</span></div>
      <div v-for="g in GROUPS" :key="g.key" class="group">
        <h3>{{ g.label }}</h3>
        <div v-for="(item, k) in byGroup(g.key)" :key="k" class="ing-wrap">
          <div class="ing">
            <input v-model="item.name" class="input" :placeholder="g.key === 'seasoning' ? '比如 生抽' : '名称'" :list="'dl-' + g.key" @focus="focusIng = item" />
            <input v-model="item.amount" class="input amt" placeholder="用量" @focus="focusIng = item" />
            <button type="button" class="mini" aria-label="删除" @click="delIng(item)"><Icon name="close" /></button>
          </div>
          <div v-if="focusIng === item" class="quick">
            <button v-for="u in [...FREE, ...UNITS]" :key="u" type="button" class="chip" @mousedown.prevent @click="quick(item, u)">{{ u }}</button>
          </div>
        </div>
        <button type="button" class="add-line" @click="addIng(g.key)"><Icon name="plus" />加{{ g.label }}</button>
        <datalist :id="'dl-' + g.key"><option v-for="n in COMMON[g.key]" :key="n" :value="n" /></datalist>
      </div>
    </section>

    <!-- 步骤 -->
    <section class="sec">
      <div class="sec-title"><h2>步骤</h2><span class="eyebrow">Method · 按先后顺序</span></div>
      <div v-for="(s, i) in r.steps" :key="i" class="step">
        <div class="step-head">
          <span class="num">{{ String(i + 1).padStart(2, '0') }}</span>
          <div class="ops">
            <button type="button" class="mini" :disabled="i === 0" aria-label="上移" @click="move(i, -1)"><Icon name="up" /></button>
            <button type="button" class="mini" :disabled="i === r.steps.length - 1" aria-label="下移" @click="move(i, 1)"><Icon name="down" /></button>
            <button type="button" class="mini" aria-label="删除这步" @click="delStep(i)"><Icon name="trash" /></button>
          </div>
        </div>
        <textarea v-model="s.text" class="input" rows="2" placeholder="这一步做什么？比如：热锅倒油，油热后下蒜末爆香"></textarea>
        <div class="heat">
          <button v-for="h in HEATS" :key="h" type="button" class="chip" :class="{ on: s.heat === h }" @click="s.heat = h">{{ h || '不标火候' }}</button>
        </div>
        <div class="time">
          <Icon name="clock" />
          <input v-model="s.time" class="input" placeholder="时长（可不填）" />
        </div>
        <div class="quick">
          <button v-for="t in TIMES" :key="t" type="button" class="chip" :class="{ on: s.time === t }" @click="s.time = s.time === t ? '' : t">{{ t }}</button>
        </div>
        <div class="step-photo"><ImagePicker v-model="s.imageId" label="步骤图" ratio="16 / 9" /></div>
      </div>
      <button type="button" class="btn ghost" style="width:100%" @click="addStep"><Icon name="plus" style="width:18px" />加一步</button>
    </section>

    <section class="sec">
      <div class="sec-title"><h2>小贴士</h2><span class="eyebrow">Tips</span></div>
      <textarea v-model="r.tips" class="input" rows="3" placeholder="关键要点、容易出错的地方，比如：鸡蛋刚凝固就盛出"></textarea>
    </section>

    <section v-if="!isNew" class="sec">
      <button type="button" class="btn danger" style="width:100%" @click="remove"><Icon name="trash" style="width:18px" />删除这道菜</button>
    </section>
  </div>
</template>

<style scoped>
.pad { padding: 4px 16px 0; }
.name-input { width: 100%; border: 0; background: transparent; outline: 0; font-size: 32px; font-weight: 900; padding: 22px 0 10px; }
.name-input::placeholder { color: var(--line); }
.cats { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 20px; }
.row2 { display: flex; gap: 16px; }
.row2 .field:first-child { width: 90px; flex: none; }
.grow { flex: 1; min-width: 0; }
.src { font-style: normal; font-weight: 700; }

.sec { padding: 26px 16px 0; }
.sec-title { display: flex; align-items: baseline; justify-content: space-between; border-bottom: 2px solid var(--ink); padding-bottom: 8px; margin-bottom: 8px; }
.sec-title h2 { margin: 0; font-size: 20px; font-weight: 900; }
.group h3 { font-size: 12px; color: var(--ink-3); font-weight: 500; letter-spacing: .2em; margin: 16px 0 0; }
.ing { display: flex; gap: 12px; align-items: center; }
.ing .input:first-child { flex: 1.4; }
.ing .amt { flex: 1; }
.mini { width: 32px; height: 32px; flex: none; display: grid; place-items: center; color: var(--ink-3); border-radius: 50%; }
.mini:disabled { opacity: .25; }
.mini svg { width: 18px; height: 18px; }
.quick { display: flex; gap: 6px; overflow-x: auto; padding: 8px 0 4px; scrollbar-width: none; }
.quick::-webkit-scrollbar { display: none; }
.add-line { display: inline-flex; align-items: center; gap: 4px; margin-top: 10px; font-size: 14px; color: var(--ink-2); font-weight: 600; }
.add-line svg { width: 16px; height: 16px; }

.step { background: var(--card); border-radius: var(--radius); padding: 14px 16px 16px; margin: 12px 0; box-shadow: 0 1px 0 var(--line); }
.step-head { display: flex; justify-content: space-between; align-items: center; }
.num { font-family: var(--font-display-en); font-size: 26px; font-weight: 700; }
.ops { display: flex; }
.heat { display: flex; gap: 6px; margin-top: 12px; flex-wrap: wrap; }
.time { display: flex; align-items: center; gap: 8px; margin-top: 6px; color: var(--ink-3); }
.time svg { width: 18px; height: 18px; flex: none; }
.step-photo { margin-top: 10px; width: 60%; }
</style>
