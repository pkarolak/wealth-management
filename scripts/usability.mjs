// Synthetic usability probes: three personas attempt real tasks; every observation is logged.
// Usage: node scripts/usability.mjs
import { chromium, devices } from 'playwright'

const BASE = 'http://localhost:5199'
const browser = await chromium.launch()
const log = (persona, task, note) => console.log(`[${persona}] ${task} :: ${note}`)
const tryStep = async (persona, task, fn) => {
  try {
    await fn()
  } catch (e) {
    log(persona, task, `BLOCKED — ${e.message.split('\n')[0]}`)
  }
}
const store = (page) => page.evaluate(() => JSON.parse(localStorage.getItem('nevis-onboarding-v1') || '{}').state)

// Emily, Wealth Manager, laptop ------------------------------------------------
{
  const P = 'Emily'
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 800 } })).newPage()
  await page.goto(BASE + '/', { waitUntil: 'networkidle' })
  await page.evaluate(() => localStorage.clear())
  await page.goto(BASE + '/wm/new', { waitUntil: 'networkidle' })

  await tryStep(P, 'Create client with empty form', async () => {
    const btn = page.getByRole('button', { name: /Create and write invite/ })
    log(P, 'Create client with empty form', `button disabled=${await btn.isDisabled()}`)
    if (!(await btn.isDisabled())) {
      await btn.click()
      await page.waitForTimeout(400)
      log(P, 'Create client with empty form', `url after click=${page.url().replace(BASE, '')}; visible error text=${await page.getByText(/required|enter|missing/i).count()}`)
    }
  })

  await page.goto(BASE + '/wm/new', { waitUntil: 'networkidle' })
  await tryStep(P, 'Create client with bad email', async () => {
    await page.getByLabel('First name').fill('Linda')
    await page.getByLabel('Last name').fill('Moreau')
    await page.getByLabel('Email').fill('linda@')
    const btn = page.getByRole('button', { name: /Create and write invite/ })
    log(P, 'Create client with bad email', `button disabled=${await btn.isDisabled()}; explanation shown=${await page.getByText(/valid email|check the email|invalid/i).count()}`)
    await page.getByLabel('Email').fill('linda.moreau@gmail.com')
    log(P, 'Create client with bad email', `after fixing email, disabled=${await btn.isDisabled()}`)
    if (!(await btn.isDisabled())) {
      await btn.click()
      await page.waitForTimeout(500)
      log(P, 'Create client with bad email', `url after click=${page.url().replace(BASE, '')}`)
    }
  })

  await tryStep(P, 'Browser Back from invite', async () => {
    if (!page.url().includes('invite')) return log(P, 'Browser Back from invite', 'not on invite, skipped')
    await page.goBack()
    await page.waitForTimeout(400)
    log(P, 'Browser Back from invite', `url=${page.url().replace(BASE, '')}; first name kept=${(await page.getByLabel('First name').inputValue().catch(() => '')) === 'Linda'}`)
    await page.goForward()
  })

  await tryStep(P, 'Send invite without polishing', async () => {
    const send = page.getByRole('button', { name: 'Send invite' })
    log(P, 'Send invite without polishing', `Send visible=${await send.isVisible()}`)
    const body = (await page.locator('textarea').first().inputValue().catch(() => '')) || (await page.locator('main').innerText()).slice(0, 400)
    log(P, 'Send invite without polishing', `default body="${body.slice(0, 70)}"`)
    await send.click()
    await page.waitForURL(/\/wm\/c\/[^/]+$/)
  })

  await tryStep(P, 'Find whether client consented', async () => {
    await page.waitForTimeout(500)
    const txt = await page.getByText(/consent/i).allInnerTexts()
    log(P, 'Find whether client consented', `consent texts=${JSON.stringify(txt)}`)
  })

  await tryStep(P, 'Request a document', async () => {
    await page.getByRole('radio', { name: /Requests/ }).click()
    await page.waitForTimeout(300)
    const inputs = await page.getByPlaceholder(/Ask .* for a document/).count()
    log(P, 'Request a document', `request input present=${inputs > 0}`)
  })

  await tryStep(P, 'Nav rail labels', async () => {
    const links = await page.locator('aside a, nav a').evaluateAll((as) => as.map((a) => ({ href: a.getAttribute('href'), name: (a.getAttribute('aria-label') || a.textContent || '').trim(), title: a.getAttribute('title') })))
    log(P, 'Nav rail labels', JSON.stringify(links))
  })

  await tryStep(P, 'Open brief before anything is filled', async () => {
    await page.getByRole('button', { name: /Meeting brief/ }).first().click()
    await page.waitForTimeout(500)
    log(P, 'Open brief before anything is filled', `url=${page.url().replace(BASE, '')}; headline="${(await page.locator('h2, p').filter({ hasText: /net worth|Not enough to go on/i }).first().innerText().catch(() => '')).slice(0, 90)}"`)
  })
  await page.context().close()
}

// Daniel, client, iPhone ------------------------------------------------------
let token
{
  const P = 'Daniel·mobile'
  const ctx = await browser.newContext({ ...devices['iPhone 14'] })
  const page = await ctx.newPage()
  await page.goto(BASE + '/', { waitUntil: 'networkidle' })
  await page.evaluate(() => localStorage.clear())
  await page.goto(BASE + '/wm/new', { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: 'Fill with demo client' }).click()
  await page.getByRole('button', { name: /Create and write invite/ }).click()
  await page.waitForURL(/invite/)
  await page.getByRole('button', { name: 'Send invite' }).click()
  await page.waitForURL(/\/wm\/c\//)
  token = Object.values((await store(page)).cases)[0].token
  await page.goto(`${BASE}/c/${token}`, { waitUntil: 'networkidle' })

  await tryStep(P, 'Welcome fits first screen', async () => {
    const box = await page.getByRole('button', { name: /Let’s begin/ }).boundingBox()
    log(P, 'Welcome fits first screen', `CTA y=${Math.round(box.y)} of viewport 664 → ${box.y > 664 ? 'below the fold' : 'visible'}`)
    await page.getByText('I agree to share my information').click()
    await page.getByRole('button', { name: /Let’s begin/ }).click()
  })

  await tryStep(P, 'Skip the voice intro', async () => {
    const skip = page.getByRole('button', { name: /Skip, I’ll fill in the form myself/ })
    const box = await skip.boundingBox()
    log(P, 'Skip the voice intro', `skip target ${Math.round(box.width)}×${Math.round(box.height)}px`)
    await skip.click()
    await page.waitForTimeout(400)
    log(P, 'Skip the voice intro', `landed on step=${new URL(page.url()).searchParams.get('step')}`)
  })

  await tryStep(P, 'ID scan on phone', async () => {
    const offered = await page.getByRole('button', { name: /from your driver’s license/ }).isVisible().catch(() => false)
    log(P, 'ID scan on phone', `offered inside About=${offered}`)
    await page.goto(page.url().replace('step=about', 'step=id'), { waitUntil: 'networkidle' })
    const cam = await page.getByRole('button', { name: /Use camera|Take photo/ }).count()
    const upload = await page.getByRole('button', { name: /upload|choose|photo library/i }).count()
    log(P, 'ID scan on phone', `camera button=${cam > 0}; upload alternative=${upload > 0}`)
    await page.getByRole('button', { name: /Skip, I’ll type it/ }).click()
    await page.waitForTimeout(400)
    log(P, 'ID scan on phone', `after skip step=${new URL(page.url()).searchParams.get('step')}`)
  })

  await tryStep(P, 'Know where I am (progress) on mobile', async () => {
    const bar = page.getByRole('button', { name: /All steps/ })
    const barText = await bar.innerText().catch(() => '(none)')
    await bar.click()
    await page.waitForTimeout(300)
    const rail = await page.getByRole('dialog').getByRole('button', { name: /Work & income/ }).first().isVisible().catch(() => false)
    const msg = await page.getByRole('dialog').getByRole('button', { name: /Message/ }).first().isVisible().catch(() => false)
    log(P, 'Know where I am (progress) on mobile', `top bar="${barText.replace(/\s+/g, ' ')}"; section list in sheet=${rail}; Message Emily in sheet=${msg}`)
    await page.keyboard.press('Escape')
    await page.waitForTimeout(200)
  })

  await tryStep(P, 'Bad input validation', async () => {
    await page.getByLabel('ZIP').fill('ABCDE')
    await page.getByLabel('Mobile phone').fill('12')
    await page.getByLabel('Email').fill('daniel@')
    await page.getByLabel('First name').click()
    await page.waitForTimeout(300)
    const errs = await page.locator('[aria-invalid="true"], [role="alert"]').count()
    const errText = await page.getByText(/valid|invalid|5 digits|check/i).count()
    log(P, 'Bad input validation', `ZIP "ABCDE", phone "12", email "daniel@" → aria-invalid/alert=${errs}, error text=${errText}`)
  })

  await tryStep(P, 'Continue with required fields empty', async () => {
    const cont = page.getByRole('button', { name: /^Continue|and continue/ }).last()
    await cont.scrollIntoViewIfNeeded()
    const box = await cont.boundingBox()
    const footerSticky = await cont.evaluate((el) => { let n = el; while (n) { const p = getComputedStyle(n).position; if (p === 'sticky' || p === 'fixed') return true; n = n.parentElement } return false })
    log(P, 'Continue with required fields empty', `footer sticky=${footerSticky}; button ${Math.round(box.width)}×${Math.round(box.height)}`)
    await cont.click()
    await page.waitForTimeout(400)
    log(P, 'Continue with required fields empty', `moved to step=${new URL(page.url()).searchParams.get('step')} with ~missing answers, no blocking`)
  })

  await tryStep(P, 'Refresh mid-flow', async () => {
    const before = new URL(page.url()).searchParams.get('step')
    await page.reload({ waitUntil: 'networkidle' })
    log(P, 'Refresh mid-flow', `before=${before}; after=${new URL(page.url()).searchParams.get('step')}`)
  })

  await tryStep(P, 'Browser Back between steps', async () => {
    const before = new URL(page.url()).searchParams.get('step')
    await page.goBack()
    await page.waitForTimeout(400)
    log(P, 'Browser Back between steps', `from ${before} → ${page.url().replace(BASE, '')}`)
  })

  await tryStep(P, 'Ask Emily from a field on mobile', async () => {
    await page.goto(`${BASE}/c/${token}?step=about`, { waitUntil: 'networkidle' })
    const ask = page.getByRole('button', { name: /Ask Emily|Comment/i })
    log(P, 'Ask Emily from a field on mobile', `visible ask/comment buttons=${await ask.count()}`)
  })

  await tryStep(P, 'Defer SSN to the meeting', async () => {
    const d = page.getByRole('button', { name: /Do it in the meeting/ })
    const box = await d.boundingBox()
    log(P, 'Defer SSN to the meeting', `target ${Math.round(box.width)}×${Math.round(box.height)}px`)
  })

  await tryStep(P, 'Touch targets under 44px', async () => {
    for (const step of ['about', 'networth', 'risk']) {
      await page.goto(`${BASE}/c/${token}?step=${step}`, { waitUntil: 'networkidle' })
      const small = await page.locator('button:visible, a:visible, [role="radio"]:visible').evaluateAll((els) =>
        els.map((e) => { const r = e.getBoundingClientRect(); return { h: r.height, t: (e.getAttribute('aria-label') || e.textContent || '').trim().slice(0, 24) } }).filter((x) => x.h > 0 && x.h < 36 && x.t !== 'Skip to form'),
      )
      log(P, 'Touch targets under 44px', `${step}: ${small.length} controls under 36px tall, e.g. ${JSON.stringify(small.slice(0, 5).map((s) => `${s.t} (${Math.round(s.h)})`))}`)
    }
  })
  await ctx.close()
}

// Linda, 67, keyboard and low vision, desktop -----------------------------------
{
  const P = 'Linda·keyboard'
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' })
  const page = await ctx.newPage()
  await page.goto(BASE + '/', { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: 'Jump to halfway' }).click()
  await page.waitForTimeout(2500)
  const t = Object.values((await store(page)).cases)[0].token
  await page.goto(`${BASE}/c/${t}?step=about`, { waitUntil: 'networkidle' })

  await tryStep(P, 'Tab to first field + visible focus', async () => {
    let i = 0
    let info
    while (i < 40) {
      await page.keyboard.press('Tab')
      i++
      info = await page.evaluate(() => {
        const e = document.activeElement
        const s = getComputedStyle(e)
        return { tag: e.tagName, name: (e.getAttribute('aria-label') || e.textContent || e.getAttribute('placeholder') || '').trim().slice(0, 30), outline: s.outlineStyle !== 'none' && s.outlineWidth !== '0px', ring: s.boxShadow !== 'none' }
      })
      if (info.tag === 'INPUT') break
    }
    await page.reload({ waitUntil: 'networkidle' })
    await page.keyboard.press('Tab')
    const first = await page.evaluate(() => document.activeElement?.textContent?.trim())
    await page.keyboard.press('Enter')
    let j = 0
    while (j < 40) {
      await page.keyboard.press('Tab')
      j++
      if (await page.evaluate(() => document.activeElement?.tagName === 'INPUT')) break
    }
    log(P, 'Tab to first field + visible focus', `first Tab="${first}"; via skip link ${j + 2} presses to first input`)
    log(P, 'Tab to first field + visible focus', `${i} Tab presses to reach first input ("${info.name}"); focus indicator outline=${info.outline} ring=${info.ring}`)
  })

  await tryStep(P, 'Operate segmented control by keyboard', async () => {
    const radio = page.getByRole('radio', { name: '3', exact: true }).first()
    await radio.focus()
    await page.keyboard.press('ArrowRight')
    await page.waitForTimeout(150)
    const checked = await page.getByRole('radio', { checked: true }).allInnerTexts()
    log(P, 'Operate segmented control by keyboard', `after ArrowRight from "3", checked=${JSON.stringify(checked)}`)
  })

  await tryStep(P, 'Unnamed buttons', async () => {
    const unnamed = await page.locator('button:visible').evaluateAll((bs) => bs.filter((b) => !(b.getAttribute('aria-label') || b.textContent?.trim() || b.getAttribute('title'))).length)
    log(P, 'Unnamed buttons', `${unnamed} visible buttons without an accessible name on About`)
  })

  await tryStep(P, 'Contrast of meta text', async () => {
    const res = await page.evaluate(() => {
      const lum = (c) => { const [r, g, b] = c.match(/\d+(\.\d+)?/g).slice(0, 3).map(Number).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }); return 0.2126 * r + 0.7152 * g + 0.0722 * b }
      const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05) }
      const bg = getComputedStyle(document.body).backgroundColor
      const out = {}
      for (const el of document.querySelectorAll('span, p, button, label')) {
        if (!el.childElementCount && el.textContent.trim() && el.getBoundingClientRect().height) {
          const c = getComputedStyle(el).color
          const r = ratio(c, bg)
          if (r < 4.5) out[c] = out[c] ?? { ratio: r.toFixed(2), sample: el.textContent.trim().slice(0, 40), n: 0 }
          if (r < 4.5) out[c].n++
        }
      }
      return out
    })
    for (const [c, v] of Object.entries(res)) log(P, 'Contrast of meta text', `${c} on page bg = ${v.ratio}:1 (${v.n} elements, e.g. "${v.sample}")`)
  })

  await tryStep(P, 'Explain icons reachable', async () => {
    const n = await page.getByRole('button', { name: /^Explain:/ }).count()
    log(P, 'Explain icons reachable', `${n} explain buttons with names`)
  })

  await tryStep(P, 'Reduced motion respected', async () => {
    const usesMQ = await page.evaluate(() => [...document.styleSheets].some((s) => { try { return [...s.cssRules].some((r) => r.media?.mediaText?.includes('prefers-reduced-motion')) } catch { return false } }))
    log(P, 'Reduced motion respected', `CSS has prefers-reduced-motion rules=${usesMQ}`)
  })

  await tryStep(P, 'Find how to change answers after sending', async () => {
    await page.goto(`${BASE}/c/${t}?step=review`, { waitUntil: 'networkidle' })
    await page.getByLabel(/Type your full name/).fill('Linda Moreau')
    const btn = page.getByRole('button', { name: /Confirm and send/ })
    log(P, 'Find how to change answers after sending', `wrong name accepted? confirm disabled=${await btn.isDisabled()} (accuracy box unticked)`)
    await page.getByText('The information I’ve provided').click()
    log(P, 'Find how to change answers after sending', `after tick with name "Linda Moreau" for Daniel Tan → disabled=${await btn.isDisabled()}`)
  })
  await ctx.close()
}

await browser.close()
