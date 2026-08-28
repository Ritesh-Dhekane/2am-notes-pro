import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Absolute base for the GitHub Pages project path in production builds only —
// the dev server still serves from '/' so local URLs don't change.
// main.jsx reads this back via import.meta.env.BASE_URL for the router's basename.
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'build' ? '/2am-notes-pro/' : '/',
}))
