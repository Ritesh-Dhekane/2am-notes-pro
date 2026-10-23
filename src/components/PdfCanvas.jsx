// View-only PDF: pdf.js draws each page on a canvas, so the browser never gets a PDF it could save or
// print from its own viewer. Pages fit the width (phones too) and render as they scroll near; − / +
// zoom in, and a zoomed page scrolls sideways inside the box. Loaded lazily (pdf.js is its own chunk).

import { Minus, Plus } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { base64ToBytes } from '../lib/blobs.js'
import { ErrorState } from './ui.jsx'

const ZOOMS = [1, 1.25, 1.5, 2, 3]
const MAX_PIXELS = 12_000_000 // stay under phone canvas limits

let pdfjsPromise
function loadPdfjs() {
  pdfjsPromise ||= Promise.all([
    import('pdfjs-dist/legacy/build/pdf.mjs'),
    import('pdfjs-dist/legacy/build/pdf.worker.min.mjs?url'),
  ]).then(([pdfjs, worker]) => {
    pdfjs.GlobalWorkerOptions.workerSrc = worker.default
    return pdfjs
  })
  return pdfjsPromise
}

function Page({ doc, number, width, ratio }) {
  const box = useRef(null)
  const canvas = useRef(null)
  const [near, setNear] = useState(number <= 2)
  const [own, setOwn] = useState(null) // this page's shape, once known

  useEffect(() => {
    if (near || !box.current) return
    const observer = new IntersectionObserver((entries) => entries.some((e) => e.isIntersecting) && setNear(true), {
      rootMargin: '800px 0px',
    })
    observer.observe(box.current)
    return () => observer.disconnect()
  }, [near])

  useEffect(() => {
    if (!near || !width) return
    let task
    let cancelled = false
    doc.getPage(number).then((page) => {
      if (cancelled || !canvas.current) return
      const base = page.getViewport({ scale: 1 })
      setOwn(base.width / base.height)
      let scale = (width / base.width) * Math.min(window.devicePixelRatio || 1, 2)
      const pixels = base.width * base.height * scale * scale
      if (pixels > MAX_PIXELS) scale *= Math.sqrt(MAX_PIXELS / pixels)
      const viewport = page.getViewport({ scale })
      const el = canvas.current
      el.width = Math.floor(viewport.width)
      el.height = Math.floor(viewport.height)
      task = page.render({ canvas: el, canvasContext: el.getContext('2d'), viewport })
      task.promise.catch(() => {})
    })
    return () => {
      cancelled = true
      task?.cancel()
    }
  }, [doc, number, near, width])

  return (
    <div ref={box} className="bg-white shadow-sm" style={{ width, aspectRatio: own || ratio }}>
      <canvas ref={canvas} className="block size-full" aria-label={`Page ${number}`} />
    </div>
  )
}

export default function PdfCanvas({ data, title, compact }) {
  const frame = useRef(null)
  const [loaded, setLoaded] = useState({}) // { content, doc, ratio, error } for the PDF last opened
  const current = loaded.content === data.content
  const doc = current ? loaded.doc : null
  const ratio = (current && loaded.ratio) || 1 / Math.SQRT2
  const error = current ? loaded.error : null
  const [fit, setFit] = useState(0)
  const [zoom, setZoom] = useState(0)

  useEffect(() => {
    const content = data.content
    let opened
    let cancelled = false
    loadPdfjs()
      .then((pdfjs) => pdfjs.getDocument({ data: base64ToBytes(content), isEvalSupported: false }).promise)
      .then(async (pdf) => {
        opened = pdf
        const first = (await pdf.getPage(1)).getViewport({ scale: 1 })
        if (!cancelled) setLoaded({ content, doc: pdf, ratio: first.width / first.height })
      })
      .catch(() => !cancelled && setLoaded({ content, error: 'This PDF could not be shown.' }))
    return () => {
      cancelled = true
      opened?.destroy()
    }
  }, [data.content])

  useEffect(() => {
    const el = frame.current
    if (!el) return
    let timer
    const measure = () => setFit(Math.max(200, el.clientWidth - 16))
    const observer = new ResizeObserver(() => {
      clearTimeout(timer)
      timer = setTimeout(measure, 120)
    })
    measure()
    observer.observe(el)
    return () => {
      clearTimeout(timer)
      observer.disconnect()
    }
  }, [])

  if (error) return <ErrorState message={error} />
  const width = Math.round(fit * ZOOMS[zoom])

  return (
    <div className="flex flex-col gap-2 print:hidden">
      <div className="flex items-center justify-between gap-2 text-label text-ink-2">
        <span>{doc ? `${doc.numPages} page${doc.numPages === 1 ? '' : 's'} · view only` : 'Loading PDF…'}</span>
        <span className="flex items-center gap-1">
          <button type="button" className="icon-btn" onClick={() => setZoom((z) => Math.max(0, z - 1))} disabled={zoom === 0} aria-label="Zoom out">
            <Minus className="size-4" aria-hidden="true" />
          </button>
          <span className="w-12 text-center font-mono text-caption">{Math.round(ZOOMS[zoom] * 100)}%</span>
          <button type="button" className="icon-btn" onClick={() => setZoom((z) => Math.min(ZOOMS.length - 1, z + 1))} disabled={zoom === ZOOMS.length - 1} aria-label="Zoom in">
            <Plus className="size-4" aria-hidden="true" />
          </button>
        </span>
      </div>
      <div
        ref={frame}
        role="document"
        aria-label={title}
        aria-busy={!doc}
        onContextMenu={(e) => e.preventDefault()}
        className={`overflow-auto overscroll-contain rounded-xl border border-line bg-surface-2 p-2 select-none ${compact ? 'h-[60vh]' : 'h-[78vh]'}`}
      >
        <div className="mx-auto flex w-max flex-col gap-2">
          {doc && fit > 0
            ? Array.from({ length: doc.numPages }, (_, i) => <Page key={i} doc={doc} number={i + 1} width={width} ratio={ratio} />)
            : <div className="animate-pulse bg-surface" style={{ width: fit || 300, aspectRatio: ratio }} />}
        </div>
      </div>
    </div>
  )
}
