import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Proxy API and dataset calls to the Express backend (default: http://localhost:5000)
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/dataset': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
})
