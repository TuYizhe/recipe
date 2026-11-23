<script lang="ts">
  import PosterBook from './PosterBook.svelte'
  import Poster from './Poster.svelte'
  import CoverPoster from './CoverPoster.svelte'
  import Snow from './Snow.svelte'
  import Icon from './Icon.svelte'
  import Plate from './Plate.svelte'
  import MoreSheet from './MoreSheet.svelte'
  import TocPage from './TocPage.svelte'
  import { app, theme, DISH_START } from '../store.svelte'
  import { matchesQuery } from '../db'
  import { navigate } from '../route'

  const t = $derived(theme())
  const n = $derived(app.recipes.length)
  const count = $derived(n + DISH_START + 1) // 封面 + 目录 + 菜 + 末页

  let searching = $state(false)
  let q = $state('')
  let more = $state(false)
  let input = $state<HTMLInputElement>()

  const results = $derived(q.trim() ? app.recipes.map((e, i) => ({ e, page: i + DISH_START })).filter((x) => matchesQuery(x.e, q)) : [])

  function openSearch() {
    searching = true
    setTimeout(() => input?.focus(), 50)
  }
  function pick(page: number) {
    searching = false
    q = ''
    app.page = page
  }
  function open(i: number) {
    navigate({ view: 'recipe', id: app.recipes[i].id })
  }
  $effect(() => {
    if (app.page > count - 1) app.page = count - 1
  })
</script>

<div class="home view">
  <PosterBook {count} bind:index={app.page}>
    {#snippet page(i: number)}
      {#if i === 0}
        <CoverPoster theme={t} recipes={app.recipes} onjump={(p) => pick(p)} />
      {:else if i === 1}
        <TocPage recipes={app.recipes} theme={t} onjump={(p) => pick(p)} />
      {:else if i < n + DISH_START}
        {@const e = app.recipes[i - DISH_START]}
        <button class="hit" onclick={() => open(i - DISH_START)} aria-label="打开 {e.title}">
          <Poster entry={e} no={i - 1} theme={t} />
        </button>
      {:else}
        <button class="hit end" onclick={() => navigate({ view: 'add' })}>
          <span class="en">NEW DISH</span>
          <span class="ring"><Icon name="plus" /></span>
          <span class="vt big">「添一道新菜」</span>
          <span class="hint">做完一道新菜，趁还记得，把用料和步骤记下来</span>
        </button>
      {/if}
    {/snippet}
  </PosterBook>

  {#if t.snow}<Snow />{/if}

  <div class="bar" data-noflip>
    <button class="search" onclick={openSearch}><Icon name="search" /><span>搜菜名、食材</span></button>
    <button class="round" onclick={() => (more = true)} aria-label="更多"><Icon name="more" /></button>
  </div>
</div>

{#if searching}
  <div class="search-layer">
    <div class="sbar">
      <Icon name="search" />
      <input bind:this={input} bind:value={q} type="search" placeholder="比如：土豆、可乐鸡翅" />
      <button onclick={() => { searching = false; q = '' }}>取消</button>
    </div>
    <ul>
      {#each results as { e, page } (e.id)}
        <li>
          <button onclick={() => pick(page)}>
            <span class="dot"><Plate coverId={e.recipe.coverId} title={e.title} /></span>
            <span class="txt"><b>{e.title}</b><small>{e.recipe.tags.join(' · ')}</small></span>
            <span class="en">P.{String(page - 1).padStart(2, '0')}</span>
          </button>
        </li>
      {/each}
    </ul>
    {#if q.trim() && !results.length}<p class="none">没有找到「{q}」</p>{/if}
  </div>
{/if}

{#if more}<MoreSheet onclose={() => (more = false)} />{/if}

<style>
  .home { position: fixed; inset: 0; overflow: hidden; background: #e9e4da; }
  .hit { position: absolute; inset: 0; width: 100%; text-align: left; }

  .end {
    background: var(--paper); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 22px; text-align: center;
  }
  .end .en { position: absolute; top: calc(84px + var(--safe-top)); color: var(--ink-3); }
  .ring { width: 84px; height: 84px; border-radius: 50%; border: 1px solid var(--ink); display: grid; place-items: center; }
  .ring :global(svg) { width: 30px; height: 30px; stroke-width: 1.2; }
  .big { font-family: var(--serif); font-weight: 900; font-size: 34px; letter-spacing: 0.1em; }
  .hint { font-size: 12px; color: var(--ink-3); letter-spacing: 0.1em; max-width: 14em; line-height: 1.8; }

  .bar {
    position: fixed; z-index: 20; top: calc(16px + var(--safe-top)); left: 16px; right: 16px;
    display: flex; gap: 10px; max-width: 560px; margin: 0 auto;
  }
  .search {
    flex: 1; height: 40px; border-radius: 999px; display: flex; align-items: center; gap: 8px; padding: 0 16px;
    background: rgba(255, 255, 255, 0.55); backdrop-filter: blur(10px); color: var(--ink-2); font-size: 14px;
  }
  .search :global(svg) { width: 17px; height: 17px; }

  .search-layer { position: fixed; inset: 0; z-index: 70; background: var(--paper); padding: calc(14px + var(--safe-top)) 18px 0; animation: fade 0.2s; overflow: auto; }
  .sbar { display: flex; align-items: center; gap: 10px; border-bottom: 1px solid var(--ink); padding: 8px 0; }
  .sbar :global(svg) { width: 20px; height: 20px; flex: none; }
  .sbar input { flex: 1; min-width: 0; border: 0; outline: 0; background: transparent; font-size: 18px; }
  .sbar button { font-size: 15px; color: var(--ink-2); }
  ul { list-style: none; margin: 8px 0 0; padding: 0; }
  li button { width: 100%; display: flex; align-items: center; gap: 14px; padding: 12px 0; border-bottom: 1px solid var(--line); text-align: left; }
  .dot { width: 46px; height: 46px; flex: none; }
  .txt { flex: 1; display: flex; flex-direction: column; }
  .txt b { font-size: 17px; font-family: var(--serif); }
  .txt small { font-size: 12px; color: var(--ink-3); margin-top: 2px; }
  li .en { color: var(--ink-3); }
  .none { color: var(--ink-3); text-align: center; margin-top: 60px; }
</style>
