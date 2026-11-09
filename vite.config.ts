import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// Cấu hình Vite cho Admin Web của TokenScope.
//
// - `VITE_API_BASE_URL` — địa chỉ backend TokenScope (mặc định http://localhost:3000).
// - `VITE_ADMIN_PORT` — cổng dev server của Admin Web (mặc định 5173).
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: Number(process.env.VITE_ADMIN_PORT ?? 5173),
    strictPort: false,
  },
});
