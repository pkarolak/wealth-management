import { authorize } from './server/gate.ts'

export default async function middleware(request: Request) {
  const response = await authorize(request, process.env.SITE_PASSWORD)
  if (response) return response
}

export const config = {
  matcher: '/(.*)',
}
