import react from '@vitejs/plugin-react';
import path from "path";
import { defineConfig } from 'vite';
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server:{
    allowedHosts:true
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
