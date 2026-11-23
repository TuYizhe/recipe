<!--
  封面 = "今日"海报：日期、农历、天气、节日倒数、今天吃什么。
  主视觉随节日 / 节气变化。
-->
<script lang="ts">
  import type { Theme } from '../season'
  import type { SavedRecipe } from '../db'
  import Plate from './Plate.svelte'
  import WeatherIcon from './WeatherIcon.svelte'
  import { weather, describe, locate, setCity } from '../weather.svelte'
  import { DISH_START } from '../store.svelte'
  import { lunar, WEEK, MONTH_EN, MONTH_CN, countdown, cookedThisMonth, todaysPick } from '../today'

  let { theme, recipes, onjump }: { theme: Theme; recipes: SavedRecipe[]; onjump: (page: number) => void } = $props()

  const d = new Date()
  const w = $derived(weather.now ? describe(weather.now.code) : null)
  const rainy = $derived(!!w && (w.icon === 'rain' || w.icon === 'storm' || w.icon === 'snow'))
  const pick = $derived(todaysPick(recipes, weather.now?.temp ?? null, rainy))
  const monthCount = $derived(cookedThisMonth(recipes))

  let asking = $state(false)
  let city = $state('')
  let cityErr = $state(false)

  async function askWeather() {
    const ok = await locate()
    if (!ok) asking = true
  }
  async function submitCity(e: Event) {
    e.preventDefault()
    if (!city.trim()) return
    cityErr = !(await setCity(city))
    if (!cityErr) asking = false
  }
</script>

<div class="cover" style:--bg={theme.coverBg} style:--ink={theme.coverInk} style:--accent={theme.accent}>
  <!-- 今日 -->
  <section class="today">
    <span class="en">{MONTH_EN[d.getMonth()]} · {d.getFullYear()}</span>
    <div class="date">{d.getDate()}</div>
    <p class="cn">{MONTH_CN[d.getMonth()]} · {WEEK[d.getDay()]}</p>
    <p class="lunar">{lunar(d)}</p>

    <div class="weather" data-noflip>
      {#if asking}
        <form onsubmit={submitCity}>
          <input bind:value={city} placeholder={cityErr ? '没找到，换个写法' : '输入城市，如 杭州'} />
          <button>好</button>
        </form>
      {:else if weather.now && w}
        <button class="wrow" onclick={() => (asking = true)} aria-label="天气，点一下换城市">
          <WeatherIcon kind={w.icon} />
          <span class="temp">{weather.now.temp}°</span>
          <span class="wtxt">
            <b>{w.text}</b>
            <small>{weather.now.min}° / {weather.now.max}° · {weather.place?.name}</small>
          </span>
        </button>
      {:else if weather.status === 'loading'}
        <small class="muted">正在获取天气…</small>
      {:else}
        <button class="link" onclick={askWeather}>显示今天的天气 →</button>
      {/if}
    </div>
  </section>

  <!-- 主视觉 -->
  {#if theme.id === 'christmas'}
    <svg class="art" viewBox="0 0 200 230" aria-hidden="true">
      <g fill="none" stroke="var(--ink)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
        <path d="M100 30 L70 78 L88 76 L56 126 L80 123 L42 180 L158 180 L120 123 L144 126 L112 76 L130 78 Z" />
        <path d="M100 180 V205 M86 205 H114" />
        <path d="M64 150 C 90 160, 120 140, 140 152" opacity=".5" />
        <path d="M78 104 C 95 112, 112 100, 124 106" opacity=".5" />
      </g>
      <path d="M100 12 l4 9 10 1-7.5 6.5 2.2 9.8L100 33l-8.7 5.3 2.2-9.8L86 22l10-1z" fill="var(--accent)" />
      {#each [[84, 96], [114, 118], [72, 140], [126, 162], [98, 150], [92, 126]] as [x, y]}
        <circle cx={x} cy={y} r="4.2" fill="var(--accent)" />
      {/each}
    </svg>
  {:else}
    <div class="sun"></div>
  {/if}

  <h1 class="vt">「{theme.title}」</h1>
  <div class="seal">{theme.seal}</div>
  <!-- 竖排里的数字横着排（纵中横） -->
  <p class="vt note">{@html countdown(theme.id, d).replace(/\d+/g, (m) => `<span class="tcy">${m}</span>`)}</p>

  <!-- 今天吃什么 -->
  {#if pick}
    <button class="pick" onclick={() => onjump(pick.index + DISH_START)} data-noflip>
      <span class="thumb"><Plate coverId={recipes[pick.index].recipe.coverId} title={recipes[pick.index].title} /></span>
      <span class="ptxt">
        <span class="en">TODAY'S PICK · 今天吃什么</span>
        <b>{pick.reason}</b>
      </span>
      <span class="arrow">→</span>
    </button>
  {/if}

  <footer>
    <span>共 {recipes.length} 道{monthCount ? ` · 本月做了 ${monthCount} 次` : ''}</span>
    <i></i>
    <span>向左翻开 ←</span>
  </footer>
</div>

<style>
  .cover { position: absolute; inset: 0; background: var(--bg); color: var(--ink); overflow: hidden; }
  .muted, .cn, .lunar, .en { color: color-mix(in srgb, var(--ink) 58%, transparent); }

  .today { position: absolute; top: calc(76px + var(--safe-top)); left: 22px; right: 42%; }
  .date { font-family: var(--en); font-size: clamp(72px, 24vw, 104px); line-height: 0.95; margin-top: 6px; }
  .cn { margin: 6px 0 0; font-size: 13px; letter-spacing: 0.12em; color: var(--ink); }
  .lunar { margin: 4px 0 0; font-size: 12px; letter-spacing: 0.08em; }

  .weather { display: flex; align-items: center; gap: 8px; margin-top: 16px; padding-top: 14px; border-top: 1px solid color-mix(in srgb, var(--ink) 18%, transparent); min-height: 54px; }
  .wrow { display: flex; align-items: center; gap: 8px; text-align: left; }
  .temp { font-family: var(--en); font-size: 34px; line-height: 1; }
  .wtxt { display: flex; flex-direction: column; font-size: 13px; }
  .wtxt small { font-size: 11px; color: color-mix(in srgb, var(--ink) 58%, transparent); margin-top: 2px; white-space: nowrap; }
  .link { font-size: 13px; text-decoration: underline; text-underline-offset: 4px; color: var(--ink); }
  form { display: flex; gap: 6px; width: 100%; }
  form input { flex: 1; min-width: 0; border: 0; border-bottom: 1px solid var(--ink); background: transparent; outline: 0; padding: 6px 0; font-size: 14px; }
  form button { font-size: 13px; padding: 0 12px; border-radius: 999px; background: var(--ink); color: var(--bg); }

  .art { position: absolute; left: 8%; bottom: calc(150px + var(--safe-bottom)); width: 48%; max-width: 260px; }
  .sun {
    position: absolute; left: 12%; bottom: calc(170px + var(--safe-bottom)); width: min(48vw, 30vh); aspect-ratio: 1; border-radius: 50%;
    background: color-mix(in srgb, var(--accent) 55%, white);
  }

  h1 {
    position: absolute; right: 16px; top: calc(76px + var(--safe-top)); margin: 0;
    font-family: var(--serif); font-weight: 900; font-size: clamp(50px, 15.5vw, 78px); line-height: 1.02; letter-spacing: 0.04em;
  }
  .seal {
    position: absolute; right: calc(16px + clamp(50px, 15.5vw, 78px) + 12px); top: calc(84px + var(--safe-top));
    width: 28px; padding: 6px 0; background: var(--accent); color: #fff; border-radius: 3px;
    writing-mode: vertical-rl; text-align: center; font-family: var(--serif); font-weight: 900; font-size: 13px; letter-spacing: 0.2em;
  }
  .note {
    position: absolute; right: calc(16px + clamp(50px, 15.5vw, 78px) + 18px); top: calc(150px + var(--safe-top));
    margin: 0; font-size: 12px; letter-spacing: 0.3em; color: var(--accent);
  }

  .pick {
    position: absolute; left: 22px; right: 22px; bottom: calc(70px + var(--safe-bottom));
    display: flex; align-items: center; gap: 14px; padding: 12px 16px 12px 12px; border-radius: 999px;
    background: rgba(255, 255, 255, 0.6); backdrop-filter: blur(8px); text-align: left;
  }
  .thumb { width: 46px; height: 46px; flex: none; }
  .ptxt { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
  .ptxt .en { font-size: 9px; letter-spacing: 0.2em; }
  .ptxt b { font-family: var(--serif); font-size: 15px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .arrow { font-size: 18px; }

  footer {
    position: absolute; left: 22px; right: 22px; bottom: calc(26px + var(--safe-bottom));
    display: flex; align-items: center; gap: 12px; font-size: 12px; letter-spacing: 0.1em; color: color-mix(in srgb, var(--ink) 58%, transparent);
  }
  footer i { flex: 1; height: 1px; background: currentColor; opacity: 0.25; }
</style>
