// Code panel for notes: language badge, line numbers, copy button and syntax colours.

import hljs from 'highlight.js/lib/core'
import bash from 'highlight.js/lib/languages/bash'
import c from 'highlight.js/lib/languages/c'
import cpp from 'highlight.js/lib/languages/cpp'
import java from 'highlight.js/lib/languages/java'
import javascript from 'highlight.js/lib/languages/javascript'
import json from 'highlight.js/lib/languages/json'
import python from 'highlight.js/lib/languages/python'
import sql from 'highlight.js/lib/languages/sql'
import xml from 'highlight.js/lib/languages/xml'
import { Check, Copy } from 'lucide-react'
import { useMemo, useState } from 'react'

hljs.registerLanguage('bash', bash)
hljs.registerLanguage('c', c)
hljs.registerLanguage('cpp', cpp)
hljs.registerLanguage('java', java)
hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('json', json)
hljs.registerLanguage('python', python)
hljs.registerLanguage('sql', sql)
hljs.registerLanguage('xml', xml)

const NAMES = { js: 'javascript', sh: 'bash', shell: 'bash', py: 'python', html: 'xml', dax: 'sql' }

export default function CodeBlock({ code, language }) {
  const [copied, setCopied] = useState(false)
  const lang = NAMES[language] || language
  const html = useMemo(() => {
    try {
      if (lang && hljs.getLanguage(lang)) return hljs.highlight(code, { language: lang }).value
    } catch {
      // fall through to plain text
    }
    return null
  }, [code, lang])
  const lines = code.split('\n').length

  return (
    <figure className="code-block not-prose my-6 overflow-hidden rounded-xl border border-line bg-code">
      <figcaption className="flex items-center justify-between border-b border-line px-4 py-1.5">
        <span className="font-mono text-caption text-ink-3">{language || 'code'}</span>
        <button
          type="button"
          className="flex min-h-9 items-center gap-1.5 rounded-lg px-2 font-mono text-caption text-ink-2 hover:bg-surface-2 hover:text-ink"
          onClick={() => {
            navigator.clipboard?.writeText(code).then(() => {
              setCopied(true)
              setTimeout(() => setCopied(false), 1500)
            })
          }}
        >
          {copied ? <Check className="size-3.5 text-teal-ink" aria-hidden="true" /> : <Copy className="size-3.5" aria-hidden="true" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </figcaption>
      <div className="flex overflow-x-auto font-mono text-[13px] leading-5" tabIndex={0}>
        <span className="select-none border-r border-line py-3 pr-3 pl-4 text-right text-ink-3" aria-hidden="true">
          {Array.from({ length: lines }, (_, i) => (
            <span key={i} className="block">
              {String(i + 1).padStart(2, '0')}
            </span>
          ))}
        </span>
        {html ? (
          <pre className="hljs flex-1 py-3 pr-4 pl-4">
            <code dangerouslySetInnerHTML={{ __html: html }} />
          </pre>
        ) : (
          <pre className="flex-1 py-3 pr-4 pl-4">
            <code>{code}</code>
          </pre>
        )}
      </div>
    </figure>
  )
}
