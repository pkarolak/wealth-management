// Usage: node scripts/clip.mjs <path> <selector> <out.png> [--steps=json]
import { chromium } from 'playwright'
const [, , path, selector, out, ...flags] = process.argv
const stepsArg = flags.find((f) => f.startsWith('--steps='))
const steps = stepsArg ? JSON.parse(stepsArg.slice(8)) : []
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 960 }, deviceScaleFactor: 2 })
const errors = []; p.on('pageerror', (e) => errors.push(e.message)); p.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
await p.goto('http://localhost:5199' + path, { waitUntil: 'networkidle' })
for (const s of steps) { if (s.click) await p.click(s.click); if (s.fill) await p.fill(s.fill[0], s.fill[1]); if (s.wait) await p.waitForTimeout(s.wait); if (s.eval) await p.evaluate(s.eval); if (s.goto) await p.goto('http://localhost:5199' + s.goto, { waitUntil: 'networkidle' }) }
const el = p.locator(selector).first(); await el.scrollIntoViewIfNeeded(); await p.waitForTimeout(350)
await el.screenshot({ path: out })
if (errors.length) console.log('ERRORS:\n' + errors.join('\n'))
await b.close()
