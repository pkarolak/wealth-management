import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import { createGate } from './server/dev-gate.ts'

function accessGate(password: string | undefined): Plugin {
  const gate = createGate(password)
  return {
    name: 'access-gate',
    configureServer(server) {
      server.middlewares.use(gate)
    },
    configurePreviewServer(server) {
      server.middlewares.use(gate)
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [accessGate(env.SITE_PASSWORD), react(), tailwindcss()],
    server: { port: 5199 },
    preview: { port: 5199 },
  }
})
