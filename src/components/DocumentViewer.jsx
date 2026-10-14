// Full-screen viewer for files the browser can't show by itself: images, Word documents,
// spreadsheets and slide decks. Everything is rendered here in the browser from the file's bytes
// (the files are private, so online viewers that need a public link are out). Each format's
// library is loaded only when such a file is opened.

import { AlertTriangle, Download, Maximize2, Minimize2, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { trackEvent } from '../lib/analytics.js'
import { base64ToBytes, blobUrl } from '../lib/blobs.js'
import { formatSize, kindLabel } from '../lib/files.js'
import { FileTypeIcon } from './FileBits.jsx'
import { Skeleton } from './ui.jsx'

const MAX_ROWS = 2000
const MAX_COLS = 60

function Loading({ label }) {
  return (
    <div className="flex w-full max-w-3xl flex-col gap-3 p-6" aria-label={label}>
      <Skeleton className="h-6 w-1/2" />
      <Skeleton className="h-4" />
      <Skeleton className="h-4 w-11/12" />
      <Skeleton className="h-64" />
    </div>
  )
}

function Failed({ downloadUrl, name }) {
  return (
    <div role="alert" className="m-auto flex max-w-sm flex-col items-center gap-3 p-8 text-center">
      <AlertTriangle className="size-7 text-danger" aria-hidden="true" />
      <p className="text-body text-ink">This file couldn't be shown here. It may use features the viewer doesn't support.</p>
      <a href={downloadUrl} download={name} className="btn-primary">
        <Download className="size-4" aria-hidden="true" /> Download instead
      </a>
    </div>
  )
}

// Runs a library that renders into a DOM node. Each run gets its own child element, so a run that
// is abandoned (closing the viewer, or React's dev double-mount) can't write into the next one.
function useRenderInto(render) {
  const ref = useRef(null)
  const [state, setState] = useState('loading')
  useEffect(() => {
    const host = document.createElement('div')
    ref.current.appendChild(host)
    let cancelled = false
    let cleanup = null
    render(host).then(
      (done) => {
        if (cancelled) done?.()
        else {
          cleanup = done
          setState('ready')
        }
      },
      (error) => {
        console.warn('Document viewer:', error)
        if (!cancelled) setState('error')
      },
    )
    return () => {
      cancelled = true
      cleanup?.()
      host.remove()
    }
  }, [render])
  return [ref, state]
}

function ImageView({ url, name }) {
  const [fit, setFit] = useState(true)
  return (
    <div className="relative flex min-h-full w-full">
      <button
        type="button"
        onClick={() => setFit(!fit)}
        className="btn-secondary absolute top-3 right-3 z-10 bg-surface"
        aria-pressed={!fit}
      >
        {fit ? <Maximize2 className="size-4" aria-hidden="true" /> : <Minimize2 className="size-4" aria-hidden="true" />}
        {fit ? 'Actual size' : 'Fit to screen'}
      </button>
      <img
        src={url}
        alt={name}
        className={fit ? 'm-auto max-h-full max-w-full object-contain p-3' : 'm-auto max-w-none p-3'}
      />
    </div>
  )
}

function WordView({ bytes, downloadUrl, name }) {
  const render = useCallback(
    async (host) => {
      const { renderAsync } = await import('docx-preview')
      await renderAsync(bytes, host, host, { inWrapper: true, ignoreLastRenderedPageBreak: true, className: 'docx' })
      // Pages have a fixed width (A4 and so on); scale them down to fit narrow screens.
      const area = host.parentElement
      if (!area) return null // closed while loading
      const fit = () => {
        const page = host.querySelector('section.docx')
        if (!page || !area) return
        host.style.zoom = ''
        host.style.zoom = String(Math.min(1, (area.clientWidth - 16) / page.offsetWidth))
      }
      fit()
      const observer = new ResizeObserver(fit)
      observer.observe(area)
      return () => observer.disconnect()
    },
    [bytes],
  )
  const [ref, state] = useRenderInto(render)
  return (
    <div className="doc-view w-full self-start">
      {state === 'loading' && <Loading label="Opening document" />}
      {state === 'error' && <Failed downloadUrl={downloadUrl} name={name} />}
      <div ref={ref} className={state === 'error' ? 'hidden' : ''} />
    </div>
  )
}

function SlidesView({ bytes, downloadUrl, name }) {
  const render = useCallback(
    async (host) => {
      const { init } = await import('pptx-preview')
      const width = Math.min(1000, (host.parentElement?.clientWidth || 360) - 24)
      const viewer = init(host, { width, height: Math.round((width * 9) / 16), mode: 'list' })
      await viewer.preview(bytes.slice().buffer)
      return () => viewer.destroy?.()
    },
    [bytes],
  )
  const [ref, state] = useRenderInto(render)
  return (
    <div className="slides-view w-full self-start py-3">
      {state === 'loading' && <Loading label="Opening slides" />}
      {state === 'error' && <Failed downloadUrl={downloadUrl} name={name} />}
      <div ref={ref} className={state === 'error' ? 'hidden' : 'flex justify-center'} />
    </div>
  )
}

function SheetView({ bytes, downloadUrl, name }) {
  const [book, setBook] = useState({ status: 'loading' })
  const [active, setActive] = useState(0)

  useEffect(() => {
    let cancelled = false
    import('xlsx')
      .then((XLSX) => {
        const workbook = XLSX.read(bytes, { type: 'array', cellDates: true })
        const sheets = workbook.SheetNames.map((sheetName) => {
          const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, raw: false, defval: '' })
          const cols = Math.min(MAX_COLS, rows.reduce((n, r) => Math.max(n, r.length), 0))
          return { name: sheetName, rows, cols, letters: Array.from({ length: cols }, (_, i) => XLSX.utils.encode_col(i)) }
        })
        if (!cancelled) setBook({ status: 'ready', sheets })
      })
      .catch((error) => {
        console.warn('Spreadsheet viewer:', error)
        if (!cancelled) setBook({ status: 'error' })
      })
    return () => {
      cancelled = true
    }
  }, [bytes])

  if (book.status === 'loading') return <Loading label="Opening spreadsheet" />
  if (book.status === 'error') return <Failed downloadUrl={downloadUrl} name={name} />
  const sheet = book.sheets[active] || book.sheets[0]
  if (!sheet) return <Failed downloadUrl={downloadUrl} name={name} />
  const rows = sheet.rows.slice(0, MAX_ROWS)

  return (
    <div className="flex w-full flex-col self-stretch">
      {book.sheets.length > 1 && (
        <div role="tablist" aria-label="Sheets" className="flex shrink-0 gap-1 overflow-x-auto border-b border-line bg-surface px-3 pt-2">
          {book.sheets.map((s, i) => (
            <button
              key={s.name}
              type="button"
              role="tab"
              aria-selected={i === active}
              onClick={() => setActive(i)}
              className={`min-h-10 shrink-0 rounded-t-lg border border-b-0 px-3 text-label font-medium ${
                i === active ? 'border-line bg-surface-2 text-ink' : 'border-transparent text-ink-2 hover:text-ink'
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>
      )}
      <div className="min-h-0 flex-1 overflow-auto" tabIndex={0} aria-label={`Sheet ${sheet.name}`}>
        {rows.length === 0 ? (
          <p className="p-6 text-body text-ink-2">This sheet is empty.</p>
        ) : (
          <table className="border-separate border-spacing-0 font-mono text-[13px]">
            <thead>
              <tr>
                <th className="sticky top-0 left-0 z-20 border-r border-b border-line bg-surface">
                  <span className="sr-only">Row</span>
                </th>
                {sheet.letters.map((letter) => (
                  <th key={letter} scope="col" className="sticky top-0 z-10 min-w-24 border-r border-b border-line bg-surface px-2 py-1 font-medium text-ink-3">
                    {letter}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, r) => (
                <tr key={r}>
                  <th scope="row" className="sticky left-0 z-10 border-r border-b border-line bg-surface px-2 py-1 text-right font-medium text-ink-3">
                    {r + 1}
                  </th>
                  {sheet.letters.map((letter, c) => (
                    <td key={letter} className="max-w-80 truncate border-r border-b border-line bg-canvas px-2 py-1 text-ink" title={String(row[c] ?? '')}>
                      {row[c]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {(sheet.rows.length > MAX_ROWS || sheet.cols >= MAX_COLS) && (
          <p className="p-3 text-label text-ink-2">Showing the first {MAX_ROWS} rows and {MAX_COLS} columns. Download the file for the rest.</p>
        )}
      </div>
    </div>
  )
}

export default function DocumentViewer({ file, data, onClose }) {
  const dialogRef = useRef(null)
  const bytes = useMemo(() => base64ToBytes(data.content), [data.content])
  const downloadUrl = blobUrl(data.content, data.mimeType || 'application/octet-stream')
  const title = file.title || data.name

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog.open) {
      dialog.showModal()
      trackEvent('document_view', { kind: file.kind, subject: file.subject })
    }
    const root = document.documentElement
    const previous = root.style.overflow
    root.style.overflow = 'hidden'
    // No dialog.close() here: it would fire onClose. Unmounting removes the dialog anyway.
    return () => {
      root.style.overflow = previous
    }
  }, [file.kind, file.subject])

  const props = { bytes, downloadUrl, name: data.name }
  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="viewer-title"
      onClose={onClose}
      onClick={(event) => {
        if (event.target === dialogRef.current) dialogRef.current.close() // backdrop click
      }}
      className="m-0 h-dvh max-h-none w-screen max-w-none overflow-hidden bg-canvas p-0 text-ink backdrop:bg-scrim lg:m-auto lg:h-[90vh] lg:w-[min(1120px,92vw)] lg:rounded-2xl lg:border lg:border-line-strong"
    >
      <div className="flex h-full flex-col">
        <header className="flex shrink-0 items-center gap-3 border-b border-line bg-surface px-3 py-2 pt-[max(0.5rem,env(safe-area-inset-top))] sm:px-4">
          <FileTypeIcon kind={file.kind} />
          <div className="min-w-0 flex-1">
            <h2 id="viewer-title" className="truncate text-heading">
              {title}
            </h2>
            <p className="truncate font-mono text-caption text-ink-3">
              {[kindLabel(file.kind), formatSize(file.size)].filter(Boolean).join(' · ')}
            </p>
          </div>
          <a href={downloadUrl} download={data.name} className="icon-btn" aria-label={`Download ${title}`} title="Download">
            <Download className="size-5" aria-hidden="true" />
          </a>
          <button type="button" className="icon-btn" onClick={() => dialogRef.current.close()} aria-label="Close viewer" autoFocus>
            <X className="size-5" aria-hidden="true" />
          </button>
        </header>
        <div className="flex min-h-0 flex-1 overflow-auto bg-surface-2">
          {file.kind === 'image' && <ImageView url={blobUrl(data.content, data.mimeType || 'image/jpeg')} name={title} />}
          {file.kind === 'word' && <WordView {...props} />}
          {file.kind === 'sheet' && <SheetView {...props} />}
          {file.kind === 'slides' && <SlidesView {...props} />}
        </div>
      </div>
    </dialog>
  )
}
