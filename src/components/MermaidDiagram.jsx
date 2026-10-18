// A ```mermaid block drawn as a diagram. Mermaid is large, so it is loaded only when a page has one.
// If the diagram can't be drawn, the source is shown as code instead.
// Phones: left-to-right flowcharts may be turned top-to-bottom (whichever is narrower); a diagram a little too wide is shrunk to fit;
// one much too wide scrolls sideways and gets an Expand button (full screen, with zoom).

import { Maximize2, Minus, Plus, X } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
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

const PHONE_QUERY = '(max-width: 640px)'
const MIN_SCALE = 0.75 // shrink no further than this, or labels get too small to read

// Mermaid sizes the SVG to its container (width="100%"); use its natural width instead, so a wide diagram
// isn't squeezed into unreadable text. Returns the SVG and that width.
function naturalSize(svg) {
  const box = svg.match(/viewBox="[\d.-]+ [\d.-]+ ([\d.]+) [\d.]+"/)
  if (!box) return { svg, width: 0 }
  const width = Math.ceil(Number(box[1]))
  return {
    svg: svg.replace(/ width="100%"/, ` width="${width}"`).replace(/style="max-width: [\d.]+px;?"/, 'style="max-width: none;"'),
    width,
  }
}

// On phones a left-to-right flowchart may fit better top-to-bottom (a long chain does; a hub with many
// spokes doesn't), so both are drawn and the narrower one is kept.
function versionsFor(code, phone) {
  const turned = code.replace(/^(\s*(?:flowchart|graph))\s+(LR|RL)\b/m, '$1 TD')
  return phone && turned !== code ? [code, turned] : [code]
}

function usePhone() {
  const [phone, setPhone] = useState(() => typeof window !== 'undefined' && window.matchMedia(PHONE_QUERY).matches)
  useEffect(() => {
    const mq = window.matchMedia(PHONE_QUERY)
    const onChange = () => setPhone(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return phone
}

// Full-screen view of a wide diagram, with zoom buttons (pinch works too).
function DiagramViewer({ svg, width, onClose }) {
  const dialog = useRef(null)
  const [zoom, setZoom] = useState(1)
  useEffect(() => {
    dialog.current.showModal()
  }, [])
  const step = (d) => setZoom((z) => Math.min(3, Math.max(0.5, z + d)))
  return (
    <dialog
      ref={dialog}
      onClose={onClose}
      aria-label="Diagram"
      className="m-0 h-dvh max-h-none w-screen max-w-none bg-canvas p-0 text-ink backdrop:bg-scrim"
    >
      <div className="flex h-full flex-col">
        <div className="flex shrink-0 items-center justify-end gap-1 border-b border-line bg-surface px-3 py-2 pt-[max(0.5rem,env(safe-area-inset-top))]">
          <button type="button" className="icon-btn" onClick={() => step(-0.25)} aria-label="Zoom out">
            <Minus className="size-5" aria-hidden="true" />
          </button>
          <span className="w-12 text-center font-mono text-caption text-ink-2">{Math.round(zoom * 100)}%</span>
          <button type="button" className="icon-btn" onClick={() => step(0.25)} aria-label="Zoom in">
            <Plus className="size-5" aria-hidden="true" />
          </button>
          <button type="button" className="icon-btn" onClick={() => dialog.current.close()} aria-label="Close diagram" autoFocus>
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>
        <div className="diagram-viewer min-h-0 flex-1 overflow-auto bg-surface-2 p-4">
          {/* Mermaid's own output in strict mode (it sanitises labels); not user HTML. */}
          <div style={{ width: width * zoom }} dangerouslySetInnerHTML={{ __html: svg }} />
        </div>
      </div>
    </dialog>
  )
}

export default function MermaidDiagram({ code }) {
  const { theme } = usePrefs()
  const phone = usePhone()
  const id = `mermaid-${useId().replace(/[^a-zA-Z0-9]/g, '')}`
  const [drawn, setDrawn] = useState(null) // { svg, width }
  const [failed, setFailed] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const figure = useRef(null)
  const [boxWidth, setBoxWidth] = useState(0)

  // The space the diagram has (inside the figure's padding), kept up to date on resize and rotation.
  useEffect(() => {
    const el = figure.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => setBoxWidth(entry.contentRect.width))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

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
        let best = null
        for (const [i, version] of versionsFor(code, phone).entries()) {
          const drawnVersion = naturalSize((await mermaid.render(`${id}v${i}`, version)).svg)
          if (!best || drawnVersion.width < best.width) best = drawnVersion
        }
        if (!cancelled) setDrawn(best)
      })
      .catch(() => !cancelled && setFailed(true))
    return () => {
      cancelled = true
    }
  }, [code, id, theme, phone])

  if (failed) return <CodeBlock code={code} language="mermaid" />
  const tooWide = drawn && boxWidth > 0 && drawn.width > boxWidth
  const fits = tooWide && boxWidth / drawn.width >= MIN_SCALE // only a little too wide: shrink to fit
  return (
    <figure ref={figure} className="diagram" role="img" aria-label="Diagram">
      {drawn ? (
        <>
          {/* Mermaid's own output in strict mode (it sanitises labels); not user HTML. */}
          <div className={`diagram-svg ${fits ? 'fit' : ''}`} dangerouslySetInnerHTML={{ __html: drawn.svg }} />
          {tooWide && !fits && (
            <button type="button" className="diagram-expand" onClick={() => setExpanded(true)}>
              <Maximize2 className="size-4" aria-hidden="true" /> Expand
            </button>
          )}
          {expanded && <DiagramViewer svg={drawn.svg} width={drawn.width} onClose={() => setExpanded(false)} />}
        </>
      ) : (
        <div className="diagram-loading">Drawing diagram…</div>
      )}
    </figure>
  )
}
