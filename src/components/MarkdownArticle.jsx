// A note rendered for reading: headings with ids (for the outline), callouts, tables, code panels.

import { AlertTriangle, BookMarked, Info, Lightbulb } from 'lucide-react'
import { createElement } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { createSlugger, nodeText, rehypeCallouts } from '../lib/markdown.js'
import CodeBlock from './CodeBlock.jsx'

const CALLOUT_LOOK = {
  tip: { icon: Lightbulb, className: 'callout-tip' },
  important: { icon: AlertTriangle, className: 'callout-important' },
  definition: { icon: BookMarked, className: 'callout-definition' },
  note: { icon: Info, className: 'callout-note' },
}

export default function MarkdownArticle({ markdown, style, measure = true }) {
  // A fresh slugger each render, so ids match the outline (both count duplicates in order).
  const slug = createSlugger()
  const withId = (Tag) => ({ node, children }) => createElement(Tag, { id: slug(nodeText(node)) }, children)

  return (
    <div className={`note-prose ${measure ? 'measure' : ''}`} style={style}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeCallouts]}
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
                  {createElement(look.icon, { className: 'size-4', 'aria-hidden': true })}
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
          img: ({ src, alt }) => <img src={src} alt={alt || ''} loading="lazy" />,
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  )
}
