import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'gradio-config-rewriter',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (req.url && req.url.startsWith('/gradio-api/config')) {
              try {
                const targetUrl = 'https://unmeshraj-dysarthric-transcriber.hf.space/config';
                const response = await fetch(targetUrl);
                const config = await response.json() as any;
                
                const host = req.headers.host || 'localhost:5173';
                const proto = req.headers['x-forwarded-proto'] || 'http';
                
                config.root = `${proto}://${host}/gradio-api`;
                
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(config));
              } catch (error) {
                console.error('[Gradio Rewriter] Error rewriting config:', error);
                next();
              }
            } else {
              next();
            }
          });
        }
      }
    ],
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
