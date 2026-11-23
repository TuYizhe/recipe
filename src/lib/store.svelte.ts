import { allRecipes, getMeta, setMeta, type SavedRecipe } from './db'
import { resolveTheme, type ThemeId } from './season'

export const app = $state({
  recipes: [] as SavedRecipe[],
  loaded: false,
  themeChoice: 'auto' as 'auto' | ThemeId,
  shop: { ids: [] as number[], checked: {} as Record<string, boolean> },
  /** 首页停在第几页，从详情页回来时保持 */
  page: 0,
  toast: '',
})

export const theme = () => resolveTheme(app.themeChoice)

/** 翻页顺序：0 封面 · 1 目录 · 2… 每道菜 · 最后 添加页 */
export const DISH_START = 2

export async function loadAll() {
  const [recipes, themeChoice, shop] = await Promise.all([
    allRecipes(),
    getMeta<'auto' | ThemeId>('theme', 'auto'),
    getMeta('shop', { ids: [] as number[], checked: {} as Record<string, boolean> }),
  ])
  app.recipes = recipes
  app.themeChoice = themeChoice
  app.shop = shop
  app.loaded = true
  void import('./weather.svelte').then((m) => m.initWeather())
}

export async function refreshRecipes() {
  app.recipes = await allRecipes()
}

export const saveTheme = () => setMeta('theme', app.themeChoice)
export const saveShop = () => setMeta('shop', app.shop)

let t: ReturnType<typeof setTimeout>
export function toast(msg: string) {
  app.toast = msg
  clearTimeout(t)
  t = setTimeout(() => (app.toast = ''), 1800)
}
