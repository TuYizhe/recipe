<!-- 买菜清单：同名食材自动合并，"1 小勺 + 半小勺" 合成 "1.5 小勺" -->
<script lang="ts">
  import Icon from './Icon.svelte'
  import { app, saveShop } from '../store.svelte'
  import { goBack } from '../route'
  import { mergeAmounts } from '../util'

  let picking = $state(false)
  let showSeason = $state(false)

  const chosen = $derived(app.shop.ids.map((id) => app.recipes.find((e) => e.id === id)).filter((e) => !!e))

  const items = $derived.by(() => {
    const map = new Map<string, { name: string; seasoning: boolean; amounts: string[]; from: string[] }>()
    for (const e of chosen) {
      for (const i of e.recipe.ingredients) {
        const it = map.get(i.name) ?? { name: i.name, seasoning: true, amounts: [], from: [] }
        if (i.group !== 'seasoning') it.seasoning = false
        it.amounts.push(i.amount)
        if (!it.from.includes(e.title)) it.from.push(e.title)
        map.set(i.name, it)
      }
    }
    return [...map.values()]
  })
  const order = <T extends { name: string }>(l: T[]) => [...l].sort((a, b) => +!!app.shop.checked[a.name] - +!!app.shop.checked[b.name])
  const buy = $derived(order(items.filter((i) => !i.seasoning)))
  const season = $derived(order(items.filter((i) => i.seasoning)))
  const left = $derived(buy.filter((i) => !app.shop.checked[i.name]).length)

  async function check(name: string) {
    app.shop.checked[name] = !app.shop.checked[name]
    await saveShop()
  }
  async function toggle(id: number) {
    app.shop.ids = app.shop.ids.includes(id) ? app.shop.ids.filter((x) => x !== id) : [...app.shop.ids, id]
    await saveShop()
  }
  async function clear() {
    if (!confirm('清空清单？')) return
    app.shop = { ids: [], checked: {} }
    await saveShop()
  }
</script>

<div class="shop view">
  <div class="top">
    <button class="round" onclick={() => goBack()} aria-label="返回"><Icon name="back" /></button>
    {#if chosen.length}<button class="clear" onclick={clear}>清空</button>{/if}
  </div>

  <header>
    <span class="en">SHOPPING LIST</span>
    <h1>{chosen.length ? `还要买 ${left} 样` : '想做什么菜？'}</h1>
    <div class="dishes">
      {#each chosen as e (e.id)}<button class="tag on" onclick={() => toggle(e.id)}>{e.title} ✕</button>{/each}
      <button class="tag" onclick={() => (picking = true)}>＋ 选菜</button>
    </div>
  </header>

  {#if chosen.length}
    <ul class="list">
      {#each buy as it (it.name)}
        <li class:done={app.shop.checked[it.name]}>
          <button onclick={() => check(it.name)}>
            <span class="box">{#if app.shop.checked[it.name]}<Icon name="check" />{/if}</span>
            <span class="txt"><b>{it.name}</b><small>{it.from.join('、')}</small></span>
            <span class="amt">{mergeAmounts(it.amounts)}</span>
          </button>
        </li>
      {/each}
    </ul>

    {#if season.length}
      <button class="season-toggle" onclick={() => (showSeason = !showSeason)}>
        调料 {season.length} 样 · {showSeason ? '收起' : '家里一般都有，点开看看'}
      </button>
      {#if showSeason}
        <ul class="list">
          {#each season as it (it.name)}
            <li class:done={app.shop.checked[it.name]}>
              <button onclick={() => check(it.name)}>
                <span class="box">{#if app.shop.checked[it.name]}<Icon name="check" />{/if}</span>
                <span class="txt"><b>{it.name}</b><small>{it.from.join('、')}</small></span>
                <span class="amt">{mergeAmounts(it.amounts)}</span>
              </button>
            </li>
          {/each}
        </ul>
      {/if}
    {/if}
  {:else}
    <p class="empty">挑几道想做的菜，<br />要买的食材会自动合到一起。</p>
  {/if}
</div>

{#if picking}
  <div class="mask" onclick={(e) => e.target === e.currentTarget && (picking = false)} role="presentation">
    <div class="sheet">
      <ul class="menu">
        {#each app.recipes as e (e.id)}
          <li><button onclick={() => toggle(e.id)}>{e.title} <small>{app.shop.ids.includes(e.id) ? '✓ 已选' : e.recipe.tags[0]}</small></button></li>
        {/each}
      </ul>
      {#if !app.recipes.length}<p class="empty">还没有菜谱</p>{/if}
      <button class="pill" style="width:100%;margin-top:20px" onclick={() => (picking = false)}>好了</button>
    </div>
  </div>
{/if}

<style>
  .shop { max-width: 560px; margin: 0 auto; padding: 0 22px calc(40px + var(--safe-bottom)); }
  .top { display: flex; justify-content: space-between; align-items: center; padding: calc(16px + var(--safe-top)) 0 0; }
  .top .round { background: transparent; }
  .clear { font-size: 14px; color: var(--ink-2); }
  header { padding: 30px 0 10px; }
  header .en { color: var(--ink-3); }
  h1 { font-family: var(--serif); font-weight: 900; font-size: 40px; margin: 10px 0 20px; letter-spacing: 0.06em; }
  .dishes { display: flex; flex-wrap: wrap; gap: 8px; }
  .list { list-style: none; margin: 26px 0 0; padding: 0; border-top: 1px solid var(--ink); }
  .list li button { width: 100%; display: flex; align-items: center; gap: 14px; padding: 16px 0; border-bottom: 1px solid var(--line); text-align: left; }
  .box { width: 22px; height: 22px; border-radius: 50%; border: 1px solid var(--ink); display: grid; place-items: center; flex: none; }
  .box :global(svg) { width: 14px; height: 14px; stroke-width: 2.4; }
  .done .box { background: var(--ink); color: var(--paper); }
  .done { opacity: 0.35; }
  .done b { text-decoration: line-through; }
  .txt { flex: 1; display: flex; flex-direction: column; }
  .txt b { font-size: 17px; font-weight: 600; }
  .txt small { font-size: 12px; color: var(--ink-3); margin-top: 3px; }
  .amt { font-size: 15px; font-weight: 600; }
  .season-toggle { margin-top: 26px; font-size: 14px; color: var(--ink-2); letter-spacing: 0.06em; }
  .empty { color: var(--ink-3); text-align: center; line-height: 1.9; margin-top: 60px; }
</style>
