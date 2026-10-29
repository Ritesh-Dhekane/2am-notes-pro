// A note rendered for reading: headings with ids (for the outline), callouts, tables, code panels,
// and $…$ / $$…$$ formulas (KaTeX).

import { AlertTriangle, BookMarked, Info, Lightbulb } from 'lucide-react'
import { createElement, useEffect, useMemo, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import { createSlugger, nodeText, rehypeCallouts, remarkDisplayMath } from '../lib/markdown.js'
import CodeBlock from './CodeBlock.jsx'
import MermaidDiagram from './MermaidDiagram.jsx'
import NoteImage from './NoteImage.jsx'

const CALLOUT_LOOK = {
  tip: { icon: Lightbulb, className: 'callout-tip' },
  important: { icon: AlertTriangle, className: 'callout-important' },
  definition: { icon: BookMarked, className: 'callout-definition' },
  note: { icon: Info, className: 'callout-note' },
}

// KaTeX (about 80 KB gzipped, plus its CSS and fonts) loads only for notes that have formulas.
let rehypeKatex = null
let katexLoading = null
function loadKatex() {
  katexLoading ||= Promise.all([import('rehype-katex'), import('katex/dist/katex.min.css')]).then(([m]) => {
    rehypeKatex = m.default
  })
  return katexLoading
}

function renderNote(markdown, noteId) {
  // A fresh slugger per note, so ids match the outline (both count duplicates in order).
  const slug = createSlugger()
  const withId =
    (Tag) =>
    ({ node, children }) =>
      createElement(Tag, { id: slug(nodeText(node)) }, children)

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkMath, remarkDisplayMath]}
      // A formula KaTeX can't parse shows as its source in red instead of breaking the note.
      rehypePlugins={[...(rehypeKatex ? [[rehypeKatex, { throwOnError: false, strict: false }]] : []), rehypeCallouts]}
      components={{
        // The page shows the note's title as its h1, so headings inside start at h2.
        h1: ({ children }) => <h2>{children}</h2>,
        h2: withId('h2'),
        h3: withId('h3'),
        aside({ node, children }) {
          const kind = node.properties?.dataCallout
          const look = CALLOUT_LOOK[kind] || CALLOUT_LOOK.note
          return (
            <div role="note" aria-label={node.properties?.dataLabel} className={`callout ${look.className}`}>
              <p className="callout-label">
                {createElement(look.icon, {
                  className: 'size-4',
                  'aria-hidden': true,
                })}
                {node.properties?.dataLabel}
              </p>
              {children}
            </div>
          )
        },
        pre: ({ children }) => children,
        code({ className, children }) {
          const text = String(children ?? '')
          const language = className?.match(/language-([\w+-]+)/)?.[1]
          if (language === 'mermaid') return <MermaidDiagram code={text.replace(/\n$/, '')} />
          // Fenced blocks have a language or span lines; everything else is inline code.
          if (language || text.includes('\n')) return <CodeBlock code={text.replace(/\n$/, '')} language={language} />
          return <code className="inline-code">{children}</code>
        },
        table: ({ children }) => (
          <div className="table-wrap" tabIndex={0}>
            <table>{children}</table>
          </div>
        ),
        a: ({ href, children }) => (
          <a href={href} target={href?.startsWith('#') ? undefined : '_blank'} rel="noopener noreferrer">
            {children}
          </a>
        ),
        img: ({ src, alt }) => <NoteImage src={src} alt={alt} noteId={noteId} />,
      }}
    >
      {markdown}
    </ReactMarkdown>
  )
}

export default function MarkdownArticle({ markdown, noteId, style, measure = true }) {
  // A note with "$" waits for KaTeX, so its formulas never flash as raw $…$ text.
  const needsMath = String(markdown ?? '').includes('$')
  const [mathReady, setMathReady] = useState(Boolean(rehypeKatex))
  useEffect(() => {
    // If KaTeX can't load (offline), the note still shows, with formulas as plain text.
    if (needsMath && !mathReady) loadKatex().catch(() => {}).then(() => setMathReady(true))
  }, [needsMath, mathReady])
  const ready = !needsMath || mathReady
  // Rendered once per note: the component map is rebuilt with each render, which would otherwise
  // remount headings, callouts and code panels whenever the page re-renders (e.g. while reading aloud).
  const article = useMemo(() => (ready ? renderNote(markdown, noteId) : null), [markdown, noteId, ready])
  return (
    <div className={`note-prose ${measure ? 'measure' : ''}`} style={style}>
      {article}
    </div>
  )
}
