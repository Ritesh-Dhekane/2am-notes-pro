// Helpers for rendering notes: heading ids and the outline, the note's own title, reading time, and
// a rehype plugin that turns "> **Exam tip:** …" blockquotes into styled callouts.

export const CALLOUTS = {
  'exam tip': 'tip',
  tip: 'tip',
  important: 'important',
  warning: 'important',
  definition: 'definition',
  note: 'note',
  remember: 'note',
}

// Same ids for the outline and the rendered headings: lower-case, dashes, de-duplicated in order.
export function createSlugger() {
  const seen = new Map()
  return (text) => {
    const base =
      text
        .toLowerCase()
        .replace(/[`*_~[\]()]/g, '')
        .replace(/[^\p{L}\p{N}]+/gu, '-')
        .replace(/^-+|-+$/g, '') || 'section'
    const n = seen.get(base) || 0
    seen.set(base, n + 1)
    return n ? `${base}-${n}` : base
  }
}

// Removes a leading "# Title" line (the page shows the title itself) and returns it.
export function splitTitle(markdown) {
  const match = markdown.match(/^\s*#\s+(.+?)\s*#*\s*\n/)
  if (!match) return { title: null, body: markdown }
  return { title: match[1].trim(), body: markdown.slice(match[0].length) }
}

function stripInline(text) {
  return text
    .replace(/`([^`]*)`/g, '$1')
    .replace(/\*\*([^*]*)\*\*|__([^_]*)__/g, '$1$2')
    .replace(/\*([^*]*)\*|_([^_]*)_/g, '$1$2')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .trim()
}

// ## and ### headings outside code blocks, in order, with the ids the article will use.
export function outline(markdown) {
  const slug = createSlugger()
  const items = []
  let inFence = false
  for (const line of markdown.split('\n')) {
    if (/^\s*(```|~~~)/.test(line)) inFence = !inFence
    if (inFence) continue
    const m = line.match(/^(#{2,3})\s+(.+?)\s*#*\s*$/)
    if (m) {
      const text = stripInline(m[2])
      items.push({ level: m[1].length, text, id: slug(text) })
    }
  }
  return items
}

export function readingMinutes(markdown) {
  const words = markdown.replace(/```[\s\S]*?```/g, ' ').split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / 200))
}

// Plain text of a hast node (for heading ids and callout labels).
export function nodeText(node) {
  if (!node) return ''
  if (node.type === 'text') return node.value
  return (node.children || []).map(nodeText).join('')
}

// GitHub-style alerts (> [!NOTE] …), which the 2AM Notes markdown uses.
const ALERTS = {
  note: ['note', 'Note'],
  tip: ['tip', 'Tip'],
  important: ['important', 'Important'],
  warning: ['important', 'Warning'],
  caution: ['important', 'Caution'],
}
const ALERT_MARK = /^\s*\[!(note|tip|important|warning|caution)\]\s*/i

// rehype plugin: <blockquote><p><strong>Exam tip:</strong> …</p></blockquote> (or <p>[!TIP] …</p>)
// → <aside data-callout="tip" data-label="Exam tip"><p>…</p></aside>
export function rehypeCallouts() {
  return (tree) => {
    const visit = (node) => {
      if (!node.children) return
      node.children.forEach(visit)
      if (node.type !== 'element' || node.tagName !== 'blockquote') return
      const p = node.children.find((c) => c.type === 'element')
      const lead = p?.tagName === 'p' ? p.children?.[0] : null
      const alert = lead?.type === 'text' && lead.value.match(ALERT_MARK)
      if (alert) {
        const [kind, label] = ALERTS[alert[1].toLowerCase()]
        lead.value = lead.value.slice(alert[0].length)
        if (!lead.value && p.children.length === 1) node.children.splice(node.children.indexOf(p), 1)
        node.tagName = 'aside'
        node.properties = { ...node.properties, dataCallout: kind, dataLabel: label }
        return
      }
      const strong = p?.tagName === 'p' && p.children?.find((c) => c.type === 'element' || c.value?.trim())
      if (!strong || strong.type !== 'element' || strong.tagName !== 'strong') return
      const label = nodeText(strong).replace(/:\s*$/, '').trim()
      const kind = CALLOUTS[label.toLowerCase()]
      if (!kind) return
      p.children = p.children.slice(p.children.indexOf(strong) + 1)
      const first = p.children[0]
      if (first?.type === 'text') first.value = first.value.replace(/^\s*:?\s*/, '')
      node.tagName = 'aside'
      node.properties = { ...node.properties, dataCallout: kind, dataLabel: label }
    }
    visit(tree)
  }
}
