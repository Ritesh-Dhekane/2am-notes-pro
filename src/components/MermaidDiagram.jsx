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

// The app's colours for the current theme (CSS variables on <html>), so diagrams match every theme.
function appColours() {
  const css = getComputedStyle(document.documentElement)
  const v = (name) => css.getPropertyValue(name).trim()
  return {
    background: v('--c-canvas'),
    primaryColor: v('--c-surface-2'),
    primaryBorderColor: v('--c-primary'),
    primaryTextColor: v('--c-ink'),
    secondaryColor: v('--c-surface'),
    tertiaryColor: v('--c-surface'),
    lineColor: v('--c-ink-2'),
    textColor: v('--c-ink'),
    mainBkg: v('--c-surface-2'),
    nodeBorder: v('--c-primary'),
    clusterBkg: v('--c-surface'),
    edgeLabelBackground: v('--c-surface'),
    // The UI font (not the serif reading font), so Mermaid measures labels with the font it draws them in.
    fontFamily: v('--font-sans') || 'system-ui, sans-serif',
    fontSize: '14px',
  }
}

// Mermaid sizes the SVG to its container (width="100%"); use its natural width instead, so a wide diagram
// scrolls inside its box rather than shrinking to unreadable text on a phone.
function naturalSize(svg) {
  const box = svg.match(/viewBox="[\d.-]+ [\d.-]+ ([\d.]+) [\d.]+"/)
  if (!box) return svg
  return svg
    .replace(/ width="100%"/, ` width="${Math.ceil(Number(box[1]))}"`)
    .replace(/style="max-width: [\d.]+px;?"/, 'style="max-width: none;"')
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
          theme: 'base',
          darkMode: !LIGHT_THEMES.has(theme),
          themeVariables: appColours(),
          fontFamily: appColours().fontFamily,
        })
        const { svg } = await mermaid.render(id, code)
        if (!cancelled) setSvg(naturalSize(svg))
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
