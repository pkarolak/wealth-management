import type { IncomingMessage, ServerResponse } from 'node:http'
import { authorize } from './gate.ts'

export function createGate(password: string | undefined) {
  return (req: IncomingMessage, res: ServerResponse, next: (err?: unknown) => void) => {
    void handle(req, res, next, password)
  }
}

async function handle(req: IncomingMessage, res: ServerResponse, next: (err?: unknown) => void, password: string | undefined) {
  try {
    const method = req.method ?? 'GET'
    const body = method === 'GET' || method === 'HEAD' ? undefined : await readBody(req)
    const response = await authorize(toRequest(req, body), password)
    if (!response) {
      next()
      return
    }
    await writeResponse(res, response)
  } catch {
    if (!res.headersSent) {
      res.statusCode = 400
      res.end('Bad request')
    }
  }
}

function toRequest(req: IncomingMessage, body: Buffer | undefined) {
  const host = req.headers.host ?? 'localhost'
  const forwarded = req.headers['x-forwarded-proto']
  const proto = (Array.isArray(forwarded) ? forwarded[0] : forwarded)?.split(',')[0] || 'http'
  const headers = new Headers()
  for (const [key, value] of Object.entries(req.headers)) {
    if (value == null) continue
    headers.set(key, Array.isArray(value) ? value.join(', ') : value)
  }
  return new Request(`${proto}://${host}${req.url ?? '/'}`, {
    method: req.method,
    headers,
    body,
  })
}

function readBody(req: IncomingMessage) {
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = []
    let size = 0
    req.on('data', (chunk: Buffer) => {
      size += chunk.length
      if (size > 2048) {
        reject(new Error('body too large'))
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

async function writeResponse(res: ServerResponse, response: Response) {
  res.statusCode = response.status
  const cookies = response.headers.getSetCookie()
  response.headers.forEach((value, key) => {
    if (key.toLowerCase() === 'set-cookie') return
    res.setHeader(key, value)
  })
  if (cookies.length) res.setHeader('set-cookie', cookies)
  res.end(Buffer.from(await response.arrayBuffer()))
}
