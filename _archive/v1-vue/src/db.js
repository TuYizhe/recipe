import Dexie from 'dexie'
import { reactive } from 'vue'

export const db = new Dexie('recipe-notes')
db.version(1).stores({
  recipes: '++id, name, category, *ingredientNames, updatedAt, lastCookedAt',
  images: '++id',
  kv: 'key'
})

export const DEFAULT_CATEGORIES = ['家常菜', '汤羹', '凉菜', '主食', '早餐', '甜品']
export const GROUPS = [
  { key: 'main', label: '主料' },
  { key: 'side', label: '辅料' },
  { key: 'seasoning', label: '调料' }
]
export const HEATS = ['', '小火', '中火', '大火']

export function emptyRecipe() {
  return {
    name: '',
    category: '家常菜',
    servings: '',
    coverId: null,
    sourceUrl: '',
    ingredients: [
      { group: 'main', name: '', amount: '' }
    ],
    steps: [{ text: '', heat: '', time: '', imageId: null }],
    tips: '',
    logs: []
  }
}

function normalize(r) {
  const clean = JSON.parse(JSON.stringify(r))
  clean.ingredients = (clean.ingredients || []).filter(i => i.name.trim())
  clean.steps = (clean.steps || []).filter(s => s.text.trim() || s.imageId)
  clean.ingredientNames = [...new Set(clean.ingredients.map(i => i.name.trim()))]
  clean.updatedAt = Date.now()
  if (!clean.createdAt) clean.createdAt = clean.updatedAt
  clean.lastCookedAt = clean.logs?.length ? Math.max(...clean.logs.map(l => l.date)) : null
  return clean
}

export async function saveRecipe(r) {
  const data = normalize(r)
  if (data.id) {
    await db.recipes.put(data)
    return data.id
  }
  delete data.id
  return db.recipes.add(data)
}

export const getRecipe = id => db.recipes.get(Number(id))
export const allRecipes = () => db.recipes.toArray()

export async function deleteRecipe(id) {
  const r = await getRecipe(id)
  if (!r) return
  const imgs = [r.coverId, ...r.steps.map(s => s.imageId), ...r.logs.flatMap(l => l.imageIds || [])].filter(Boolean)
  await db.transaction('rw', db.recipes, db.images, async () => {
    await db.images.bulkDelete(imgs)
    await db.recipes.delete(Number(id))
  })
}

export async function addLog(id, log) {
  const r = await getRecipe(id)
  r.logs = [...(r.logs || []), { ...log, date: log.date || Date.now() }]
  await saveRecipe(r)
}

/* ---------- images ---------- */
const urlCache = new Map()

export async function compressImage(file, max = 1280, quality = 0.82) {
  const bmp = await createImageBitmap(file)
  const scale = Math.min(1, max / Math.max(bmp.width, bmp.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bmp.width * scale)
  canvas.height = Math.round(bmp.height * scale)
  canvas.getContext('2d').drawImage(bmp, 0, 0, canvas.width, canvas.height)
  return new Promise(res => canvas.toBlob(res, 'image/jpeg', quality))
}

export async function addImage(file) {
  const blob = await compressImage(file)
  return db.images.add({ blob })
}

export async function imageUrl(id) {
  if (!id) return null
  if (urlCache.has(id)) return urlCache.get(id)
  const row = await db.images.get(id)
  if (!row) return null
  const url = URL.createObjectURL(row.blob)
  urlCache.set(id, url)
  return url
}

export async function removeImage(id) {
  if (!id) return
  await db.images.delete(id)
  const u = urlCache.get(id)
  if (u) URL.revokeObjectURL(u)
  urlCache.delete(id)
}

/* ---------- key/value settings ---------- */
export const settings = reactive({
  loaded: false,
  theme: 'auto',
  categories: [...DEFAULT_CATEGORIES],
  shopping: { recipeIds: [], checked: {}, hideSeasoning: true }
})

export async function loadSettings() {
  const rows = await db.kv.toArray()
  for (const { key, value } of rows) if (key in settings) settings[key] = value
  settings.loaded = true
}

export async function saveSetting(key) {
  await db.kv.put({ key, value: JSON.parse(JSON.stringify(settings[key])) })
}

/* ---------- backup ---------- */
const blobToDataUrl = b => new Promise(res => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.readAsDataURL(b) })

export async function exportBackup() {
  const recipes = await db.recipes.toArray()
  const imgs = await db.images.toArray()
  const images = await Promise.all(imgs.map(async i => ({ id: i.id, data: await blobToDataUrl(i.blob) })))
  const kv = await db.kv.toArray()
  return new Blob([JSON.stringify({ app: 'recipe-notes', version: 1, exportedAt: Date.now(), recipes, images, kv })], { type: 'application/json' })
}

export async function importBackup(file) {
  const data = JSON.parse(await file.text())
  if (data.app !== 'recipe-notes') throw new Error('这不是菜谱备份文件')
  await db.transaction('rw', db.recipes, db.images, db.kv, async () => {
    await Promise.all([db.recipes.clear(), db.images.clear(), db.kv.clear()])
    for (const i of data.images) {
      const blob = await (await fetch(i.data)).blob()
      await db.images.put({ id: i.id, blob })
    }
    await db.recipes.bulkPut(data.recipes)
    await db.kv.bulkPut(data.kv || [])
  })
  urlCache.clear()
  await loadSettings()
  return data.recipes.length
}

export async function requestPersist() {
  try { return await navigator.storage?.persist?.() } catch { return false }
}
