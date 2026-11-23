<!--
  一道菜 = 一张海报。
  竖排大标题「」、单色柔和底、居中的圆盘大图、角落竖排小字和印章、一条手绘弧线。
-->
<script lang="ts">
  import type { SavedRecipe } from '../db'
  import type { Theme } from '../season'
  import Plate from './Plate.svelte'
  import { CATEGORY_EN, daysAgo, hashPick } from '../util'

  let { entry, no, theme, hero = false }: { entry: SavedRecipe; no: number; theme: Theme; hero?: boolean } = $props()

  const r = $derived(entry.recipe)
  const tone = $derived(r.tone || hashPick(r.title, theme.tones))
  const mains = $derived(r.ingredients.filter((i) => i.group !== 'seasoning').map((i) => i.name).slice(0, 4))
  const seasonings = $derived(r.ingredients.filter((i) => i.group === 'seasoning').map((i) => i.name).slice(0, 5))
  const long = $derived(r.title.length > 5)
</script>

<div class="poster" class:hero style:--tone={tone} style:--accent={theme.accent}>
  <svg class="swoosh" viewBox="0 0 400 300" preserveAspectRatio="none" aria-hidden="true">
    <path d="M-20 210 C 80 120, 160 300, 260 190 S 380 90, 430 140" fill="none" stroke="rgba(255,255,255,.75)" stroke-width="10" stroke-linecap="round" />
  </svg>

  <header>
    <span class="en">No.{String(no).padStart(2, '0')}</span>
    <span class="en">{CATEGORY_EN[r.tags[0]] ?? 'MY KITCHEN'}</span>
  </header>

  <div class="titles">
    <h2 class="vt" class:long>「{r.title}」</h2>
    <p class="vt sub">{r.tags.slice(0, 2).join(' · ')}{r.servings ? ` · ${r.servings}` : ''}</p>
  </div>

  <div class="seal" aria-hidden="true">{theme.seal}</div>

  {#if !hero && (mains.length || seasonings.length)}
    <p class="vt side">
      {#if mains.length}<b>主料</b>{mains.join('　')}{/if}
      {#if seasonings.length}<br /><b>调料</b>{seasonings.join('　')}{/if}
    </p>
  {/if}

  <div class="disc"></div>
  <div class="plate"><Plate coverId={r.coverId} title={r.title} /></div>

  {#if !hero}
    <footer>
      <span>{daysAgo(entry.lastCooked)}</span>
      <i></i>
      <span>{entry.logs?.length ? `做过 ${entry.logs.length} 次` : '点开看做法'}</span>
    </footer>
  {/if}
</div>

<style>
  .poster {
    position: absolute; inset: 0; overflow: hidden;
    background: linear-gradient(170deg, color-mix(in srgb, var(--tone) 70%, white) 0%, var(--tone) 55%, color-mix(in srgb, var(--tone) 92%, black) 100%);
    color: var(--ink);
  }
  .swoosh { position: absolute; left: 0; right: 0; bottom: 18%; width: 100%; height: 38%; }

  header {
    position: absolute; top: calc(78px + var(--safe-top)); right: 22px;
    display: flex; flex-direction: column; align-items: flex-end; gap: 6px; color: var(--ink-2);
  }
  .hero header { top: calc(70px + var(--safe-top)); }

  .titles { position: absolute; top: calc(74px + var(--safe-top)); left: 18px; display: flex; gap: 6px; }
  h2 {
    margin: 0; font-family: var(--serif); font-weight: 900; line-height: 1.05;
    font-size: clamp(40px, 12.5vw, 60px); letter-spacing: 0.04em; max-height: 52vh;
  }
  h2.long { font-size: clamp(32px, 9.5vw, 46px); }
  .sub { margin: 52px 0 0; font-size: 12px; color: var(--ink-2); letter-spacing: 0.3em; }

  .seal {
    position: absolute; top: calc(150px + var(--safe-top)); right: 22px;
    width: 46px; height: 46px; border-radius: 50%; border: 1.5px solid var(--accent); color: var(--accent);
    display: grid; place-items: center; font-family: var(--serif); font-weight: 900; font-size: 14px; letter-spacing: 0.05em;
    transform: rotate(-12deg);
  }
  .hero .seal { top: calc(140px + var(--safe-top)); }

  .side {
    position: absolute; right: 26px; top: calc(222px + var(--safe-top)); margin: 0;
    font-size: 11.5px; line-height: 2; color: var(--ink-2); max-height: 34vh; overflow: hidden;
  }
  .side b { color: var(--ink); font-weight: 700; margin-bottom: 0.6em; display: inline-block; }

  .disc, .plate { position: absolute; left: 50%; border-radius: 50%; }
  .disc {
    width: min(92vw, 54vh, 520px); aspect-ratio: 1; bottom: 6%; transform: translateX(-46%);
    background: rgba(255, 255, 255, 0.32);
  }
  .plate { width: min(70vw, 42vh, 400px); aspect-ratio: 1; bottom: 13%; transform: translateX(-42%); }
  .hero .disc { bottom: -4%; }
  .hero .plate { bottom: 6%; }

  footer {
    position: absolute; left: 22px; right: 22px; bottom: calc(26px + var(--safe-bottom));
    display: flex; align-items: center; gap: 12px; font-size: 12px; color: var(--ink-2); letter-spacing: 0.08em;
  }
  footer i { flex: 1; height: 1px; background: var(--line); }
</style>
