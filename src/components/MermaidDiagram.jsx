// A ```mermaid block drawn as a diagram. Mermaid is large, so it is loaded only when a page has one.
// If the diagram can't be drawn, the source is shown as code instead.

import { useEffect, useId, useState } from 'react'
import { usePrefs } from '../lib/prefs.js'
import CodeBlock from './CodeBlock.jsx'

const LIGHT_THEMES = new Set(['light', 'sepia'])
let mermaidPromise = null

function loadMermaid() {
  mermaidPromise ??= import('mermaid').then((m) => m.default)
  return mermaidPromise
}

export default function MermaidDiagram({ code }) {
  const { theme } = usePrefs()
  const id = `mermaid-${useId().replace(/[^a-zA-Z0-9]/g, '')}`
  const [svg, setSvg] = useState(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    loadMermaid()
      .then(async (mermaid) => {
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: 'strict',
          theme: LIGHT_THEMES.has(theme) ? 'default' : 'dark',
          fontFamily: 'inherit',
        })
        const { svg } = await mermaid.render(id, code)
        if (!cancelled) setSvg(svg)
      })
      .catch(() => !cancelled && setFailed(true))
    return () => {
      cancelled = true
    }
  }, [code, id, theme])

  if (failed) return <CodeBlock code={code} language="mermaid" />
  return (
    <figure className="diagram" role="img" aria-label="Diagram">
      {svg ? (
        // Mermaid's own output in strict mode (it sanitises labels); not user HTML.
        <div className="diagram-svg" dangerouslySetInnerHTML={{ __html: svg }} />
      ) : (
        <div className="diagram-loading">Drawing diagram…</div>
      )}
    </figure>
  )
}
