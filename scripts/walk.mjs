// End-to-end walkthrough of the demo; writes shots/walk-*.png and reports runtime errors.
// Usage: node scripts/walk.mjs [from-step-name]
import { chromium } from 'playwright'

const BASE = 'http://localhost:5199'
const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 1440, height: 960 }, deviceScaleFactor: 1.5 })
const page = await ctx.newPage()
const errors = []
page.on('pageerror', (e) => errors.push(`[pageerror] ${e.message}`))
page.on('console', (m) => m.type() === 'error' && errors.push(`[console] ${m.text()}`))

let n = 0
const shot = async (name, full = false) => {
  await page.waitForTimeout(450)
  const file = `shots/walk-${String(++n).padStart(2, '0')}-${name}.png`
  await page.screenshot({ path: file, fullPage: full })
  console.log('shot', file)
}
const click = (text, opts = {}) => page.getByRole(opts.role ?? 'button', { name: text, exact: opts.exact ?? false }).first().click()

await page.goto(BASE + '/', { waitUntil: 'networkidle' })
await page.evaluate(() => localStorage.clear())
await page.reload({ waitUntil: 'networkidle' })
await shot('home')

// Wealth Manager
await page.goto(BASE + '/wm', { waitUntil: 'networkidle' })
await shot('overview')
await page.goto(BASE + '/wm/new?demo=1', { waitUntil: 'networkidle' })
await shot('create')
await click('Create and write invite')
await page.waitForURL(/invite/)
await shot('invite-rough')
await click('Polish with AI')
await page.waitForTimeout(1200)
await shot('invite-diff')
await click('Use this')
await click('Send invite')
await page.waitForURL(/\/wm\/c\/[^/]+$/)
const caseUrl = page.url()
await shot('case-empty')

// Client
const token = await page.evaluate(() => Object.values(JSON.parse(localStorage.getItem('nevis-onboarding-v1')).state.cases).find((c) => c.token !== 'gallery').token)
await page.goto(`${BASE}/c/${token}`, { waitUntil: 'networkidle' })
await shot('client-welcome')
await page.getByText('I agree to share my information').click()
await page.getByRole('button', { name: 'Start', exact: true }).click()
await shot('client-intro')
await page.getByRole('button', { name: 'Start speaking' }).click()
await page.waitForTimeout(2500)
await shot('client-listening')
await page.waitForFunction(() => !!document.querySelector('button[aria-label="Send"]:not([disabled])'), null, { timeout: 15000 })
await page.getByRole('button', { name: 'Send', exact: true }).click()
await page.waitForTimeout(700)
await shot('client-intro-working')
await page.getByText('Here’s what we heard').waitFor({ timeout: 8000 })
await page.waitForTimeout(1500)
await shot('client-intro-result')
await click('Continue')
await shot('client-id')
await click('Take photo')
await page.waitForTimeout(2200)
await shot('client-id-done')
await click('Continue')
await page.waitForTimeout(300)
await shot('client-about', true)

// Ask Emily on citizenship
const citizenship = page.locator('.group\\/field', { has: page.locator('#f-citizenship') })
await page.locator('#f-citizenship').focus()
await page.waitForTimeout(300)
await citizenship.getByRole('button', { name: /Ask Emily/ }).click()
await page.getByPlaceholder('What would you like to ask?').fill('I have a green card, which option is that?')
await page.keyboard.press('Enter')
await page.waitForTimeout(300)
await shot('client-asked')
await page.keyboard.press('Escape')

await click('Continue')
await shot('client-work', true)
await click('Continue')
await shot('client-goals', true)
await click('Continue')
await shot('client-networth', true)
await click('Browse')
await page.getByRole('button', { name: /Vanguard_Statement/ }).click()
await page.waitForTimeout(3000)
await click('Link an account')
await page.getByRole('button', { name: /Chase/ }).click()
await page.waitForTimeout(2000)
await page.keyboard.press('Escape')
await shot('client-networth-filled', true)

// Wealth Manager replies and suggests
await page.goto(caseUrl, { waitUntil: 'networkidle' })
await shot('case-progress', true)
await page.getByRole('button', { name: /Reply/ }).first().click()
await page.waitForTimeout(300)
await page.getByPlaceholder('Reply…').first().fill('Green card holders pick “U.S. permanent resident”. I’ll fix it for you.')
await page.keyboard.press('Enter')
await page.waitForTimeout(300)
await shot('case-replied')

// Client sees the reply
await page.goto(`${BASE}/c/${token}?step=risk`, { waitUntil: 'networkidle' })
await shot('client-risk-inbox')
for (const q of ['Hold steady', 'Growth', '15+ years', 'Monthly, as usual']) await page.getByRole('radio', { name: new RegExp(q) }).first().click()
await shot('client-risk', true)
await click('Continue')
await page.waitForTimeout(200)
const url = page.url()
if (url.includes('estate')) await click('Continue')
await shot('client-required', true)
await click('Continue')
await shot('client-review', true)
await page.getByText('My answers are accurate').click()
await page.getByLabel('Type your full name to confirm').fill('Daniel Wei Tan')
await click(/Confirm and send/)
await shot('client-done')

await page.goto(caseUrl + '/brief', { waitUntil: 'networkidle' })
await shot('brief', true)

if (errors.length) console.log('\nERRORS:\n' + [...new Set(errors)].join('\n'))
else console.log('\nNo runtime errors')
await browser.close()
