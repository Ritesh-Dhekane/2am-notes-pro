import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Absolute base for the GitHub Pages project path in production builds only —
// the dev server still serves from '/' so local URLs don't change.
// main.jsx reads this back via import.meta.env.BASE_URL for the router's basename.
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'build' ? '/2am-notes-pro/' : '/',
  // The slide viewer (pptx-preview, which bundles a charts library) is ~1.3 MB, but it is its own
  // chunk and only downloads when someone opens a .pptx, so the default 500 kB warning is noise.
  build: { chunkSizeWarningLimit: 1500 },
}))
