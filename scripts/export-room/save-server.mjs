// Receives the room exports posted by export.ts (opened with ?save=http://localhost:5200/)
// and writes them to exports/. Run from the project folder: node scripts/export-room/save-server.mjs
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'

const out = path.resolve('exports')
http
  .createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Headers', '*')
    if (req.method !== 'POST') return res.end()
    const name = path.basename(decodeURIComponent(req.url || ''))
    if (!/^atharva-room-(day|night)\.glb$/.test(name)) {
      res.statusCode = 400
      return res.end()
    }
    const chunks = []
    req.on('data', (c) => chunks.push(c))
    req.on('end', () => {
      const data = Buffer.concat(chunks)
      fs.writeFileSync(path.join(out, name), data)
      console.log('saved', name, data.length)
      res.end('ok')
    })
  })
  .listen(5200, '127.0.0.1', () => console.log('waiting for exports on http://localhost:5200/'))
