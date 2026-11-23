<script lang="ts">
  import Poster from './Poster.svelte'
  import Icon from './Icon.svelte'
  import { getRecipe, latestLog, removeRecipe, removeLog, type SavedRecipe } from '../db'
  import { app, theme, refreshRecipes, saveShop, toast } from '../store.svelte'
  import { navigate, goBack } from '../route'
  import { daysAgo, fmtDate, sourceName } from '../util'
  import type { Group } from '../types'

  let { id }: { id: number } = $props()
  let entry = $state<SavedRecipe | null>(null)
  let menu = $state(false)

  async function load() {
    entry = (await getRecipe(id)) ?? null
    if (!entry) navigate({ view: 'home' }, true)
  }
  $effect(() => {
    void id
    load()
  })

  const t = $derived(theme())
  const no = $derived(app.recipes.findIndex((e) => e.id === id) + 1)
  function openTag() {
    app.page = 1
    navigate({ view: 'home' })
  }
  const r = $derived(entry?.recipe)
  const last = $derived(entry ? latestLog(entry) : null)
  const logs = $derived(entry ? [...entry.logs].sort((a, b) => b.date - a.date) : [])
  const GROUPS: [Group, string][] = [['main', '主料'], ['side', '辅料'], ['seasoning', '调料']]
  const inShop = $derived(app.shop.ids.includes(id))

  async function toggleShop() {
    app.shop.ids = inShop ? app.shop.ids.filter((x) => x !== id) : [...app.shop.ids, id]
    await saveShop()
    menu = false
    toast(inShop ? '已加入买菜清单' : '已从清单移除')
  }
  async function del() {
    if (!entry || !confirm(`删除「${entry.title}」？照片和做菜记录会一起删掉。`)) return
    await removeRecipe(id)
    app.shop.ids = app.shop.ids.filter((x) => x !== id)
    await saveShop()
    await refreshRecipes()
    navigate({ view: 'home' }, true)
  }
  async function delLog(date: number) {
    if (!confirm('删除这条记录？')) return
    await removeLog(id, date)
    await load()
    await refreshRecipes()
  }
</script>

{#if entry && r}
  <article class="view">
    <div class="hero"><Poster {entry} no={no || 1} theme={t} hero /></div>

    <div class="top">
      <button class="round" onclick={() => goBack()} aria-label="返回"><Icon name="back" /></button>
      <button class="round" onclick={() => (menu = true)} aria-label="更多"><Icon name="more" /></button>
    </div>

    <div class="body">
      <p class="stat">
        <span>{daysAgo(entry.lastCooked)}</span>
        {#if logs.length}<span>做过 {logs.length} 次</span>{/if}
        {#if r.sourceUrl}<a href={r.sourceUrl} target="_blank" rel="noopener">看{sourceName(r.sourceUrl)}原教程 ↗</a>{/if}
      </p>

      <div class="tags">
        {#each r.tags as tg, ti}
          <button class="tag" class:on={ti === 0} onclick={openTag}># {tg}</button>
        {/each}
      </div>

      {#if last?.note}
        <blockquote>
          <span class="en">LAST TIME · {fmtDate(last.date)}</span>
          <p>{last.note}</p>
        </blockquote>
      {/if}

      <section>
        <h3><span>用料</span><span class="en">INGREDIENTS</span></h3>
        {#each GROUPS as [g, label]}
          {@const items = r.ingredients.filter((i) => i.group === g)}
          {#if items.length}
            <div class="group">
              <span class="glabel vt">{label}</span>
              <ul>
                {#each items as i}<li><span>{i.name}</span><b>{i.amount}</b></li>{/each}
              </ul>
            </div>
          {/if}
        {/each}
      </section>

      <section>
        <h3><span>步骤</span><span class="en">METHOD</span></h3>
        <ol>
          {#each r.steps as s, k}
            <li>
              <span class="num">{String(k + 1).padStart(2, '0')}</span>
              <div>
                {#if s.heat || s.time}<em>{[s.heat, s.time].filter(Boolean).join(' · ')}</em>{/if}
                <p>{s.text}</p>
              </div>
            </li>
          {/each}
        </ol>
      </section>

      {#if r.tips}
        <section>
          <h3><span>要点</span><span class="en">TIPS</span></h3>
          <p class="tips">{r.tips}</p>
        </section>
      {/if}

      {#if logs.length}
        <section>
          <h3><span>记录</span><span class="en">JOURNAL</span></h3>
          <ul class="logs">
            {#each logs as l (l.date)}
              <li>
                <span class="en">{fmtDate(l.date)}</span>
                <span class="stars">{'★'.repeat(l.rating)}<i>{'★'.repeat(5 - l.rating)}</i></span>
                <button class="x" onclick={() => delLog(l.date)} aria-label="删除记录"><Icon name="close" /></button>
                {#if l.note}<p>{l.note}</p>{/if}
              </li>
            {/each}
          </ul>
        </section>
      {/if}
    </div>

    <div class="cta">
      <button class="pill" onclick={() => navigate({ view: 'cook', id })}>开始做菜</button>
    </div>
  </article>

  {#if menu}
    <div class="mask" onclick={(e) => e.target === e.currentTarget && (menu = false)} role="presentation">
      <div class="sheet">
        <ul class="menu">
          <li><button onclick={() => navigate({ view: 'edit', id })}>编辑 <small>改用料、步骤、照片</small></button></li>
          <li><button onclick={toggleShop}>{inShop ? '移出买菜清单' : '加入买菜清单'} <small></small></button></li>
          <li><button class="danger" onclick={del}>删除这道菜 <small></small></button></li>
        </ul>
      </div>
    </div>
  {/if}
{/if}

<style>
  .hero { position: relative; height: min(76vh, 680px); }
  .top { position: fixed; z-index: 20; top: calc(16px + var(--safe-top)); left: 16px; right: 16px; display: flex; justify-content: space-between; pointer-events: none; }
  .top > * { pointer-events: auto; }

  .body { max-width: 560px; margin: 0 auto; padding: 22px 24px calc(120px + var(--safe-bottom)); }
  .stat { display: flex; flex-wrap: wrap; gap: 6px 18px; margin: 0; font-size: 13px; color: var(--ink-2); letter-spacing: 0.06em; }
  .stat a { color: var(--ink); text-underline-offset: 4px; }

  .tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 16px; }
  blockquote { margin: 26px 0 0; padding: 0 0 0 16px; border-left: 2px solid var(--ink); }
  blockquote .en { color: var(--ink-3); }
  blockquote p { margin: 8px 0 0; font-family: var(--serif); font-size: 18px; line-height: 1.7; font-weight: 600; }

  section { margin-top: 44px; }
  h3 { display: flex; align-items: baseline; justify-content: space-between; margin: 0 0 8px; padding-bottom: 10px; border-bottom: 1px solid var(--ink); }
  h3 span:first-child { font-family: var(--serif); font-size: 22px; font-weight: 900; letter-spacing: 0.2em; }
  h3 .en { color: var(--ink-3); }

  .group { display: flex; gap: 14px; padding-top: 14px; }
  .glabel { font-size: 11px; color: var(--ink-3); letter-spacing: 0.4em; padding-top: 12px; }
  .group ul { flex: 1; list-style: none; margin: 0; padding: 0; }
  .group li { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid var(--line); font-size: 16px; }
  .group b { font-weight: 600; }

  ol { list-style: none; margin: 0; padding: 0; }
  ol li { display: flex; gap: 18px; padding: 20px 0; border-bottom: 1px solid var(--line); }
  .num { font-family: var(--en); font-size: 30px; line-height: 1; min-width: 40px; }
  ol em { display: block; font-style: normal; font-size: 12px; color: var(--ink-2); letter-spacing: 0.15em; margin-bottom: 6px; }
  ol p { margin: 0; font-size: 16px; line-height: 1.8; }

  .tips { margin: 14px 0 0; font-size: 15px; line-height: 1.8; color: var(--ink-2); }

  .logs { list-style: none; margin: 0; padding: 0; }
  .logs li { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; padding: 14px 0; border-bottom: 1px solid var(--line); }
  .logs .en { color: var(--ink-2); font-size: 11px; }
  .stars { font-size: 12px; letter-spacing: 2px; } .stars i { font-style: normal; color: var(--line); }
  .x { margin-left: auto; width: 24px; height: 24px; color: var(--ink-3); }
  .x :global(svg) { width: 16px; height: 16px; }
  .logs p { width: 100%; margin: 0; color: var(--ink-2); line-height: 1.7; font-size: 14px; }

  .cta { position: fixed; left: 0; right: 0; bottom: 0; padding: 20px 24px calc(18px + var(--safe-bottom)); display: flex; justify-content: center; background: linear-gradient(transparent, var(--paper) 45%); }
  .cta .pill { width: min(100%, 320px); }
</style>
