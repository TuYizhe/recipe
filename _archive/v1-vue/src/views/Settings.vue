<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { settings, saveSetting, exportBackup, importBackup, requestPersist, allRecipes } from '../db'
import { resolveTheme, currentSolarTerm } from '../themes'
import Icon from '../components/Icon.vue'
import { showToast } from '../toast'

const router = useRouter()
const term = currentSolarTerm()
const autoName = computed(() => resolveTheme(new Date(), 'auto').name)
const THEME_OPTS = computed(() => [
  { id: 'auto', label: '跟随节日 / 节气', sub: `现在是「${autoName.value}」` },
  { id: 'christmas', label: '圣诞', sub: '红绿金 · 雪花' },
  { id: 'solar', label: '节气', sub: `当前：${term.name}` }
])
async function setTheme(id) { settings.theme = id; await saveSetting('theme') }

/* 分类 */
const newCat = ref('')
async function addCat() {
  const c = newCat.value.trim()
  if (!c || settings.categories.includes(c)) return
  settings.categories = [...settings.categories, c]
  newCat.value = ''
  await saveSetting('categories')
}
async function delCat(c) {
  const used = (await allRecipes()).filter(r => r.category === c).length
  if (used) { showToast(`还有 ${used} 道菜在「${c}」里，先把它们改到别的分类`); return }
  settings.categories = settings.categories.filter(x => x !== c)
  await saveSetting('categories')
}

/* 备份 */
const persisted = ref(null)
navigator.storage?.persisted?.().then(v => (persisted.value = v))
async function doExport() {
  const blob = await exportBackup()
  const d = new Date()
  const name = `菜谱备份-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}.json`
  const file = new File([blob], name, { type: 'application/json' })
  // 手机上优先弹出系统分享（可以直接发到微信/存网盘）
  if (navigator.canShare?.({ files: [file] })) {
    try { await navigator.share({ files: [file], title: '菜谱备份' }); return } catch (e) { if (e.name === 'AbortError') return }
  }
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob); a.download = name; a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 2000)
}
const fileInput = ref(null)
async function doImport(e) {
  const f = e.target.files?.[0]
  e.target.value = ''
  if (!f) return
  if (!confirm('导入会用备份文件覆盖现在手机里的所有菜谱，确定吗？')) return
  try { showToast(`已恢复 ${await importBackup(f)} 道菜`) } catch (err) { alert('导入失败：' + err.message) }
}
async function askPersist() { persisted.value = await requestPersist(); showToast(persisted.value ? '已开启' : '浏览器没有同意，记得定期导出备份') }
const back = () => (history.state?.back ? router.back() : router.replace('/'))
</script>

<template>
  <div class="page-wrap settings">
    <div class="topbar">
      <button class="icon-btn" aria-label="返回" @click="back"><Icon name="back" /></button>
      <span class="title">设置</span>
      <span style="width:40px"></span>
    </div>

    <section class="sec">
      <div class="sec-title"><h2>首页风格</h2><span class="eyebrow">Theme</span></div>
      <ul class="opts">
        <li v-for="o in THEME_OPTS" :key="o.id" :class="{ on: settings.theme === o.id }" @click="setTheme(o.id)">
          <span class="radio"></span><div><b>{{ o.label }}</b><small>{{ o.sub }}</small></div>
        </li>
      </ul>
    </section>

    <section class="sec">
      <div class="sec-title"><h2>分类</h2><span class="eyebrow">Categories</span></div>
      <div class="cats">
        <span v-for="c in settings.categories" :key="c" class="chip">{{ c }}<button aria-label="删除分类" @click="delCat(c)"><Icon name="close" /></button></span>
      </div>
      <div class="add-cat">
        <input v-model="newCat" class="input" placeholder="新分类，比如 下饭菜" maxlength="8" @keyup.enter="addCat" />
        <button class="btn small" @click="addCat">添加</button>
      </div>
    </section>

    <section class="sec">
      <div class="sec-title"><h2>备份</h2><span class="eyebrow">Backup</span></div>
      <p class="muted">菜谱和照片都只存在这台手机的浏览器里。清除浏览器数据或换手机前，记得先导出一份备份。</p>
      <div class="btns">
        <button class="btn" @click="doExport">导出备份</button>
        <button class="btn ghost" @click="fileInput.click()">从备份恢复</button>
        <input ref="fileInput" type="file" accept="application/json,.json" hidden @change="doImport" />
      </div>
      <p class="persist">
        防止浏览器自动清理：<b>{{ persisted ? '已开启' : '未开启' }}</b>
        <button v-if="!persisted" class="link" @click="askPersist">开启</button>
      </p>
    </section>
  </div>
</template>

<style scoped>
.sec { padding: 26px 20px 0; }
.sec-title { display: flex; align-items: baseline; justify-content: space-between; border-bottom: 2px solid var(--ink); padding-bottom: 8px; margin-bottom: 6px; }
.sec-title h2 { margin: 0; font-size: 20px; font-weight: 900; }
.opts { list-style: none; margin: 0; padding: 0; }
.opts li { display: flex; gap: 14px; align-items: center; padding: 14px 0; border-bottom: 1px solid var(--line); cursor: pointer; }
.opts div { display: flex; flex-direction: column; }
.opts small { color: var(--ink-3); font-size: 12px; margin-top: 2px; }
.radio { width: 20px; height: 20px; border-radius: 50%; border: 1.5px solid var(--ink); flex: none; }
.on .radio { box-shadow: inset 0 0 0 4px var(--paper); background: var(--ink); }
.cats { display: flex; flex-wrap: wrap; gap: 8px; margin: 14px 0; }
.cats button { display: grid; place-items: center; color: var(--ink-3); }
.cats svg { width: 14px; height: 14px; }
.add-cat { display: flex; gap: 12px; align-items: center; }
.muted { color: var(--ink-3); font-size: 14px; line-height: 1.8; }
.btns { display: flex; gap: 10px; }
.btns .btn { flex: 1; }
.persist { font-size: 13px; color: var(--ink-2); margin-top: 16px; }
.link { text-decoration: underline; margin-left: 8px; font-size: 13px; }
</style>
