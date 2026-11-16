import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'DEV_')
  return {
    plugins: [react(), tailwindcss()],
    server: {
      host: '127.0.0.1',
      port: 5173,
      strictPort: true,
      proxy: {
        '/health': {
          target: env.DEV_BACKEND_ORIGIN || 'http://127.0.0.1:8000',
          changeOrigin: true,
        },
      },
    },
  }
})
