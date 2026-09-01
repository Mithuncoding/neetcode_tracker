import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

const configuredBase = process.env.VITE_BASE_PATH ?? '/'
const base = configuredBase.endsWith('/') ? configuredBase : `${configuredBase}/`

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['app-icon.svg'],
      manifest: {
        name: "Mithun's Interview Studio",
        short_name: 'Interview Studio',
        description: 'A personal system for LeetCode sessions, pattern recognition, Python fluency, recall, and interview readiness.',
        theme_color: '#191b1e',
        background_color: '#f4f5f7',
        display: 'standalone',
        start_url: '.',
        icons: [
          {
            src: 'app-icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        cleanupOutdatedCaches: true,
        globPatterns: ['**/*.{js,css,html,svg,woff2,json}'],
        navigateFallback: 'index.html',
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/cdn\.jsdelivr\.net\/pyodide\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'pyodide-runtime',
              expiration: { maxEntries: 12, maxAgeSeconds: 30 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  base,
})
