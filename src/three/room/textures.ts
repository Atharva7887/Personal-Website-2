import * as THREE from 'three'

// Every surface texture in the room is drawn on a canvas, so the page ships no image files for them.

export function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function canvasTexture(w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void, repeat = false) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  draw(c.getContext('2d')!)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping
  return t
}

const hsl = (h: number, s: number, l: number) => `hsl(${h} ${s}% ${l}%)`

/** Thin streaks along x: the grain of a board. */
function grain(x: CanvasRenderingContext2D, r: () => number, x0: number, y0: number, w: number, h: number, n: number) {
  for (let i = 0; i < n; i++) {
    const y = y0 + r() * h
    x.strokeStyle = r() < 0.5 ? `rgba(40,20,5,${0.04 + r() * 0.08})` : `rgba(255,235,200,${0.03 + r() * 0.06})`
    x.lineWidth = 0.5 + r() * 1.5
    x.beginPath()
    x.moveTo(x0, y)
    x.bezierCurveTo(x0 + w * 0.3, y + (r() - 0.5) * 5, x0 + w * 0.7, y + (r() - 0.5) * 5, x0 + w, y + (r() - 0.5) * 3)
    x.stroke()
  }
}

/** Oak floorboards. One tile is 4 room units square. */
export function floorTexture() {
  const r = mulberry32(7)
  return canvasTexture(
    1024,
    1024,
    (x) => {
      const rows = 14
      const rh = 1024 / rows
      for (let i = 0; i < rows; i++) {
        let px = -r() * 400
        while (px < 1024) {
          const len = 330 + r() * 300
          x.fillStyle = hsl(26 + r() * 5, 34 + r() * 8, 44 + r() * 7)
          x.fillRect(px, i * rh, len, rh)
          x.save()
          x.beginPath()
          x.rect(px, i * rh, len, rh)
          x.clip()
          grain(x, r, px, i * rh, len, rh, 16)
          x.restore()
          x.fillStyle = 'rgba(30,15,5,.4)'
          x.fillRect(px + len - 1, i * rh, 2, rh)
          px += len
        }
        x.fillStyle = 'rgba(30,15,5,.35)'
        x.fillRect(0, i * rh - 1, 1024, 2)
      }
    },
    true,
  )
}

/** A generic board of wood with the grain along u. */
export function woodTexture(hue = 25, sat = 42, light = 34, seed = 3) {
  const r = mulberry32(seed)
  return canvasTexture(
    512,
    256,
    (x) => {
      x.fillStyle = hsl(hue, sat, light)
      x.fillRect(0, 0, 512, 256)
      for (let i = 0; i < 6; i++) {
        x.fillStyle = `rgba(${r() < 0.5 ? '255,220,180' : '30,12,0'},${0.04 + r() * 0.05})`
        x.fillRect(0, r() * 256, 512, 20 + r() * 50)
      }
      grain(x, r, 0, 0, 512, 256, 120)
    },
    true,
  )
}

/** Fine speckle, used as a bump map so painted walls are not perfectly flat. */
export function plasterBump() {
  const r = mulberry32(11)
  const t = canvasTexture(
    256,
    256,
    (x) => {
      const img = x.createImageData(256, 256)
      for (let i = 0; i < img.data.length; i += 4) {
        const v = 120 + r() * 60 + (r() < 0.02 ? 50 : 0)
        img.data[i] = img.data[i + 1] = img.data[i + 2] = v
        img.data[i + 3] = 255
      }
      x.putImageData(img, 0, 0)
    },
    true,
  )
  t.colorSpace = THREE.NoColorSpace
  return t
}

/** Brickwork for the outside of the house. One tile is 2 room units square. */
export function brickTexture() {
  const r = mulberry32(21)
  return canvasTexture(
    512,
    512,
    (x) => {
      x.fillStyle = '#b9ad9c'
      x.fillRect(0, 0, 512, 512)
      const bh = 32
      const bw = 96
      for (let row = 0; row < 16; row++) {
        const off = row % 2 ? -bw / 2 : 0
        for (let col = 0; col < 7; col++) {
          const px = off + col * bw
          x.fillStyle = hsl(12 + r() * 10, 38 + r() * 14, 38 + r() * 14)
          x.fillRect(px + 2.5, row * bh + 2.5, bw - 5, bh - 5)
          for (let k = 0; k < 14; k++) {
            x.fillStyle = `rgba(${r() < 0.5 ? '0,0,0' : '255,230,210'},${r() * 0.1})`
            x.fillRect(px + 3 + r() * (bw - 10), row * bh + 3 + r() * (bh - 8), 2 + r() * 9, 1 + r() * 3)
          }
        }
      }
    },
    true,
  )
}

/** Mown lawn. One tile is 3 room units square. */
export function grassTexture() {
  const r = mulberry32(31)
  return canvasTexture(
    512,
    512,
    (x) => {
      x.fillStyle = '#4f8a3c'
      x.fillRect(0, 0, 512, 512)
      for (let i = 0; i < 260; i++) {
        x.fillStyle = hsl(95 + r() * 25, 35 + r() * 20, 26 + r() * 20)
        x.globalAlpha = 0.12 + r() * 0.15
        x.beginPath()
        x.arc(r() * 512, r() * 512, 8 + r() * 46, 0, Math.PI * 2)
        x.fill()
      }
      x.globalAlpha = 1
      for (let i = 0; i < 9000; i++) {
        x.strokeStyle = hsl(90 + r() * 30, 40 + r() * 25, 24 + r() * 30)
        x.lineWidth = 1
        const px = r() * 512
        const py = r() * 512
        x.beginPath()
        x.moveTo(px, py)
        x.lineTo(px + (r() - 0.5) * 4, py - 3 - r() * 5)
        x.stroke()
      }
    },
    true,
  )
}

/** A flat-woven rug with a border. */
export function rugTexture() {
  const r = mulberry32(41)
  return canvasTexture(768, 512, (x) => {
    x.fillStyle = '#e9dfcf'
    x.fillRect(0, 0, 768, 512)
    const band = (inset: number, w: number, color: string) => {
      x.strokeStyle = color
      x.lineWidth = w
      x.strokeRect(inset, inset, 768 - inset * 2, 512 - inset * 2)
    }
    band(18, 20, '#c9714f')
    band(46, 6, '#2c3566')
    band(64, 3, '#c9714f')
    // Diamonds down the middle
    for (let i = 0; i < 5; i++) {
      const cx = 144 + i * 120
      x.strokeStyle = i % 2 ? '#2c3566' : '#c9714f'
      x.lineWidth = 5
      x.beginPath()
      x.moveTo(cx, 176)
      x.lineTo(cx + 50, 256)
      x.lineTo(cx, 336)
      x.lineTo(cx - 50, 256)
      x.closePath()
      x.stroke()
    }
    // Weave
    for (let y = 0; y < 512; y += 3) {
      x.fillStyle = `rgba(60,40,20,${0.03 + r() * 0.05})`
      x.fillRect(0, y, 768, 1)
    }
    for (let i = 0; i < 2600; i++) {
      x.fillStyle = `rgba(255,255,255,${r() * 0.08})`
      x.fillRect(r() * 768, r() * 512, 2, 2)
    }
  })
}

/** The monitor: a list of recent work. */
export function monitorTexture() {
  return canvasTexture(1024, 448, (x) => {
    const g = x.createLinearGradient(0, 0, 1024, 448)
    g.addColorStop(0, '#0c0f14')
    g.addColorStop(1, '#1b2050')
    x.fillStyle = g
    x.fillRect(0, 0, 1024, 448)
    x.fillStyle = '#e4e7ec'
    x.font = '700 70px system-ui, sans-serif'
    x.fillText('Selected work', 70, 112)
    x.font = '500 38px system-ui, sans-serif'
    const items = ['Unhaze', 'Protein ML pipelines', 'Interaction analysis app', 'IndiskaAI website', 'Skin lesion classifier']
    items.forEach((t, i) => {
      x.fillStyle = i === 0 ? '#8c99ff' : 'rgba(228,231,236,.8)'
      x.fillText('›  ' + t, 76, 186 + i * 54)
    })
  })
}

/** The laptop: an editor full of code. */
export function laptopTexture() {
  const r = mulberry32(51)
  return canvasTexture(512, 320, (x) => {
    x.fillStyle = '#10121c'
    x.fillRect(0, 0, 512, 320)
    x.fillStyle = '#181b2a'
    x.fillRect(0, 0, 92, 320)
    x.fillRect(0, 0, 512, 22)
    const colors = ['#8c99ff', '#ff9a6b', '#7fd6a4', '#e4e7ec', '#e4e7ec', '#9aa3b2']
    for (let i = 0; i < 9; i++) {
      x.fillStyle = 'rgba(154,163,178,.5)'
      x.fillRect(12 + (i % 3 ? 10 : 0), 36 + i * 16, 40 + r() * 28, 5)
    }
    let indent = 0
    for (let line = 0; line < 21; line++) {
      if (r() < 0.25) indent = Math.min(3, indent + 1)
      else if (r() < 0.25) indent = Math.max(0, indent - 1)
      let px = 108 + indent * 18
      const words = 1 + Math.floor(r() * 5)
      for (let w = 0; w < words; w++) {
        const len = 14 + r() * 60
        x.fillStyle = colors[Math.floor(r() * colors.length)]
        x.fillRect(px, 36 + line * 13, len, 5)
        px += len + 7
      }
    }
  })
}

/** The phone: Unhaze, with its cloud. */
export function phoneTexture() {
  return canvasTexture(180, 360, (x) => {
    const g = x.createLinearGradient(0, 0, 0, 360)
    g.addColorStop(0, '#4f9cf0')
    g.addColorStop(1, '#bfe3ff')
    x.fillStyle = g
    x.fillRect(0, 0, 180, 360)
    x.fillStyle = '#ffffff'
    for (const [cx, cy, rad] of [
      [70, 170, 34],
      [110, 160, 42],
      [140, 178, 28],
    ]) {
      x.beginPath()
      x.arc(cx, cy, rad, 0, Math.PI * 2)
      x.fill()
    }
    x.fillStyle = '#1d2e5b'
    x.font = '700 26px system-ui, sans-serif'
    x.fillText('Unhaze', 46, 260)
  })
}

/** The poster: an antibody. */
export function posterTexture() {
  return canvasTexture(400, 520, (x) => {
    x.fillStyle = '#0c0f14'
    x.fillRect(0, 0, 400, 520)
    x.strokeStyle = '#8c99ff'
    x.lineWidth = 26
    x.lineCap = 'round'
    x.beginPath()
    x.moveTo(200, 420)
    x.lineTo(200, 270)
    x.lineTo(110, 130)
    x.moveTo(200, 270)
    x.lineTo(290, 130)
    x.stroke()
    x.strokeStyle = '#ff9a6b'
    x.beginPath()
    x.moveTo(170, 255)
    x.lineTo(85, 150)
    x.moveTo(230, 255)
    x.lineTo(315, 150)
    x.stroke()
    x.fillStyle = '#e4e7ec'
    x.font = '700 34px system-ui, sans-serif'
    x.fillText('ANTIBODY', 118, 480)
  })
}

/** The arcade cabinet's screen. */
export function arcadeTexture() {
  return canvasTexture(200, 160, (x) => {
    x.fillStyle = '#0b0d1a'
    x.fillRect(0, 0, 200, 160)
    const g = x.createRadialGradient(100, 110, 5, 100, 110, 90)
    g.addColorStop(0, '#2f45ff')
    g.addColorStop(1, '#0b0d1a')
    x.fillStyle = g
    x.fillRect(0, 60, 200, 100)
    x.fillStyle = '#ffffff'
    x.beginPath()
    x.arc(70, 100, 9, 0, Math.PI * 2)
    x.fill()
    x.fillStyle = '#ffd29a'
    x.fillRect(130, 80, 10, 10)
    x.fillStyle = '#e4e7ec'
    x.font = '700 20px system-ui, sans-serif'
    x.fillText('FIND THE', 52, 34)
    x.fillText('MINIMUM', 54, 56)
  })
}
