import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // dev: forward /api to the local enquiry service (cd server && npm start)
  server: { proxy: { '/api': 'http://127.0.0.1:4100' } },
});
