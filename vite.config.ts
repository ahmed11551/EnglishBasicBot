/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,svg,woff2}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//, /\.(?:png|jpg|jpeg|svg|ico|woff2?)$/i],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/telegram\.org\/.*/i,
            handler: 'NetworkFirst',
            options: { cacheName: 'telegram-cache', networkTimeoutSeconds: 3 },
          },
        ],
      },
      manifest: {
        name: 'МГИМО ENGLISH',
        short_name: 'МГИМО ENGLISH',
        description: 'Профессиональная лексика: дипломатия, ООН, переговоры',
        theme_color: '#1a4d0d',
        background_color: '#f6f5f3',
        icons: [
          { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
    }),
  ],
})
