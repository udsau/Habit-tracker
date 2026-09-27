import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',                          // relative paths — required for GitHub Pages
  build: {
    chunkSizeWarningLimit: 1000,       // recharts + dnd-kit are intentionally large
  },
})

