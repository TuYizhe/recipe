<!--
  做菜模式：一屏一步、大字、屏幕常亮。
  这一步用到的食材和用量直接列在下面，不用来回翻。
  最后一步做完 → 写一句心得，下次打开第一眼就能看到。
-->
<script lang="ts">
  import Icon from './Icon.svelte'
  import { getRecipe, addLog, type SavedRecipe } from '../db'
  import { theme, refreshRecipes, toast } from '../store.svelte'
  import { navigate } from '../route'
  import { hashPick } from '../util'
  import { extractStepTimers, formatClock } from '../timers'
  import { kitchen, keepAwake, tapTimer, clearTimers } from '../kitchen.svelte'

  let { id }: { id: number } = $props()
  let entry = $state<SavedRecipe | null>(null)
  let k = $state(0)
  let finishing = $state(false)
  let rating = $state(0)
  let note = $state('')

  $effect(() => {
    getRecipe(id).then((e) => (entry = e ?? null))
    keepAwake(true)
    return () => {
      keepAwake(false)
      clearTimers()
    }
  })

  const r = $derived(entry?.recipe)
  const steps = $derived(r?.steps ?? [])
  const step = $derived(steps[k])
  const tone = $derived(r ? r.tone || hashPick(r.title, theme().tones) : '#eee')
  const used = $derived(step && r ? r.ingredients.filter((i) => i.name && step.text.includes(i.name)) : [])
  const stepTimers = $derived(step ? extractStepTimers(`${step.time} ${step.text}`).slice(0, 2) : [])

  function next() {
    if (k < steps.length - 1) k++
    else finishing = true
  }
  function prev() {
    if (finishing) finishing = false
    else if (k > 0) k--
  }
  function close() {
    navigate({ view: 'recipe', id }, true)
  }
  async function save() {
    await addLog(id, { rating, note: note.trim() })
    await refreshRecipes()
    toast('记下了')
    close()
  }

  let sx = 0
  const touchStart = (e: TouchEvent) => (sx = e.touches[0].clientX)
  const touchEnd = (e: TouchEvent) => {
    const dx = e.changedTouches[0].clientX - sx
    if (Math.abs(dx) > 50) dx < 0 ? next() : prev()
  }
</script>

{#if r}
  <div class="cook" style:--tone={tone} ontouchstart={touchStart} ontouchend={touchEnd} role="main">
    <div class="top">
      <button class="round" onclick={close} aria-label="退出做菜模式"><Icon name="close" /></button>
      <span class="title">{r.title}</span>
      <span class="en">{finishing ? 'DONE' : `${String(k + 1).padStart(2, '0')} / ${String(steps.length).padStart(2, '0')}`}</span>
    </div>
    <div class="progress"><i style:width="{finishing ? 100 : ((k + 1) / Math.max(1, steps.length)) * 100}%"></i></div>

    {#if !finishing && step}
      <div class="stage">
        <span class="big-num">{String(k + 1).padStart(2, '0')}</span>
        {#if step.heat}<span class="heat">{step.heat}</span>{/if}
        <p class="text">{step.text}</p>

        {#if used.length}
          <ul class="used">
            {#each used as i}<li><span>{i.name}</span><b>{i.amount}</b></li>{/each}
          </ul>
        {/if}

        {#if stepTimers.length}
          <div class="timers">
            {#each stepTimers as tm, ti}
              {@const key = `${k}-${ti}`}
              {@const st = kitchen.timers[key]}
              <button class="timer" class:run={st?.running} class:done={st?.done} onclick={() => tapTimer(key, tm.label, tm.seconds)}>
                <b>{st ? (st.done ? '时间到' : formatClock(st.remaining)) : tm.label}</b>
                <small>{st ? (st.done ? '点一下停止' : st.running ? '点一下暂停' : '点一下继续') : '点一下开始计时'}</small>
              </button>
            {/each}
          </div>
        {/if}
      </div>

      <div class="nav">
        {#if k > 0}<button class="pill light" onclick={prev}>上一步</button>{/if}
        <button class="pill" onclick={next}>{k < steps.length - 1 ? '下一步' : '做完了'}</button>
      </div>
    {:else}
      <div class="stage finish">
        <span class="vt big">「做好了」</span>
        <p class="ask">这次做得怎么样？</p>
        <div class="stars">
          {#each [1, 2, 3, 4, 5] as n}
            <button class:on={n <= rating} onclick={() => (rating = n)} aria-label="{n} 星">★</button>
          {/each}
        </div>
        <textarea class="input" rows="3" bind:value={note} placeholder="有什么要记住的？比如：盐少放一点，下次多煎一分钟"></textarea>
      </div>
      <div class="nav">
        <button class="pill" onclick={save}>记下来</button>
      </div>
    {/if}
  </div>

  <div class="floats">
    {#each Object.entries(kitchen.timers).filter(([key]) => !key.startsWith(`${k}-`) || finishing) as [key, tm] (key)}
      <button class="float" class:done={tm.done} onclick={() => tapTimer(key, tm.label, tm.total)}>
        第 {+key.split('-')[0] + 1} 步 · {tm.done ? '时间到！' : formatClock(tm.remaining)}
      </button>
    {/each}
  </div>
{/if}

<style>
  .cook {
    position: fixed; inset: 0; z-index: 50; display: flex; flex-direction: column;
    background: linear-gradient(170deg, color-mix(in srgb, var(--tone) 65%, white), var(--tone));
    padding: calc(16px + var(--safe-top)) 24px calc(22px + var(--safe-bottom));
  }
  .top { display: flex; align-items: center; gap: 12px; }
  .title { flex: 1; font-family: var(--serif); font-weight: 700; font-size: 15px; letter-spacing: 0.1em; }
  .top .en { color: var(--ink-2); font-size: 11px; }
  .progress { height: 2px; background: rgba(0, 0, 0, 0.08); margin-top: 14px; }
  .progress i { display: block; height: 100%; background: var(--ink); transition: width 0.3s; }

  .stage { flex: 1; overflow: auto; padding-top: 6vh; animation: fade 0.25s; }
  .big-num { font-family: var(--en); font-size: 88px; line-height: 0.9; display: block; }
  .heat { display: inline-block; margin-top: 18px; padding: 4px 14px; border: 1px solid var(--ink); border-radius: 999px; font-size: 14px; letter-spacing: 0.2em; }
  .text { font-family: var(--serif); font-size: clamp(22px, 6.4vw, 28px); line-height: 1.65; font-weight: 600; margin: 18px 0 0; }

  .used { list-style: none; margin: 26px 0 0; padding: 14px 0 0; border-top: 1px solid var(--line); }
  .used li { display: flex; justify-content: space-between; padding: 8px 0; font-size: 18px; }
  .used b { font-weight: 700; }

  .timers { display: flex; gap: 12px; margin-top: 26px; flex-wrap: wrap; }
  .timer {
    display: flex; flex-direction: column; align-items: flex-start; gap: 2px; padding: 14px 20px; border-radius: 20px;
    background: rgba(255, 255, 255, 0.6); min-width: 150px; text-align: left;
  }
  .timer b { font-family: var(--en); font-size: 30px; font-weight: 400; }
  .timer small { font-size: 12px; color: var(--ink-2); }
  .timer.run { background: var(--ink); color: var(--paper); }
  .timer.run small { color: rgba(255, 255, 255, 0.6); }
  .timer.done { background: #b0302c; color: #fff; animation: pulse 1s infinite; }
  @keyframes pulse { 50% { transform: scale(1.04); } }

  .nav { display: flex; gap: 10px; justify-content: center; padding-top: 14px; }
  .nav .pill { flex: 1; max-width: 220px; }

  .finish { display: flex; flex-direction: column; align-items: center; text-align: center; }
  .big { font-family: var(--serif); font-weight: 900; font-size: 46px; }
  .ask { margin: 26px 0 8px; color: var(--ink-2); }
  .stars { display: flex; gap: 8px; }
  .stars button { font-size: 34px; color: rgba(0, 0, 0, 0.15); }
  .stars button.on { color: var(--ink); }
  .finish textarea { margin-top: 22px; max-width: 420px; text-align: left; font-size: 16px; }

  .floats {
    position: fixed; z-index: 60; left: 0; right: 0; bottom: calc(92px + var(--safe-bottom));
    display: flex; flex-direction: column-reverse; align-items: center; gap: 8px; pointer-events: none;
  }
  .float {
    pointer-events: auto;
    background: var(--ink); color: var(--paper); padding: 10px 18px; border-radius: 999px; font-size: 14px; font-family: var(--en);
  }
  .float.done { background: #b0302c; }
</style>
