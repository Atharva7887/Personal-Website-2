// Repaints the arcade atlas: the licensed side art becomes an abstract pattern in the site colours and the
// screen gets the room's own "find the minimum" game. Usage: node repaint.mjs <texDir>
import sharp from 'sharp'
const dir = process.argv[2]
const S = 2048
const SCREEN = { x: 1022, y: 1438, w: 351, h: 252 } // mirrored horizontally in the UVs
let stripes = ''
for (let i = -S; i < S * 2; i += 120) stripes += `<path d="M${i} 0 L${i + S} ${S}" stroke="#ffd29a" stroke-width="18" opacity=".9"/>`
let dots = ''
let seed = 7
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
for (let i = 0; i < 900; i++) dots += `<circle cx="${(rnd() * S) | 0}" cy="${(rnd() * S) | 0}" r="${(2 + rnd() * 7).toFixed(1)}" fill="#fff" opacity="${(0.35 + rnd() * 0.6).toFixed(2)}"/>`
const pattern = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2f45ff"/><stop offset="1" stop-color="#1a1f6b"/></linearGradient></defs><rect width="${S}" height="${S}" fill="url(#g)"/>${stripes}${dots}</svg>`)
// The screen: a loss curve with a ball rolling to its minimum.
const { w, h } = SCREEN
let curve = ''
for (let i = 0; i <= 40; i++) { const t = i / 40; curve += `${i ? 'L' : 'M'}${(20 + t * (w - 40)).toFixed(1)} ${(h - 40 - 120 * (1 - Math.pow((t - 0.62) / 0.62, 2)) * -1 - 120).toFixed(1)} ` }
const screen = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><g transform="translate(${w} 0) scale(-1 1)">
<defs><radialGradient id="r" cx=".5" cy=".75" r=".7"><stop offset="0" stop-color="#2f45ff"/><stop offset="1" stop-color="#0b0d1a"/></radialGradient></defs>
<rect width="${w}" height="${h}" fill="#0b0d1a"/><rect y="${h * 0.35}" width="${w}" height="${h * 0.65}" fill="url(#r)"/>
<text x="${w / 2}" y="46" fill="#e4e7ec" font-family="Arial, sans-serif" font-weight="700" font-size="34" text-anchor="middle">FIND THE</text>
<text x="${w / 2}" y="84" fill="#e4e7ec" font-family="Arial, sans-serif" font-weight="700" font-size="34" text-anchor="middle">MINIMUM</text>
<path d="${curve}" stroke="#ffd29a" stroke-width="5" fill="none"/>
<circle cx="${20 + 0.3 * (w - 40)}" cy="${h - 40 - 120 * (1 - Math.pow((0.3 - 0.62) / 0.62, 2)) * -1 - 120 - 12}" r="11" fill="#fff"/>
<text x="${w - 16}" y="${h - 12}" fill="#ffd29a" font-family="Arial, sans-serif" font-weight="700" font-size="18" text-anchor="end">INSERT COIN</text></g></svg>`)
const pat = await sharp(pattern).removeAlpha().raw().toBuffer()
const scr = await sharp(screen).removeAlpha().raw().toBuffer()

// Art = colourful or bright pixels; the mask is blurred and thresholded so thin dark outlines inside the art are covered too.
const base = await sharp(`${dir}/0.png`).removeAlpha().raw().toBuffer({ resolveWithObject: true })
const m = Buffer.alloc(S * S)
for (let k = 0; k < S * S; k++) {
  const r = base.data[k * 3], g = base.data[k * 3 + 1], b = base.data[k * 3 + 2]
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b)
  m[k] = (mx > 60 && (mx - mn) / mx > 0.25) || mn > 170 ? 255 : 0
}
const art = await sharp(m, { raw: { width: S, height: S, channels: 1 } }).blur(5).threshold(60).extractChannel(0).raw().toBuffer()
async function repaint(file, out, keepNeon) {
  const { data, info } = await sharp(`${dir}/${file}`).removeAlpha().raw().toBuffer({ resolveWithObject: true })
  const W = info.width
  for (let y = 0; y < info.height; y++) for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 3
    const r = data[i], g = data[i + 1], b = data[i + 2]
    const inScreen = x >= SCREEN.x && x < SCREEN.x + SCREEN.w && y >= SCREEN.y && y < SCREEN.y + SCREEN.h
    if (inScreen) {
      const j = ((y - SCREEN.y) * SCREEN.w + (x - SCREEN.x)) * 3
      data[i] = scr[j]; data[i + 1] = scr[j + 1]; data[i + 2] = scr[j + 2]
      continue
    }
    if (!keepNeon && !art[y * W + x]) continue
    if (keepNeon && Math.max(r, g, b) < 30) continue
    if (keepNeon) {
      // Emission: the neon trims stay (red becomes the site's warm sand), anything else goes dark.
      const red = r > 150 && g < 90 && b < 90, blue = b > 150 && r < 90 && g < 90
      if (red) { data[i] = 255; data[i + 1] = 170; data[i + 2] = 90 }
      else if (blue) { data[i] = 47; data[i + 1] = 69; data[i + 2] = 255 }
      else { data[i] = data[i + 1] = data[i + 2] = 0 }
      continue
    }
    data[i] = pat[i]; data[i + 1] = pat[i + 1]; data[i + 2] = pat[i + 2]
  }
  await sharp(data, { raw: { width: W, height: info.height, channels: 3 } }).png().toFile(`${dir}/${out}`)
}
await repaint('0.png', 'base-new.png', false)
await repaint('2.png', 'emit-new.png', true)
await sharp(`${dir}/base-new.png`).resize(700).jpeg().toFile(`${dir}/v-base-new.jpg`)
