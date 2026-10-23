// Scrapes SPPU's official syllabus lists (two SharePoint libraries: 2025 and 2026) into
// data/syllabus.raw.json: { year, faculty, course, name, href, date } per file. clean.mjs turns it
// into the site's data. Run: `npx playwright install chromium` once, then
// `node scripts/sppu-syllabus/scrape.mjs [out.json]`. Set PW_CHANNEL=chrome to use an installed Chrome.
import { chromium } from 'playwright'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import process from 'node:process'

const OUT = process.argv[2] || 'data/syllabus.raw.json'
const LIBRARIES = { 2026: 'Syllabus%202026', 2025: 'Syllabus2025' }
const LIST_URL = (lib) => `http://collegecirculars.unipune.ac.in/sites/documents/${lib}/Forms/AllItems.aspx`

const browser = await chromium.launch({ channel: process.env.PW_CHANNEL || undefined })
const all = []
for (const [year, lib] of Object.entries(LIBRARIES)) {
  const page = await browser.newPage()
  await page.goto(LIST_URL(lib), { waitUntil: 'networkidle', timeout: 90000 })
  // Expand the collapsed groups (faculty, then course) until none are left.
  for (let round = 0; round < 8; round++) {
    const opened = await page.evaluate(() => {
      const links = [...document.querySelectorAll('[onclick*="ExpCollGroup"]')].filter((a) => (a.querySelector('img')?.src || '').includes('plus'))
      links.forEach((a) => a.click())
      return links.length
    })
    await page.waitForTimeout(opened ? 4000 : 500)
    if (!opened) break
  }
  await page.waitForLoadState('networkidle').catch(() => {})
  const seen = new Map()
  const collect = () =>
    page.evaluate(() => {
      const out = []
      let faculty = ''
      let course = ''
      for (const tr of document.querySelectorAll('table.ms-listviewtable tr, table.ms-listviewtable tbody[id^="tbod"] tr')) {
        const text = tr.innerText.replace(/\s+/g, ' ').trim()
        if (/^Faculty :/.test(text)) {
          faculty = text.replace(/^Faculty : /, '').replace(/\s*\(\d+\)\s*$/, '')
          continue
        }
        if (/^Course :/.test(text)) {
          course = text.replace(/^Course : /, '').replace(/\s*\(\d+\)\s*$/, '')
          continue
        }
        const a = [...tr.querySelectorAll('a[href]')].find((x) => /\.(pdf|docx?|xlsx?|zip)$/i.test(x.getAttribute('href')))
        if (a) out.push({ faculty, course, name: a.innerText.trim(), href: a.href, date: (text.match(/\d{1,2}\/\d{1,2}\/\d{4}/) || [''])[0] })
      }
      return out
    })
  // A group shows 30 rows per page: keep clicking each group's "Next" arrow until none is left.
  for (let i = 0; i < 80; i++) {
    for (const row of await collect()) if (!seen.has(row.href)) seen.set(row.href, row)
    const next = page.locator('td[id^="bottomPagingCell"] a:has(img[alt="Next"])').first()
    if (!(await next.count())) break
    await next.click()
    await page.waitForTimeout(3500)
  }
  const rows = [...seen.values()]
  rows.forEach((row) => all.push({ year, ...row }))
  console.log(year, 'items', rows.length)
  await page.close()
}
await browser.close()
if (!all.length) throw new Error('No syllabus files found: the SPPU page layout may have changed')
mkdirSync(dirname(OUT), { recursive: true })
writeFileSync(OUT, JSON.stringify(all, null, 1))
console.log('Wrote', all.length, 'files to', OUT)
