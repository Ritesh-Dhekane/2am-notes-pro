// GitHub Pages has no server-side routing: unknown paths get 404.html (the app, with a 404 status).
// Pages that outside services fetch directly get a real copy of the app, so they answer 200: the privacy
// policy, and every free preview in the sitemap (search engines skip pages that answer 404). The SPPU
// syllabus pages get their own pre-rendered copy, with their meta in the <head> (syllabus-pages.mjs).
import { copyFileSync, mkdirSync } from 'node:fs'
import { writeSitemap } from './sitemap.mjs'
import { writeSyllabusPages } from './syllabus-pages.mjs'

const PAGES = ['privacy'] // the privacy policy is linked from Google's sign-in consent screen

copyFileSync('dist/index.html', 'dist/404.html')
for (const page of PAGES) {
  mkdirSync(`dist/${page}`, { recursive: true })
  copyFileSync('dist/index.html', `dist/${page}/index.html`)
}

for (const path of await writeSitemap(writeSyllabusPages())) {
  const dir = `dist/${decodeURIComponent(path)}`
  mkdirSync(dir, { recursive: true })
  copyFileSync('dist/index.html', `${dir}/index.html`)
}
