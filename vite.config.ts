import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: './',
  plugins: [
    svelte(),
    VitePWA({
      // 'prompt'：有新版本时弹出“更新”，不会在做菜途中突然刷新（沿用 recipe-jar 的做法）
      registerType: 'prompt',
      workbox: { globPatterns: ['**/*.{js,css,html,svg,png,woff2}'] },
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: '我的菜谱',
        short_name: '菜谱',
        description: '把做过的菜一道一道记下来',
        lang: 'zh-CN',
        theme_color: '#efe8dc',
        background_color: '#f5f2ec',
        display: 'standalone',
        orientation: 'portrait',
        start_url: './',
        scope: './',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          { src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml' },
        ],
      },
    }),
  ],
})
