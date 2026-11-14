const COOKIE = 'wm_access'
const PAYLOAD = 'wm-access-v1'
const MAX_AGE = 60 * 60 * 24 * 14

/** Allow the request through, or return the response that should be sent instead. */
export async function authorize(request: Request, password: string | undefined): Promise<Response | null> {
  const url = new URL(request.url)
  if (url.pathname === '/favicon.svg') return null

  if (!password) return text('This preview is unavailable.', 503)

  if (url.pathname === '/api/unlock' && request.method === 'POST') {
    const length = Number(request.headers.get('content-length') ?? 0)
    if (length > 2048) return text('Bad request', 400)
    const form = await request.formData()
    const given = String(form.get('password') ?? '')
    const next = safeNext(String(form.get('next') ?? '/'))
    if (!(await sameSecret(password, given))) return html(loginPage(next, true), 401)
    return redirect(next, await gateToken(password), url.protocol === 'https:')
  }

  const token = readCookie(request.headers.get('cookie'))
  if (token && (await tokenMatches(password, token))) return null

  const next = safeNext(`${url.pathname}${url.search}`)
  return html(loginPage(next, false), 401)
}

function redirect(location: string, token: string, secure: boolean) {
  const headers = new Headers({ location, 'cache-control': 'no-store' })
  headers.append('set-cookie', sessionCookie(token, secure))
  return new Response(null, { status: 303, headers })
}

function sessionCookie(token: string, secure: boolean) {
  const parts = [`${COOKIE}=${token}`, 'HttpOnly', 'Path=/', `Max-Age=${MAX_AGE}`, 'SameSite=Lax']
  if (secure) parts.push('Secure')
  return parts.join('; ')
}

function readCookie(header: string | null) {
  if (!header) return undefined
  for (const part of header.split(';')) {
    const [name, ...rest] = part.trim().split('=')
    if (name === COOKIE) return rest.join('=')
  }
  return undefined
}

function safeNext(value: string) {
  if (!value.startsWith('/') || value.startsWith('//') || value.includes('\\') || value.includes('://')) return '/'
  return value
}

async function sameSecret(expected: string, given: string) {
  const encoder = new TextEncoder()
  const [a, b] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(expected)),
    crypto.subtle.digest('SHA-256', encoder.encode(given)),
  ])
  return constantTimeEqual(new Uint8Array(a), new Uint8Array(b))
}

async function gateToken(password: string) {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(PAYLOAD))
  return [...new Uint8Array(signature)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

async function tokenMatches(password: string, token: string) {
  const expected = await gateToken(password)
  if (token.length !== expected.length) return false
  const encoder = new TextEncoder()
  return constantTimeEqual(encoder.encode(expected), encoder.encode(token))
}

function constantTimeEqual(a: Uint8Array, b: Uint8Array) {
  if (a.length !== b.length) return false
  let difference = 0
  for (let i = 0; i < a.length; i++) difference |= a[i]! ^ b[i]!
  return difference === 0
}

function text(body: string, status: number) {
  return new Response(body, { status, headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' } })
}

function html(body: string, status: number) {
  return new Response(body, { status, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } })
}

function loginPage(next: string, rejected: boolean) {
  const error = rejected ? '<p class="error">That password is not right.</p>' : ''
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="robots" content="noindex" />
  <title>Parker &amp; Lane Wealth</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      display: grid;
      place-items: center;
      background: #f7f6f0;
      color: #141413;
      font-family: Inter, ui-sans-serif, system-ui, sans-serif;
      -webkit-font-smoothing: antialiased;
    }
    main { width: min(100% - 48px, 380px); padding: 48px 0; }
    .mark {
      width: 36px;
      height: 36px;
      border-radius: 999px;
      background: #ebe7df;
      display: grid;
      place-items: center;
      font-family: Georgia, "Iowan Old Style", Palatino, serif;
      font-size: 20px;
    }
    h1 {
      margin: 20px 0 0;
      font-family: Georgia, "Iowan Old Style", Palatino, serif;
      font-weight: 500;
      font-size: 36px;
      letter-spacing: -0.02em;
      line-height: 1.05;
    }
    .lede { margin: 10px 0 0; color: #5e5b55; font-size: 15px; line-height: 1.5; }
    form { margin-top: 28px; display: grid; gap: 12px; }
    label { font-size: 13px; color: #3d3b37; }
    input {
      width: 100%;
      height: 44px;
      border: 1px solid #e5e0d9;
      border-radius: 10px;
      background: #fff;
      padding: 0 12px;
      font: inherit;
      color: inherit;
    }
    input:focus { outline: 2px solid #141413; outline-offset: 2px; }
    button {
      height: 44px;
      border: 0;
      border-radius: 10px;
      background: #141413;
      color: #fff;
      font: inherit;
      font-size: 15px;
      cursor: pointer;
    }
    button:hover { background: #2c2b28; }
    .error { margin: 0; color: #b0533f; font-size: 13px; }
  </style>
</head>
<body>
  <main>
    <div class="mark" aria-hidden="true">N</div>
    <h1>Private preview</h1>
    <p class="lede">Enter the password to open Parker &amp; Lane Wealth.</p>
    <form method="post" action="/api/unlock">
      <input type="hidden" name="next" value="${escapeAttr(next)}" />
      <label for="password">Password</label>
      ${error}
      <input id="password" name="password" type="password" autocomplete="current-password" required autofocus />
      <button type="submit">Continue</button>
    </form>
  </main>
</body>
</html>`
}

function escapeAttr(value: string) {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
}
