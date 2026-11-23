// 极简 hash 路由（沿用 recipe-jar 的做法）：地址栏的 # 决定显示哪个页面，
// 刷新、返回键都能回到原处，且 # 后面的内容不会发到任何服务器。

export type Route =
  | { view: 'home' }
  | { view: 'shop' }
  | { view: 'add'; tag?: string }
  | { view: 'recipe'; id: number }
  | { view: 'edit'; id: number }
  | { view: 'cook'; id: number }

export function routeToHash(r: Route): string {
  switch (r.view) {
    case 'home': return ''
    case 'shop': return '#/shop'
    case 'add': return r.tag ? `#/add/${encodeURIComponent(r.tag)}` : '#/add'
    case 'recipe': return `#/r/${r.id}`
    case 'edit': return `#/r/${r.id}/edit`
    case 'cook': return `#/r/${r.id}/cook`
  }
}

export function parseRoute(hash: string): Route {
  const h = hash.replace(/^#\/?/, '')
  if (h === 'shop') return { view: 'shop' }
  if (h === 'add') return { view: 'add' }
  if (h.startsWith('add/')) return { view: 'add', tag: decodeURIComponent(h.slice(4)) }
  const m = h.match(/^r\/(\d+)(?:\/(edit|cook))?$/)
  if (m) {
    const id = parseInt(m[1], 10)
    return m[2] === 'edit' ? { view: 'edit', id } : m[2] === 'cook' ? { view: 'cook', id } : { view: 'recipe', id }
  }
  return { view: 'home' }
}

export function navigate(r: Route, replace = false) {
  const url = location.pathname + location.search + routeToHash(r)
  if (replace) history.replaceState(null, '', url)
  else history.pushState(null, '', url)
  window.dispatchEvent(new HashChangeEvent('hashchange'))
}

export function goBack(fallback: Route = { view: 'home' }) {
  if (history.length > 1) history.back()
  else navigate(fallback, true)
}
