import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    // Mux's REST API does not send CORS headers, so the dev server forwards /mux-api to it.
    proxy: {
      '/mux-api': {
        target: 'https://api.mux.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/mux-api/, ''),
      },
    },
  },
});
