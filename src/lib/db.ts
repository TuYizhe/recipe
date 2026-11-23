// 本地菜谱库：基于 recipe-jar 的 Dexie 封装改写。
// 数据只存在这台手机的 IndexedDB 里，不上传任何地方。
import Dexie, { type EntityTable } from 'dexie'
import type { CookLog, Recipe } from './types'
import { autoRequestPersistOnce } from './storage'

export interface SavedRecipe {
  id: number
  title: string
  savedAt: number
  recipe: Recipe
  logs: CookLog[]
  lastCooked?: number
}

export interface ImageRow {
  id: number
  blob: Blob
}

export interface MetaEntry {
  key: string
  value: unknown
}

export const db = new Dexie('recipe-notes-v2') as Dexie & {
  recipes: EntityTable<SavedRecipe, 'id'>
  images: EntityTable<ImageRow, 'id'>
  meta: EntityTable<MetaEntry, 'key'>
}

db.version(1).stores({
  recipes: '++id, title, savedAt, lastCooked',
  images: '++id',
  meta: '&key',
})

/** 预设标签（目录里的排序也按这个来，自定义标签排在后面） */
export const PRESET_TAGS = ['家常菜', '下饭菜', '快手菜', '汤羹', '凉菜', '主食', '早餐', '甜品']

/** 旧数据只有 category，没有 tags：读出来时补上 */
function migrate(e: SavedRecipe): SavedRecipe {
  const r = e.recipe
  if (!Array.isArray(r.tags)) r.tags = r.category ? [r.category] : ['家常菜']
  if (!r.tags.length) r.tags = ['未分类']
  return e
}

export function tagOrder(tag: string): number {
  const i = PRESET_TAGS.indexOf(tag)
  return i < 0 ? 100 : i
}

/** 目录里所有用到的标签，按预设顺序，自定义的按名字排 */
export function allTags(list: SavedRecipe[]): string[] {
  const set = new Set(list.flatMap((e) => e.recipe.tags))
  return [...set].sort((a, b) => tagOrder(a) - tagOrder(b) || a.localeCompare(b, 'zh'))
}

/** Svelte 5 的 $state 是 Proxy，IndexedDB 存不了，先转成普通对象 */
const plain = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T

function clean(r: Recipe): Recipe {
  const c = plain(r)
  c.title = c.title.trim()
  c.tags = [...new Set(c.tags.map((t) => t.trim()).filter(Boolean))]
  if (!c.tags.length) c.tags = ['未分类']
  delete c.category
  c.ingredients = c.ingredients.filter((i) => i.name.trim())
  c.steps = c.steps.filter((s) => s.text.trim())
  return c
}

export async function createRecipe(recipe: Recipe): Promise<number> {
  void autoRequestPersistOnce()
  const r = clean(recipe)
  return db.recipes.add({ title: r.title, savedAt: Date.now(), recipe: r, logs: [] } as unknown as SavedRecipe)
}

/** 改菜谱内容，不动做菜记录 */
export async function updateRecipe(id: number, recipe: Recipe): Promise<void> {
  const r = clean(recipe)
  await db.recipes.update(id, { recipe: r, title: r.title })
}

export async function removeRecipe(id: number): Promise<void> {
  const e = await db.recipes.get(id)
  await db.transaction('rw', db.recipes, db.images, async () => {
    if (e?.recipe.coverId) await db.images.delete(e.recipe.coverId)
    await db.recipes.delete(id)
  })
}

export const getRecipe = async (id: number) => {
  const e = await db.recipes.get(id)
  return e ? migrate(e) : undefined
}

/** 全部菜谱：按主标签（第一个标签）分组排序，同组按添加时间 */
export async function allRecipes(): Promise<SavedRecipe[]> {
  const list = (await db.recipes.toArray()).filter((e) => e?.recipe).map(migrate)
  const main = (e: SavedRecipe) => e.recipe.tags[0]
  return list.sort((a, b) => tagOrder(main(a)) - tagOrder(main(b)) || main(a).localeCompare(main(b), 'zh') || a.savedAt - b.savedAt)
}

/** 做完一次：记日期、打分、心得 */
export async function addLog(id: number, log: Omit<CookLog, 'date'>): Promise<void> {
  const e = await db.recipes.get(id)
  if (!e) return
  const now = Date.now()
  await db.recipes.update(id, { logs: [...(e.logs ?? []), { ...log, date: now }], lastCooked: now })
}

export async function removeLog(id: number, date: number): Promise<void> {
  const e = await db.recipes.get(id)
  if (!e) return
  const logs = e.logs.filter((l) => l.date !== date)
  await db.recipes.update(id, { logs, lastCooked: logs.length ? Math.max(...logs.map((l) => l.date)) : undefined })
}

export function latestLog(e: SavedRecipe): CookLog | null {
  if (!e.logs?.length) return null
  return e.logs.reduce((a, b) => (b.date > a.date ? b : a))
}

/** 搜索：菜名、分类、食材、步骤；空格分开的每个词都要命中 */
export function matchesQuery(e: SavedRecipe, q: string): boolean {
  const words = q.trim().toLowerCase().split(/\s+/).filter(Boolean)
  if (!words.length) return true
  const r = e.recipe
  const hay = [r.title, ...r.tags, r.tips, ...r.ingredients.map((i) => i.name), ...r.steps.map((s) => s.text)]
    .join(' ')
    .toLowerCase()
  return words.every((w) => hay.includes(w))
}

/* ---------------- 小设置 ---------------- */
export async function getMeta<T>(key: string, fallback: T): Promise<T> {
  return ((await db.meta.get(key))?.value as T) ?? fallback
}
export async function setMeta(key: string, value: unknown): Promise<void> {
  await db.meta.put({ key, value: plain(value) })
}

/* ---------------- 备份（沿用 recipe-jar 的单文件思路） ---------------- */
const BACKUP_FORMAT = 'recipe-notes-backup'

const blobToDataUrl = (b: Blob) =>
  new Promise<string>((res) => {
    const fr = new FileReader()
    fr.onload = () => res(fr.result as string)
    fr.readAsDataURL(b)
  })

export async function exportAll(): Promise<string> {
  const recipes = await db.recipes.toArray()
  const imgs = await db.images.toArray()
  const images = await Promise.all(imgs.map(async (i) => ({ id: i.id, data: await blobToDataUrl(i.blob) })))
  const meta = await db.meta.toArray()
  return JSON.stringify({ format: BACKUP_FORMAT, version: 1, exportedAt: Date.now(), recipes, images, meta })
}

/** 恢复备份：同名同时间的跳过，其余合并进来，从不删除现有数据 */
export async function importAll(json: string): Promise<{ added: number; skipped: number }> {
  const data = JSON.parse(json)
  if (data.format !== BACKUP_FORMAT || !Array.isArray(data.recipes)) throw new Error('这不是菜谱备份文件')
  let added = 0
  let skipped = 0
  const idMap = new Map<number, number>()
  await db.transaction('rw', db.recipes, db.images, async () => {
    for (const img of data.images ?? []) {
      const blob = await (await fetch(img.data)).blob()
      idMap.set(img.id, await db.images.add({ blob } as ImageRow))
    }
    for (const e of data.recipes as SavedRecipe[]) {
      const dup = await db.recipes.where('title').equals(e.title).filter((x) => x.savedAt === e.savedAt).first()
      if (dup) {
        skipped++
        continue
      }
      const { id: _drop, ...rest } = e
      if (rest.recipe.coverId) rest.recipe.coverId = idMap.get(rest.recipe.coverId) ?? null
      await db.recipes.add(rest as SavedRecipe)
      added++
    }
  })
  return { added, skipped }
}
