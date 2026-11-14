// Walks the demo and sends chosen screens to Figma via html-to-design.
// Usage: node scripts/figma-capture.mjs ids.json   where ids.json maps screen name -> { id, prompt }
// SHOTS=dir saves full-page screenshots instead, for comparing against Figma. DPR=2 for retina shots, MOBILE=1 to shoot client screens at 390x844.
import { readFileSync } from 'node:fs'
import { chromium } from 'playwright'

const BASE = 'http://localhost:5199'
const ids = JSON.parse(readFileSync(process.argv[2], 'utf8'))
const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 1440, height: 960 }, deviceScaleFactor: Number(process.env.DPR ?? 1) })
const page = await ctx.newPage()
const script = await (await ctx.request.get('https://mcp.figma.com/mcp/html-to-design/capture.js')).text()

const capture = async (name) => {
  const entry = ids[name]
  if (!entry) return
  await page.waitForTimeout(600)
  await page.evaluate(() => window.scrollTo(0, 0))
  if (process.env.SHOTS) {
    const mobile = process.env.MOBILE && name.startsWith('client-')
    if (mobile) { await page.setViewportSize({ width: 390, height: 844 }); await page.waitForTimeout(700); await page.evaluate(() => window.scrollTo(0, 0)) }
    await page.screenshot({ path: `${process.env.SHOTS}/${name}${mobile ? '-mobile' : ''}.png`, fullPage: !mobile })
    if (mobile) await page.setViewportSize({ width: 1440, height: 960 })
    console.log('shot', name)
    return
  }
  if (!(await page.evaluate(() => !!window.figma?.captureForDesign))) {
    await page.evaluate((s) => { const el = document.createElement('script'); el.textContent = s; document.head.appendChild(el) }, script)
    await page.waitForTimeout(500)
  }
  const endpoint = `https://mcp.figma.com/mcp/capture/${entry.id}/submit?bindVariables=true&promptId=${entry.prompt}`
  const sent = page.waitForResponse((r) => r.url().includes(`/capture/${entry.id}/submit`), { timeout: 90000 })
  const selector = name === 'client-comments' ? 'body' : '#root'
  await page.evaluate(({ id, endpoint, selector }) => { window.figma.captureForDesign({ captureId: id, endpoint, selector }) }, { id: entry.id, endpoint, selector })
  const res = await sent
  console.log('captured', name, res.status())
}
const click = (text, opts = {}) => page.getByRole(opts.role ?? 'button', { name: text, exact: opts.exact ?? false }).first().click()
const only = (names) => names.some((n) => ids[n])

await page.goto(BASE + '/', { waitUntil: 'networkidle' })
await page.evaluate(() => localStorage.clear())
await page.goto(BASE + '/wm', { waitUntil: 'networkidle' })
await capture('wm-overview')
await page.goto(BASE + '/wm', { waitUntil: 'networkidle' })
if (!only(['wm-create', 'wm-invite', 'client-welcome', 'client-intro', 'client-intro-result', 'client-id', 'client-about', 'client-goals', 'client-networth', 'client-comments', 'client-review', 'client-done', 'wm-case', 'wm-brief', 'wm-cif'])) {
  await browser.close()
  process.exit(0)
}

await page.goto(BASE + '/wm/new?demo=1', { waitUntil: 'networkidle' })
await capture('wm-create')
await click('Create and write invite')
await page.waitForURL(/invite/)
await click('Polish with AI')
await page.waitForTimeout(1400)
await capture('wm-invite')
await click('Use this')
await click('Send invite')
await page.waitForURL(/\/wm\/c\/[^/]+$/)
const caseUrl = page.url()

const token = await page.evaluate(() => Object.values(JSON.parse(localStorage.getItem('nevis-onboarding-v1')).state.cases).find((c) => c.token !== 'gallery').token)
await page.goto(`${BASE}/c/${token}`, { waitUntil: 'networkidle' })
await capture('client-welcome')
await page.getByText('I agree to share my information').click()
await page.getByRole('button', { name: 'Start', exact: true }).click()
await capture('client-intro')
await page.getByRole('button', { name: 'Start speaking' }).click()
await page.waitForFunction(() => !!document.querySelector('button[aria-label="Send"]:not([disabled])'), null, { timeout: 15000 })
await page.getByRole('button', { name: 'Send', exact: true }).click()
await page.getByText('Here’s what we heard').waitFor({ timeout: 8000 })
await page.waitForTimeout(1500)
await capture('client-intro-result')
await click('Continue')
await click('Take photo')
await page.waitForTimeout(2200)
await capture('client-id')
await click('Continue')
await page.waitForTimeout(300)
await capture('client-about')

const citizenship = page.locator('.group\\/field', { has: page.locator('#f-citizenship') })
await page.locator('#f-citizenship').focus()
await page.waitForTimeout(300)
await citizenship.getByRole('button', { name: /Ask Emily/ }).click()
await page.getByPlaceholder('What would you like to ask?').fill('I have a green card, which option is that?')
await page.keyboard.press('Enter')
await page.waitForTimeout(300)
await page.keyboard.press('Escape')

await click('Continue')
await click('Continue')
await capture('client-goals')
await click('Continue')
await click('Browse')
await page.getByRole('button', { name: /Vanguard_Statement/ }).click()
await page.waitForTimeout(3000)
await click('Link an account')
await page.getByRole('button', { name: /Chase/ }).click()
await page.waitForTimeout(2000)
await page.keyboard.press('Escape')
await capture('client-networth')

await page.goto(caseUrl, { waitUntil: 'networkidle' })
await capture('wm-case')
await page.getByRole('button', { name: /Reply/ }).first().click()
await page.waitForTimeout(300)
await page.getByPlaceholder('Reply…').first().fill('Green card holders pick “U.S. permanent resident”. I’ll fix it for you.')
await page.keyboard.press('Enter')
await page.waitForTimeout(300)

await page.goto(`${BASE}/c/${token}?step=about`, { waitUntil: 'networkidle' })
if (ids['client-comments']) {
  await page.getByRole('button', { name: /comments/i }).first().click()
  await page.waitForTimeout(500)
  await capture('client-comments')
  await page.keyboard.press('Escape')
}
await page.goto(`${BASE}/c/${token}?step=risk`, { waitUntil: 'networkidle' })
for (const q of ['Hold steady', 'Growth', '15+ years', 'Monthly, as usual']) await page.getByRole('radio', { name: new RegExp(q) }).first().click()
await click('Continue')
await page.waitForTimeout(200)
if (page.url().includes('estate')) await click('Continue')
await click('Continue')
await capture('client-review')
await page.getByText('My answers are accurate').click()
await page.getByLabel('Type your full name to confirm').fill('Daniel Wei Tan')
await click(/Confirm and send/)
await capture('client-done')

await page.goto(caseUrl + '/brief', { waitUntil: 'networkidle' })
await capture('wm-brief')
await page.goto(caseUrl + '/cif', { waitUntil: 'networkidle' })
await capture('wm-cif')
await page.waitForTimeout(3000)
await browser.close()
