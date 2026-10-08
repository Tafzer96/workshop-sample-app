import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Vitest's transform pipeline uses esbuild (unlike `vite build`, which uses oxc on Vite 8
  // and ignores this), and esbuild defaults to the classic JSX runtime without this override.
  ...(process.env.VITEST ? { esbuild: { jsx: 'automatic' } } : {}),
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': 'http://127.0.0.1:3000',
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./ui/test/setup.js'],
    include: ['ui/**/*.test.jsx'],
  },
});
