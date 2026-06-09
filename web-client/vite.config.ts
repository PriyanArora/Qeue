import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const apiBaseUrl = (env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');
  const apiProxy = {
    target: apiBaseUrl || 'http://localhost:8080',
    changeOrigin: true,
  };

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': apiProxy,
      },
    },
    preview: {
      proxy: {
        '/api': apiProxy,
      },
    },
  };
});
