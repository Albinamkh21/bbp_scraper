import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5174,
    proxy: {
      '/api': {
        target: 'http://bbp_api:3000',
        changeOrigin: true,
        ws:false,
      },
      '/ws': {
        target: 'ws://bbp_api:3000',
        ws: true, 
      },
    },
    watch: {
      usePolling: true // Нужно для корректной работы hot-reload в Docker
    }
  }
})