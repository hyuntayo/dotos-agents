import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: { '/api': { target: process.env.DOTOS_API_TARGET || 'http://127.0.0.1:8787' } },
  },
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
})
