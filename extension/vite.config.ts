import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { crx } from '@crxjs/vite-plugin';
import manifest from './manifest.config';

export default defineConfig({
  plugins: [react(), tailwindcss(), crx({ manifest })],
  server: {
    // Bind IPv4 explicitly — default 'localhost' resolves to IPv6 (::1) on
    // macOS, which Chrome (using 127.0.0.1) can't reach → "cannot connect to
    // the vite dev server".
    host: '127.0.0.1',
    cors: { origin: [/chrome-extension:\/\//] },
    strictPort: true,
    port: 5173,
    hmr: { host: '127.0.0.1', port: 5173 },
  },
});
