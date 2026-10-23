// GitHub Pages has no server-side routing: unknown paths get 404.html (the app, with a 404 status).
// Pages that outside services fetch directly get a real copy of the app, so they answer 200.
import { copyFileSync, mkdirSync } from 'node:fs'
import { writeSitemap } from './sitemap.mjs'

const PAGES = ['privacy'] // the privacy policy is linked from Google's sign-in consent screen

copyFileSync('dist/index.html', 'dist/404.html')
for (const page of PAGES) {
  mkdirSync(`dist/${page}`, { recursive: true })
  copyFileSync('dist/index.html', `dist/${page}/index.html`)
}

await writeSitemap()
