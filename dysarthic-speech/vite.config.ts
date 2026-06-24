import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.HF_TOKEN': JSON.stringify(env.HF_TOKEN || ''),
    },
    server: {
      proxy: {
        '/gradio-api': {
          target: 'https://unmeshraj-dysarthric-transcriber.hf.space',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/gradio-api/, ''),
          ws: true,
        }
      }
    },
    optimizeDeps: {
      exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util'],
    },
  }
})
