import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'NutriTrack',
        short_name: 'NutriTrack',
        description: 'Indian-first mobile PWA for tracking food nutrition',
        theme_color: '#4CAF50',
        background_color: '#FAFAFA',
        display: 'standalone',
        icons: [
          {
            src: 'https://placehold.co/192x192/4CAF50/FFFFFF.png?text=NT',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'https://placehold.co/512x512/4CAF50/FFFFFF.png?text=NT',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
})