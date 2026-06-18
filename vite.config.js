import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import fs from 'node:fs'
import path from 'node:path'

// Read the whole request body and return it as a string.
function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', (chunk) => {
      data += chunk
    })
    req.on('end', () => resolve(data))
    req.on('error', reject)
  })
}

// Add the small slice of the Vercel response API that our handlers use
// (res.status().json() / res.send()) on top of Node's raw ServerResponse.
function patchRes(res) {
  res.status = (code) => {
    res.statusCode = code
    return res
  }
  res.json = (obj) => {
    if (!res.getHeader('Content-Type')) {
      res.setHeader('Content-Type', 'application/json')
    }
    res.end(JSON.stringify(obj))
    return res
  }
  res.send = (data) => {
    res.end(data)
    return res
  }
  return res
}

// Dev-only middleware that runs the Vercel serverless functions in `api/`
// against the Vite dev server, so `/api/chat` and `/api/speak` work locally
// exactly as they do in production. Without this they 404 in dev (Vite has no
// knowledge of Vercel functions), which makes Aria's chat fail with
// "Connection error: HTTP 404" and TTS fall back to the browser/Kokoro voice.
function devApiPlugin() {
  return {
    name: 'dev-api-functions',
    apply: 'serve', // never touches the production build
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url || !req.url.startsWith('/api/')) return next()

        // /api/<name>?... → api/<name>.js
        const name = req.url.replace(/^\/api\//, '').split('?')[0]
        const handlerFile = path.resolve(process.cwd(), 'api', `${name}.js`)
        if (!name || !fs.existsSync(handlerFile)) return next()

        try {
          const raw = await readBody(req)
          req.body = raw ? JSON.parse(raw) : {}
          patchRes(res)

          // ssrLoadModule handles ESM + HMR for the handler file.
          const mod = await server.ssrLoadModule(`/api/${name}.js`)
          await mod.default(req, res)
        } catch (err) {
          server.config.logger.error(`[dev-api] /api/${name} failed: ${err.message}`)
          if (!res.writableEnded) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: err.message }))
          }
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load ALL env vars (empty prefix), then expose the server-side secrets the
  // dev API functions need on process.env. These stay server-side — they are
  // never bundled into the client because they lack the VITE_ prefix.
  const env = loadEnv(mode, process.cwd(), '')
  for (const key of ['GROQ_API_KEY', 'ELEVENLABS_API_KEY', 'ELEVENLABS_VOICE_ID']) {
    if (env[key]) process.env[key] = env[key]
  }

  return {
    plugins: [
      react(),
      devApiPlugin(),
      VitePWA({
        registerType: 'autoUpdate',
        manifest: {
          name: 'EnglishQuest',
          short_name: 'EnglishQuest',
          description: 'Gamified English Learning with AI Coach Aria',
          start_url: '/',
          display: 'standalone',
          orientation: 'portrait',
          theme_color: '#00e5ff',
          background_color: '#0a0a0f',
          icons: [
            { src: '/pandu-icon.png', sizes: '192x192', type: 'image/png' },
            { src: '/pandu-icon.png', sizes: '512x512', type: 'image/png' },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
              },
            },
          ],
        },
      }),
    ],
    server: {
      port: 5173,
      open: true, // auto-open the default system browser on `npm run dev`
    },
  }
})
