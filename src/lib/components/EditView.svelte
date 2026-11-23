<script lang="ts">
  import Icon from './Icon.svelte'
  import Plate from './Plate.svelte'
  import { PRESET_TAGS, allTags, createRecipe, getRecipe, updateRecipe } from '../db'
  import { refreshRecipes, toast, app, DISH_START } from '../store.svelte'
  import { navigate, goBack } from '../route'
  import { saveImage, deleteImage } from '../image'
  import { pickUrl, sourceName } from '../util'
  import type { Group, Heat, Recipe } from '../types'

  let { id = null, tag = '' }: { id?: number | null; tag?: string } = $props()

  const blank = (): Recipe => ({
    title: '', tags: [tag || '家常菜'], servings: '', sourceUrl: '', coverId: null, tone: '',
    ingredients: [{ group: 'main', name: '', amount: '' }, { group: 'seasoning', name: '', amount: '' }],
    steps: [{ text: '', heat: '', time: '' }],
    tips: '',
  })

  let r = $state<Recipe>(blank())
  let snapshot = ''
  let focus = $state(-1)

  $effect(() => {
    if (id == null) {
      snapshot = JSON.stringify(r)
      return
    }
    getRecipe(id).then((e) => {
      if (!e) return navigate({ view: 'home' }, true)
      r = JSON.parse(JSON.stringify(e.recipe))
      if (!r.steps.length) r.steps.push({ text: '', heat: '', time: '' })
      snapshot = JSON.stringify(r)
    })
  })

  const GROUPS: [Group, string, string][] = [
    ['main', '主料', '比如 番茄'],
    ['side', '辅料', '比如 葱、姜、蒜'],
    ['seasoning', '调料', '比如 生抽'],
  ]
  const HEATS: Heat[] = ['小火', '中火', '大火']
  const QUICK = ['1 小勺', '半小勺', '1 大勺', '适量', '少许']
  const UNITS = ['小勺', '大勺', '克', '个', '根', '片', '瓣']
  const TIMES = ['30秒', '1分钟', '3分钟', '5分钟', '10分钟']

  function quick(i: number, chip: string) {
    const ing = r.ingredients[i]
    if (UNITS.includes(chip)) {
      const num = ing.amount.match(/^[\d.半一两二三四五六七八九十]+/)?.[0] ?? '1'
      ing.amount = `${num} ${chip}`
    } else ing.amount = chip
  }
  /* ---------- 标签 ---------- */
  const tagPool = $derived([...new Set([...PRESET_TAGS, ...allTags(app.recipes), ...r.tags])])
  let newTag = $state('')
  function toggleTag(t: string) {
    if (r.tags.includes(t)) r.tags = r.tags.filter((x) => x !== t)
    else r.tags = [...r.tags, t]
  }
  function addTag(e: Event) {
    e.preventDefault()
    const t = newTag.trim()
    if (t && !r.tags.includes(t)) r.tags = [...r.tags, t]
    newTag = ''
  }

  function addIng(group: Group) {
    r.ingredients.push({ group, name: '', amount: '' })
    focus = r.ingredients.length - 1
  }
  function move(k: number, d: number) {
    const j = k + d
    if (j < 0 || j >= r.steps.length) return
    ;[r.steps[k], r.steps[j]] = [r.steps[j], r.steps[k]]
  }

  let photoInput = $state<HTMLInputElement>()
  async function onPhoto(e: Event) {
    const f = (e.currentTarget as HTMLInputElement).files?.[0]
    ;(e.currentTarget as HTMLInputElement).value = ''
    if (!f) return
    const old = r.coverId
    const { id: imgId, tone } = await saveImage(f)
    r.coverId = imgId
    r.tone = tone
    if (old) void deleteImage(old)
  }

  async function save() {
    if (!r.title.trim()) {
      toast('先给这道菜起个名字')
      return
    }
    if (!r.tags.length) {
      toast('至少选一个标签，它决定这道菜在目录里的位置')
      return
    }
    r.sourceUrl = pickUrl(r.sourceUrl)
    let target = id
    if (id == null) target = await createRecipe(r)
    else await updateRecipe(id, r)
    snapshot = JSON.stringify(r)
    await refreshRecipes()
    const idx = app.recipes.findIndex((e) => e.id === target)
    if (idx >= 0) app.page = idx + DISH_START
    navigate({ view: 'recipe', id: target! }, true)
  }
  function cancel() {
    if (JSON.stringify(r) !== snapshot && !confirm('还没保存，确定离开？')) return
    goBack()
  }
</script>

<div class="edit view">
  <div class="top">
    <button class="round" onclick={cancel} aria-label="取消"><Icon name="close" /></button>
    <span class="en">{id == null ? 'NEW DISH' : 'EDIT'}</span>
    <button class="save" onclick={save}>保存</button>
  </div>

  <div class="head">
    <button class="photo" onclick={() => photoInput?.click()} aria-label="选择成品照片">
      {#if r.coverId}<Plate coverId={r.coverId} title={r.title} />{:else}<span class="ph"><Icon name="camera" /><small>成品照</small></span>{/if}
    </button>
    <input bind:this={photoInput} type="file" accept="image/*" hidden onchange={onPhoto} />
    <input class="name" bind:value={r.title} placeholder="菜名" maxlength="20" />
    <p class="tag-hint">{r.tags.length ? `目录里放在「${r.tags[0]}」${r.tags.length > 1 ? `，也会出现在 ${r.tags.slice(1).join('、')}` : ''}` : '选几个标签，第一个是主分类'}</p>
    <div class="cats">
      {#each tagPool as t}
        <button class="tag" class:on={r.tags.includes(t)} onclick={() => toggleTag(t)}>
          {#if r.tags[0] === t}<span class="main">主</span>{/if}{t}
        </button>
      {/each}
      <form class="newtag" onsubmit={addTag}>
        <input bind:value={newTag} placeholder="＋ 自定义" maxlength="6" onblur={addTag} />
      </form>
    </div>
  </div>

  <div class="sec">
    <label class="field"><span>原教程 {#if r.sourceUrl}· {sourceName(r.sourceUrl)}{/if}</span>
      <input class="input" bind:value={r.sourceUrl} placeholder="粘贴 B站 / 小红书 的分享内容" onblur={() => (r.sourceUrl = pickUrl(r.sourceUrl))} />
    </label>
    <label class="field"><span>几人份</span><input class="input" bind:value={r.servings} placeholder="2人份" /></label>
  </div>

  <div class="sec">
    <h3><span>用料</span><span class="en">INGREDIENTS</span></h3>
    {#each GROUPS as [g, label, ph]}
      <div class="group">
        <span class="glabel">{label}</span>
        {#each r.ingredients as ing, i}
          {#if ing.group === g}
            <div class="ing">
              <input class="input" bind:value={ing.name} placeholder={ph} onfocus={() => (focus = i)} />
              <input class="input amt" bind:value={ing.amount} placeholder="用量" onfocus={() => (focus = i)} />
              <button class="x" onclick={() => r.ingredients.splice(i, 1)} aria-label="删除"><Icon name="close" /></button>
            </div>
            {#if focus === i}
              <div class="chips">
                {#each [...QUICK, ...UNITS] as c}<button class="tag" onmousedown={(e) => e.preventDefault()} onclick={() => quick(i, c)}>{c}</button>{/each}
              </div>
            {/if}
          {/if}
        {/each}
        <button class="add" onclick={() => addIng(g)}>＋ {label}</button>
      </div>
    {/each}
  </div>

  <div class="sec">
    <h3><span>步骤</span><span class="en">METHOD</span></h3>
    {#each r.steps as s, k}
      <div class="step">
        <div class="shead">
          <span class="num">{String(k + 1).padStart(2, '0')}</span>
          <span class="ops">
            <button onclick={() => move(k, -1)} disabled={k === 0} aria-label="上移"><Icon name="up" /></button>
            <button onclick={() => move(k, 1)} disabled={k === r.steps.length - 1} aria-label="下移"><Icon name="down" /></button>
            <button onclick={() => r.steps.splice(k, 1)} aria-label="删除这步"><Icon name="close" /></button>
          </span>
        </div>
        <textarea class="input" rows="2" bind:value={s.text} placeholder="这一步做什么，比如：油热后下蒜末爆香"></textarea>
        <div class="chips">
          {#each HEATS as h}<button class="tag" class:on={s.heat === h} onclick={() => (s.heat = s.heat === h ? '' : h)}>{h}</button>{/each}
          <i></i>
          {#each TIMES as tm}<button class="tag" class:on={s.time === tm} onclick={() => (s.time = s.time === tm ? '' : tm)}>{tm}</button>{/each}
        </div>
      </div>
    {/each}
    <button class="add" onclick={() => r.steps.push({ text: '', heat: '', time: '' })}>＋ 下一步</button>
  </div>

  <div class="sec">
    <h3><span>要点</span><span class="en">TIPS</span></h3>
    <textarea class="input" rows="3" bind:value={r.tips} placeholder="容易出错的地方，比如：鸡蛋刚凝固就盛出"></textarea>
  </div>
</div>

<style>
  .edit { max-width: 560px; margin: 0 auto; padding: 0 22px calc(60px + var(--safe-bottom)); }
  .top { position: sticky; top: 0; z-index: 10; display: flex; align-items: center; justify-content: space-between; padding: calc(14px + var(--safe-top)) 0 10px; background: var(--paper); }
  .top .en { color: var(--ink-3); }
  .save { height: 38px; padding: 0 20px; border-radius: 999px; background: var(--ink); color: var(--paper); font-weight: 600; letter-spacing: 0.1em; }

  .head { display: flex; flex-direction: column; align-items: center; padding: 16px 0 6px; }
  .photo { width: 150px; height: 150px; border-radius: 50%; }
  .ph { width: 100%; height: 100%; border-radius: 50%; border: 1px dashed var(--ink-3); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; color: var(--ink-3); }
  .ph :global(svg) { width: 26px; height: 26px; }
  .ph small { font-size: 12px; }
  .name { width: 100%; border: 0; background: transparent; outline: 0; text-align: center; font-family: var(--serif); font-weight: 900; font-size: 34px; letter-spacing: 0.1em; margin: 18px 0 14px; }
  .name::placeholder { color: var(--line); }
  .cats { display: flex; flex-wrap: wrap; justify-content: center; gap: 6px; }
  .tag-hint { margin: 0 0 10px; font-size: 12px; color: var(--ink-3); letter-spacing: 0.06em; text-align: center; }
  .main { font-size: 10px; margin-right: 4px; padding: 0 4px; border-radius: 4px; background: var(--paper); color: var(--ink); }
  .newtag input { width: 84px; height: 30px; border: 1px dashed var(--ink-3); border-radius: 999px; background: transparent; text-align: center; font-size: 13px; outline: 0; }

  .sec { margin-top: 38px; }
  h3 { display: flex; align-items: baseline; justify-content: space-between; margin: 0 0 6px; padding-bottom: 10px; border-bottom: 1px solid var(--ink); }
  h3 span:first-child { font-family: var(--serif); font-size: 20px; font-weight: 900; letter-spacing: 0.2em; }
  h3 .en { color: var(--ink-3); }

  .group { padding-top: 14px; }
  .glabel { font-size: 11px; color: var(--ink-3); letter-spacing: 0.3em; }
  .ing { display: flex; gap: 14px; align-items: center; }
  .ing .input:first-child { flex: 1.4; }
  .ing .amt { flex: 1; }
  .x { width: 28px; height: 28px; flex: none; color: var(--ink-3); display: grid; place-items: center; }
  .x :global(svg) { width: 16px; height: 16px; }
  .chips { display: flex; gap: 6px; overflow-x: auto; padding: 10px 0 4px; scrollbar-width: none; align-items: center; }
  .chips::-webkit-scrollbar { display: none; }
  .chips i { width: 1px; height: 18px; background: var(--line); flex: none; margin: 0 4px; }
  .add { margin-top: 12px; font-size: 14px; color: var(--ink-2); letter-spacing: 0.1em; }

  .step { padding: 16px 0; border-bottom: 1px solid var(--line); }
  .shead { display: flex; justify-content: space-between; align-items: center; }
  .num { font-family: var(--en); font-size: 26px; }
  .ops { display: flex; gap: 4px; }
  .ops button { width: 30px; height: 30px; color: var(--ink-3); display: grid; place-items: center; }
  .ops button:disabled { opacity: 0.3; }
  .ops :global(svg) { width: 17px; height: 17px; }
</style>
