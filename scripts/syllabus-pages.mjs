// Pre-rendered SPPU syllabus pages for search engines: /syllabus/, one per syllabus (/syllabus/<id>/) and
// one per programme (/syllabus/p/<slug>/). Each is the built app (so the SPA still boots, and the page
// answers 200 on GitHub Pages) with its own <title>, description, canonical URL, Open Graph tags and
// JSON-LD in the <head>, and a plain HTML version of the page inside #root until React replaces it.
// Titles and slugs come from src/lib/syllabus.js, the same as the app. Never links a syllabus PDF.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import {
  byNewest,
  describeEntry,
  entriesOf,
  entryTitles,
  EXPLORER_TITLE,
  courseOf,
  familyOf,
  familySlug,
  familyTitle,
  groupEntries,
  libraryUrl,
  programmeOf,
  programmeSlug,
  programmeTitle,
} from '../src/lib/syllabus.js'

const SITE = 'https://ritesh-dhekane.github.io/2am-notes-pro/'
const SPPU = { '@type': 'CollegeOrUniversity', name: 'Savitribai Phule Pune University', url: 'http://www.unipune.ac.in/' }

const esc = (text) =>
  String(text ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
const url = (path) => `${SITE}${path}/`
const href = (path) => `/2am-notes-pro/${path}/`
const entryPath = (e) => `syllabus/${encodeURIComponent(e.id)}`
const programmePath = (slug) => `syllabus/p/${slug}`
const familyPath = (slug) => `syllabus/f/${slug}`

function breadcrumbs(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, item: url(path).replace(/\/\/$/, '/') })),
  }
}

function itemList(name, items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    numberOfItems: items.length,
    itemListElement: items.map(([itemName, path], i) => ({ '@type': 'ListItem', position: i + 1, name: itemName, url: url(path) })),
  }
}

const credit = (library) =>
  `<p>Source: <a href="${esc(libraryUrl(library))}" rel="noopener">Savitribai Phule Pune University (official syllabus)</a></p>`

function render(template, { path, title, description, jsonLd, body }) {
  const head = [
    `<link rel="canonical" href="${url(path)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="2AM Notes Pro" />`,
    `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:description" content="${esc(description)}" />`,
    `<meta property="og:url" content="${url(path)}" />`,
    `<meta name="twitter:card" content="summary" />`,
    ...jsonLd.map((data) => `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`),
  ].join('\n    ')
  const html = template
    .replace(/<title>[^<]*<\/title>/, () => `<title>${esc(title)}</title>`)
    .replace(/<meta name="description" content="[^"]*" \/>/, () => `<meta name="description" content="${esc(description)}" />`)
    .replace('</head>', () => `  ${head}\n  </head>`)
    .replace('<div id="root"></div>', () => `<div id="root"><main>${body}</main></div>`)
  mkdirSync(`dist/${decodeURIComponent(path)}`, { recursive: true })
  writeFileSync(`dist/${decodeURIComponent(path)}/index.html`, html)
}

// Writes every page and returns their paths (for the sitemap).
export function writeSyllabusPages() {
  if (!existsSync('dist/data/syllabus.json')) {
    console.warn('syllabus: no dist/data/syllabus.json; no syllabus pages')
    return []
  }
  const entries = entriesOf(JSON.parse(readFileSync('dist/data/syllabus.json', 'utf8')))
  if (!entries.length) return []
  const template = readFileSync('dist/index.html', 'utf8')
  const titles = entryTitles(entries)
  const groups = groupEntries(entries)
  // One page per address: a programme listed under two faculties shares one page with all its syllabi.
  const bySlug = new Map()
  for (const g of groups) {
    for (const p of g.programmes) {
      const seen = bySlug.get(p.slug)
      if (seen) seen.entries = [...seen.entries, ...p.entries]
      else bySlug.set(p.slug, { ...p, faculty: g.faculty })
    }
  }
  const programmes = [...bySlug.values()]
  const home = ['2AM Notes Pro', '']
  const explorer = ['SPPU Syllabus', 'syllabus']
  const paths = ['syllabus']

  const newest = [...entries].sort(byNewest).slice(0, 10)
  render(template, {
    path: 'syllabus',
    title: EXPLORER_TITLE,
    description: `Search all ${entries.length} official Savitribai Phule Pune University syllabus PDFs across ${programmes.length} programmes, from MCA and BCA to MBA, B.Sc. and B.E. Read them free on your phone.`,
    jsonLd: [breadcrumbs([home, explorer]), itemList('SPPU syllabus programmes', programmes.map((p) => [p.name, programmePath(p.slug)]))],
    body: [
      '<h1>SPPU Syllabus</h1>',
      '<p>Every official syllabus of Savitribai Phule Pune University, searchable and readable on your phone.</p>',
      credit('2026'),
      `<h2>Course families</h2><ul>${[...new Map(entries.map((e) => [familySlug(e), familyOf(e)]))].map(([slug, name]) => `<li><a href="${href(familyPath(slug))}">${esc(name)} syllabus</a></li>`).join('')}</ul>`,
      `<h2>What's new</h2><ul>${newest.map((e) => `<li><a href="${href(entryPath(e))}">${esc(e.title)}</a> (${esc(e.uploaded)})</li>`).join('')}</ul>`,
      ...groups.map(
        (g) => `<h2>${esc(g.faculty)}</h2><ul>${g.programmes.map((p) => `<li><a href="${href(programmePath(p.slug))}">${esc(p.name)} syllabus</a></li>`).join('')}</ul>`,
      ),
    ].join(''),
  })

  for (const p of programmes) {
    const path = programmePath(p.slug)
    const patterns = [...new Set(p.entries.map((e) => e.pattern).filter(Boolean))]
    paths.push(path)
    render(template, {
      path,
      title: programmeTitle(p.name, p.entries),
      description: `All ${p.entries.length} official SPPU ${p.name} syllabus PDF${p.entries.length === 1 ? '' : 's'}${patterns.length ? ` (${patterns.join(', ')})` : ''}, newest first. Read them free on 2AM Notes Pro.`,
      jsonLd: [
        breadcrumbs([home, explorer, [p.name, path]]),
        itemList(`SPPU ${p.name} syllabi`, p.entries.map((e) => [e.title, entryPath(e)])),
      ],
      body: [
        `<p>${esc(p.faculty)}</p><h1>SPPU ${esc(p.name)} syllabus</h1>`,
        credit(p.entries[0].library),
        `<ul>${p.entries.map((e) => `<li><a href="${href(entryPath(e))}">${esc(e.title)}</a> · ${esc(describeEntry(e))} · uploaded ${esc(e.uploaded)}</li>`).join('')}</ul>`,
        `<p><a href="${href('syllabus')}">All SPPU syllabi</a></p>`,
      ].join(''),
    })
  }

  // One page per course family (/syllabus/f/<slug>/): its courses, each linking its programme page.
  const families = new Map()
  for (const e of entries) families.set(familySlug(e), [...(families.get(familySlug(e)) || []), e])
  for (const [slug, list] of families) {
    const path = familyPath(slug)
    const name = familyOf(list[0])
    const courses = new Map()
    for (const e of list) courses.set(courseOf(e), [...(courses.get(courseOf(e)) || []), e])
    paths.push(path)
    render(template, {
      path,
      title: familyTitle(name, list),
      description: `All ${list.length} official SPPU ${name} syllabus PDFs across ${courses.size} programme${courses.size === 1 ? '' : 's'}, newest first. Read them free on 2AM Notes Pro.`,
      jsonLd: [
        breadcrumbs([home, explorer, [name, path]]),
        itemList(`SPPU ${name} programmes`, [...courses.values()].map((c) => [courseOf(c[0]), programmePath(programmeSlug(c[0]))])),
      ],
      body: [
        `<h1>SPPU ${esc(name)} syllabus</h1>`,
        credit(list[0].library),
        ...[...courses].sort(([a], [b]) => a.localeCompare(b)).map(
          ([course, items]) =>
            `<h2>${esc(course)}</h2><ul>${items.sort(byNewest).map((e) => `<li><a href="${href(entryPath(e))}">${esc(e.title)}</a> · ${esc(describeEntry(e))}</li>`).join('')}</ul>`,
        ),
        `<p><a href="${href('syllabus')}">All SPPU syllabi</a></p>`,
      ].join(''),
    })
  }

  for (const e of entries) {
    const path = entryPath(e)
    const programme = programmeOf(e)
    const detail = describeEntry(e)
    const description = `Official Savitribai Phule Pune University ${programme} syllabus${detail ? ` (${detail})` : ''}: ${e.title}. Read the PDF page by page, free, on 2AM Notes Pro.`
    paths.push(path)
    render(template, {
      path,
      title: titles.get(e.id),
      description,
      jsonLd: [
        breadcrumbs([home, explorer, [programme, programmePath(programmeSlug(e))], [e.title, path]]),
        {
          '@context': 'https://schema.org',
          '@type': 'Course',
          name: `${e.title} (SPPU syllabus)`,
          description,
          url: url(path),
          provider: SPPU,
          inLanguage: 'en',
          ...(e.level ? { educationalLevel: e.level } : {}),
          ...(e.uploaded ? { dateModified: e.uploaded } : {}),
        },
      ],
      body: [
        `<p>${esc(e.faculty)} · <a href="${href(programmePath(programmeSlug(e)))}">${esc(programme)}</a></p>`,
        `<h1>${esc(e.title)}</h1>`,
        `<p>${esc([detail, `${e.library} library`, `Uploaded ${e.uploaded}`].filter(Boolean).join(' · '))}</p>`,
        credit(e.library),
        `<p><a href="${href('syllabus')}">All SPPU syllabi</a></p>`,
      ].join(''),
    })
  }

  console.log(`syllabus: ${paths.length} pages (1 explorer, ${families.size} families, ${programmes.length} programmes, ${entries.length} syllabi)`)
  return paths
}
