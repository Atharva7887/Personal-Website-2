/**
 * Sample n points from text drawn on an offscreen 2D canvas, centred and
 * scaled to roughly the same size as the other shapes (about 5.5 units wide).
 * Browser only.
 */
export function textPoints(text: string, n: number, font = '700 120px "Bricolage Grotesque Variable", system-ui, sans-serif'): Float32Array {
  const c = document.createElement('canvas')
  const ctx = c.getContext('2d')!
  ctx.font = font
  const lines = text.trim().slice(0, 40).split(/\s*\n\s*|(?<=.{12,})\s+/).slice(0, 3)
  const w = Math.max(...lines.map((l) => ctx.measureText(l).width), 1)
  const lh = 130
  c.width = Math.ceil(w) + 20
  c.height = lh * lines.length + 20
  ctx.font = font
  ctx.fillStyle = '#fff'
  ctx.textBaseline = 'top'
  lines.forEach((l, i) => ctx.fillText(l, 10, 10 + i * lh))
  const data = ctx.getImageData(0, 0, c.width, c.height).data

  const filled: number[] = []
  const step = Math.max(1, Math.floor(Math.sqrt((c.width * c.height) / (n * 6))))
  for (let y = 0; y < c.height; y += step)
    for (let x = 0; x < c.width; x += step) if (data[(y * c.width + x) * 4 + 3] > 128) filled.push(x, y)
  const out = new Float32Array(n * 3)
  const count = filled.length / 2
  if (!count) return out
  const scale = 5.6 / Math.max(c.width, c.height * 1.4)
  for (let i = 0; i < n; i++) {
    const j = Math.floor(((i * 2654435761) % 4294967296) / 4294967296 * count) * 2
    out[i * 3] = (filled[j] - c.width / 2) * scale + (Math.random() - 0.5) * step * scale
    out[i * 3 + 1] = -(filled[j + 1] - c.height / 2) * scale + (Math.random() - 0.5) * step * scale
    out[i * 3 + 2] = (Math.random() - 0.5) * 0.35
  }
  return out
}

/** A loose cloud filling a volume: the "scatter" pose. */
export function scatterPoints(n: number): Float32Array {
  const out = new Float32Array(n * 3)
  for (let i = 0; i < n; i++) {
    const r = 4.5 * Math.cbrt(Math.random())
    const u = Math.random() * 2 - 1
    const th = Math.random() * Math.PI * 2
    const s = Math.sqrt(1 - u * u)
    out[i * 3] = r * s * Math.cos(th) * 1.4
    out[i * 3 + 1] = r * u * 0.8
    out[i * 3 + 2] = r * s * Math.sin(th)
  }
  return out
}
