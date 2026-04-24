import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    allowedHosts: ['ace-endopoditic-dacia.ngrok-free.dev']
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'lucide-react'],
          charts: ['recharts'],
          utils: ['axios', '@supabase/supabase-js', 'zustand', 'idb-keyval', 'papaparse'],
        },
      },
    },
  },
})
