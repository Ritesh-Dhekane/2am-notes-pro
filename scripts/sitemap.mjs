// dist/sitemap.xml: the pages that work signed out (home, privacy) and every free preview from the
// backend's public catalog (Unit 1 notes, plus files an admin made a free preview). If the catalog
// can't be reached, or there's no API URL, the sitemap still gets the static pages.
import { writeFileSync } from 'node:fs'
import { loadEnv } from 'vite'

const SITE = 'https://ritesh-dhekane.github.io/2am-notes-pro/'
const STATIC_PAGES = ['', 'privacy'] // /login is the welcome page again, so it's left out

async function previewPaths() {
  const apiUrl = loadEnv('production', process.cwd(), 'VITE_').VITE_API_BASE_URL
  if (!apiUrl) throw new Error('VITE_API_BASE_URL is not set')
  const response = await fetch(apiUrl, {
    method: 'POST',
    body: JSON.stringify({ action: 'catalog' }),
    signal: AbortSignal.timeout(20000),
  })
  if (!response.ok) throw new Error(`catalog request failed with status ${response.status}`)
  const data = await response.json()
  if (data.error || !Array.isArray(data.semesters)) throw new Error('catalog reply has no semesters')
  const paths = new Set()
  for (const semester of data.semesters) {
    for (const subject of semester.subjects || []) {
      for (const file of [...(subject.unit1 || []), ...(subject.free || [])]) {
        if (subject.slug && file?.id) paths.add(`preview/${encodeURIComponent(subject.slug)}/${encodeURIComponent(file.id)}`)
      }
    }
  }
  return [...paths]
}

export async function writeSitemap() {
  let previews = []
  try {
    previews = await previewPaths()
  } catch (error) {
    console.warn(`sitemap: no preview pages (${error.message}); writing the static pages only`)
  }
  const lastmod = new Date().toISOString().slice(0, 10)
  // Folder pages end in a slash: GitHub Pages redirects /privacy to /privacy/, so list the final address.
  const urls = [...STATIC_PAGES, ...previews]
    .map((path) => `  <url>\n    <loc>${SITE}${path}${path ? '/' : ''}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </url>`)
    .join('\n')
  writeFileSync(
    'dist/sitemap.xml',
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
  )
  console.log(`sitemap: ${STATIC_PAGES.length + previews.length} URLs (${previews.length} previews)`)
  return previews
}
