<!-- 首页右上角 ··· ：把所有次要功能收在这里，首页保持干净 -->
<script lang="ts">
  import { app, saveTheme, refreshRecipes, toast } from '../store.svelte'
  import { exportAll, importAll, createRecipe } from '../db'
  import { navigate } from '../route'
  import { SAMPLES } from '../samples'

  let { onclose }: { onclose: () => void } = $props()

  const THEMES = [
    { id: 'auto', label: '自动' },
    { id: 'christmas', label: '圣诞' },
    { id: 'solar', label: '节气' },
  ] as const

  function go(view: 'add' | 'shop') {
    onclose()
    navigate({ view })
  }
  async function setTheme(id: (typeof THEMES)[number]['id']) {
    app.themeChoice = id
    await saveTheme()
  }

  async function backup() {
    const json = await exportAll()
    const d = new Date()
    const name = `菜谱备份-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}.json`
    const file = new File([json], name, { type: 'application/json' })
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: '菜谱备份' })
        return
      } catch (e) {
        if ((e as Error).name === 'AbortError') return
      }
    }
    const a = document.createElement('a')
    a.href = URL.createObjectURL(file)
    a.download = name
    a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 3000)
  }

  async function restore(e: Event) {
    const f = (e.currentTarget as HTMLInputElement).files?.[0]
    if (!f) return
    try {
      const { added } = await importAll(await f.text())
      await refreshRecipes()
      toast(`恢复了 ${added} 道菜`)
      onclose()
    } catch (err) {
      alert((err as Error).message)
    }
  }

  async function loadSamples() {
    for (const s of SAMPLES) await createRecipe(s)
    await refreshRecipes()
    app.page = 1
    onclose()
  }
</script>

<div class="mask" onclick={(e) => e.target === e.currentTarget && onclose()} role="presentation">
  <div class="sheet">
    <ul class="menu">
      <li><button onclick={() => go('add')}>记一道新菜 <small>→</small></button></li>
      <li><button onclick={() => go('shop')}>买菜清单 <small>{app.shop.ids.length ? `${app.shop.ids.length} 道菜` : ''}</small></button></li>
      <li class="themes">
        <span>首页风格</span>
        <div>
          {#each THEMES as th}
            <button class="tag" class:on={app.themeChoice === th.id} onclick={() => setTheme(th.id)}>{th.label}</button>
          {/each}
        </div>
      </li>
      <li><button onclick={backup}>导出备份 <small>换手机前记得导出</small></button></li>
      <li><label>从备份恢复 <small>选择备份文件</small><input type="file" accept=".json,application/json" hidden onchange={restore} /></label></li>
      {#if !app.recipes.length}
        <li><button onclick={loadSamples}>载入示例菜 <small>先看看效果</small></button></li>
      {/if}
    </ul>
  </div>
</div>

<style>
  .themes { display: flex; align-items: center; justify-content: space-between; padding: 14px 2px; border-bottom: 1px solid var(--line); font-size: 18px; font-weight: 600; }
  .themes div { display: flex; gap: 6px; }
</style>
