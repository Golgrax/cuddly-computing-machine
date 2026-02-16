import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          '/id-system': {
            target: 'http://localhost:5002',
            changeOrigin: true,
            secure: false,
            rewrite: (path) => path.replace(/^\/id-system/, '')
          },
          '/api/system1': {
            target: 'http://localhost:5002',
            changeOrigin: true,
            secure: false,
            rewrite: (path) => path.replace(/^\/api\/system1/, '/api')
          },
          '/system2-api': {
            target: 'http://localhost:5001',
            changeOrigin: true,
            secure: false,
            rewrite: (path) => path.replace(/^\/system2-api/, '')
          },
          '/resources': {
            target: 'http://localhost:5001',
            changeOrigin: true,
            secure: false,
          },
          '/api': {
            target: 'http://localhost:3001',
            changeOrigin: true,
            secure: false,
          },
          '/uploads': {
            target: 'http://localhost:3001',
            changeOrigin: true,
            secure: false,
          }
        }
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});