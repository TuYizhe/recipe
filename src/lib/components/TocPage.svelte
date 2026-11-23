<!--
  目录：按标签分组。一道菜有几个标签就出现在几个分组里，点哪个都翻到同一页。
  每组末尾"＋"直接新建一道带这个标签的菜。
-->
<script lang="ts">
  import { allTags, type SavedRecipe } from '../db'
  import type { Theme } from '../season'
  import { CATEGORY_EN } from '../util'
  import { DISH_START } from '../store.svelte'
  import { navigate } from '../route'

  let { recipes, theme, onjump }: { recipes: SavedRecipe[]; theme: Theme; onjump: (page: number) => void } = $props()

  const groups = $derived(
    allTags(recipes).map((tag) => ({
      tag,
      items: recipes.map((e, i) => ({ e, page: i + DISH_START })).filter((x) => x.e.recipe.tags.includes(tag)),
    })),
  )
</script>

<div class="toc" style:--accent={theme.accent}>
  <header>
    <span class="en">CONTENTS</span>
    <h2>目录</h2>
    <span class="count">{recipes.length} 道菜 · {groups.length} 类</span>
  </header>

  <div class="scroll" data-noflip>
    {#each groups as g, gi (g.tag)}
      <section>
        <h3>
          <span class="idx en">{String(gi + 1).padStart(2, '0')}</span>
          <b>{g.tag}</b>
          <span class="en">{CATEGORY_EN[g.tag] ?? ''}</span>
        </h3>
        <ul>
          {#each g.items as { e, page } (e.id)}
            <li>
              <button onclick={() => onjump(page)}>
                <span>{e.title}</span><i></i><span class="en pno">{String(page - 1).padStart(2, '0')}</span>
              </button>
            </li>
          {/each}
        </ul>
        <button class="add" onclick={() => navigate({ view: 'add', tag: g.tag })}>＋ 在「{g.tag}」里添一道</button>
      </section>
    {/each}

    {#if !groups.length}
      <p class="empty">目录还是空的<br />记下第一道菜，它会出现在这里</p>
    {/if}
  </div>
</div>

<style>
  .toc { position: absolute; inset: 0; background: var(--paper); display: flex; flex-direction: column; }
  header { padding: calc(76px + var(--safe-top)) 24px 14px; border-bottom: 1px solid var(--ink); margin: 0 0 0; display: grid; grid-template-columns: 1fr auto; align-items: end; }
  header .en { grid-column: 1 / -1; color: var(--ink-3); }
  h2 { margin: 6px 0 0; font-family: var(--serif); font-weight: 900; font-size: 44px; letter-spacing: 0.3em; line-height: 1; }
  .count { font-size: 12px; color: var(--ink-2); letter-spacing: 0.1em; padding-bottom: 4px; }

  .scroll { flex: 1; overflow-y: auto; padding: 4px 24px calc(30px + var(--safe-bottom)); overscroll-behavior: contain; touch-action: pan-y; }
  section { padding: 22px 0 6px; }
  h3 { display: flex; align-items: baseline; gap: 10px; margin: 0 0 4px; }
  h3 .idx { color: var(--accent); font-size: 12px; letter-spacing: 0.1em; }
  h3 b { font-family: var(--serif); font-size: 20px; font-weight: 900; letter-spacing: 0.15em; }
  h3 .en:last-child { margin-left: auto; color: var(--ink-3); font-size: 9px; }
  ul { list-style: none; margin: 0; padding: 0; }
  li button { width: 100%; display: flex; align-items: baseline; gap: 8px; padding: 11px 0 11px 30px; font-family: var(--serif); font-size: 16px; text-align: left; }
  li i { flex: 1; border-bottom: 1px dotted var(--ink-3); transform: translateY(-4px); }
  .pno { color: var(--ink-2); font-size: 12px; letter-spacing: 0.1em; }
  .add { margin: 4px 0 0 30px; font-size: 12px; color: var(--ink-3); letter-spacing: 0.1em; }
  .empty { text-align: center; color: var(--ink-3); line-height: 2; margin-top: 30%; }
</style>
