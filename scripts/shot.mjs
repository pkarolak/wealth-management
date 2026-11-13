// Usage: node scripts/shot.mjs <path> <out.png> [width] [height] [--full] [--steps=json]
import { chromium } from 'playwright'
const [, , path = '/', out = 'shots/shot.png', w = '1440', h = '960', ...flags] = process.argv
const full = flags.includes('--full')
const stepsArg = flags.find((f) => f.startsWith('--steps='))
const steps = stepsArg ? JSON.parse(stepsArg.slice(8)) : []
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 2 })
const errors = []
page.on('pageerror', (e) => errors.push(e.message))
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
await page.goto('http://localhost:5199' + path, { waitUntil: 'networkidle' })
for (const s of steps) {
  if (s.click) await page.click(s.click)
  if (s.fill) await page.fill(s.fill[0], s.fill[1])
  if (s.wait) await page.waitForTimeout(s.wait)
  if (s.goto) await page.goto('http://localhost:5199' + s.goto, { waitUntil: 'networkidle' })
  if (s.eval) await page.evaluate(s.eval)
}
await page.waitForTimeout(400)
await page.screenshot({ path: out, fullPage: full })
if (errors.length) console.log('ERRORS:\n' + errors.join('\n'))
await browser.close()
