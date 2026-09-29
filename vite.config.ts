import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  // Относительные пути, чтобы сборка работала на GitHub Pages под любым именем репозитория
  base: './',
  plugins: [react()],
})
