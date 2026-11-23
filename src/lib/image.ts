import { db, type ImageRow } from './db'

const cache = new Map<number, string>()

/** 压缩照片并存进本地库，返回 id 和照片的主色调 */
export async function saveImage(file: File): Promise<{ id: number; tone: string }> {
  const bmp = await createImageBitmap(file)
  const max = 1200
  const k = Math.min(1, max / Math.max(bmp.width, bmp.height))
  const c = document.createElement('canvas')
  c.width = Math.round(bmp.width * k)
  c.height = Math.round(bmp.height * k)
  const ctx = c.getContext('2d')!
  ctx.drawImage(bmp, 0, 0, c.width, c.height)
  const tone = averageTone(ctx, c.width, c.height)
  const blob = await new Promise<Blob>((res) => c.toBlob((b) => res(b!), 'image/jpeg', 0.84))
  const id = await db.images.add({ blob } as ImageRow)
  return { id, tone }
}

export async function imageUrl(id: number | null): Promise<string | null> {
  if (!id) return null
  if (cache.has(id)) return cache.get(id)!
  const row = await db.images.get(id)
  if (!row) return null
  const url = URL.createObjectURL(row.blob)
  cache.set(id, url)
  return url
}

export async function deleteImage(id: number | null): Promise<void> {
  if (!id) return
  await db.images.delete(id)
  const u = cache.get(id)
  if (u) URL.revokeObjectURL(u)
  cache.delete(id)
}

/** 取照片中心区域的平均色，再调成柔和的海报底色（高明度、低饱和） */
function averageTone(ctx: CanvasRenderingContext2D, w: number, h: number): string {
  const { data } = ctx.getImageData(Math.floor(w * 0.2), Math.floor(h * 0.2), Math.max(1, Math.floor(w * 0.6)), Math.max(1, Math.floor(h * 0.6)))
  let r = 0, g = 0, b = 0, n = 0
  for (let i = 0; i < data.length; i += 16) {
    r += data[i]; g += data[i + 1]; b += data[i + 2]; n++
  }
  const [hh, s] = rgbToHsl(r / n, g / n, b / n)
  return `hsl(${Math.round(hh)} ${Math.round(Math.min(s, 0.45) * 60)}% 86%)`
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b)
  const l = (mx + mn) / 2
  if (mx === mn) return [0, 0, l]
  const d = mx - mn
  const s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn)
  let h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4
  return [h * 60, s, l]
}
