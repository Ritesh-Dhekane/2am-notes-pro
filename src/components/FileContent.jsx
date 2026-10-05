// Shows a loaded file the right way for its type: note (Markdown), PDF, plain text, a card that
// opens the document viewer (images, Word, spreadsheets, slides), or a download.

import { Download, ExternalLink, Eye, FileWarning } from 'lucide-react'
import { lazy, Suspense, useMemo, useState } from 'react'
import { blobUrl } from '../lib/blobs.js'
import { formatSize, kindLabel, VIEWER_KINDS } from '../lib/files.js'
import { FileTypeIcon } from './FileBits.jsx'
import MarkdownArticle from './MarkdownArticle.jsx'
import { Card, EmptyState } from './ui.jsx'

const DocumentViewer = lazy(() => import('./DocumentViewer.jsx'))

function useBlobUrl(content, type) {
  return useMemo(() => blobUrl(content, type), [content, type])
}

function PdfView({ data, title, compact }) {
  const url = useBlobUrl(data.content, 'application/pdf')
  if (!url) return null
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <a href={url} target="_blank" rel="noopener noreferrer" className="btn-primary">
          <ExternalLink className="size-4" aria-hidden="true" /> Open PDF
        </a>
        <a href={url} download={data.name} className="btn-secondary">
          <Download className="size-4" aria-hidden="true" /> Download
        </a>
      </div>
      {/* Phone browsers mostly can't show PDFs inline, so the viewer is for larger screens. */}
      <iframe
        title={title}
        src={url}
        className={`hidden w-full rounded-xl border border-line bg-white md:block ${compact ? 'h-[60vh]' : 'h-[78vh]'}`}
      />
      <p className="text-label text-ink-2 md:hidden">Tap “Open PDF” to read it in your phone's PDF viewer.</p>
    </div>
  )
}

const VIEW_HINT = {
  image: 'Opens full screen, with zoom.',
  word: 'Opens the document page by page.',
  sheet: 'Opens every sheet as a table.',
  slides: 'Opens all slides in order.',
}

// Images get a preview right here; every viewer kind opens full screen on demand.
function ViewerCard({ file, data, compact }) {
  const [open, setOpen] = useState(false)
  const url = useBlobUrl(data.content, data.mimeType || 'application/octet-stream')
  const isImage = file.kind === 'image'
  return (
    <>
      {isImage ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="group block w-full overflow-hidden rounded-xl border border-line bg-surface-2"
          aria-label={`View ${file.title} full screen`}
        >
          <img src={url} alt="" className={`mx-auto w-auto object-contain ${compact ? 'max-h-[50vh]' : 'max-h-[70vh]'}`} />
        </button>
      ) : (
        <Card className="flex flex-col items-center gap-3 px-6 py-10 text-center">
          <FileTypeIcon kind={file.kind} className="size-14" />
          <p className="text-heading">{kindLabel(file.kind)} file</p>
          <p className="font-mono text-caption text-ink-3">
            {[data.name, formatSize(file.size)].filter(Boolean).join(' · ')}
          </p>
          <p className="max-w-xs text-label text-ink-2">{VIEW_HINT[file.kind]}</p>
        </Card>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" className="btn-primary" onClick={() => setOpen(true)}>
          <Eye className="size-4" aria-hidden="true" /> {isImage ? 'View full screen' : 'View document'}
        </button>
        <a href={url} download={data.name} className="btn-secondary">
          <Download className="size-4" aria-hidden="true" /> Download
        </a>
      </div>
      {open && (
        <Suspense fallback={null}>
          <DocumentViewer file={file} data={data} onClose={() => setOpen(false)} />
        </Suspense>
      )}
    </>
  )
}

function DownloadOnly({ data }) {
  const url = useBlobUrl(data.encoding === 'base64' ? data.content : null, data.mimeType)
  return (
    <EmptyState
      icon={FileWarning}
      title="This file type can't be previewed"
      text={`It's a ${data.mimeType || 'file'}. You can download it instead.`}
      action={
        url && (
          <a href={url} download={data.name} className="btn-primary">
            <Download className="size-4" aria-hidden="true" /> Download
          </a>
        )
      }
    />
  )
}

export default function FileContent({ file, data, readingStyle, measure, compact }) {
  if (file.kind === 'note' && data.encoding === 'utf8') {
    return <MarkdownArticle markdown={data.body ?? data.content} style={readingStyle} measure={measure} />
  }
  if (file.kind === 'pdf' && data.encoding === 'base64') return <PdfView data={data} title={file.title} compact={compact} />
  if (VIEWER_KINDS.has(file.kind) && data.encoding === 'base64') return <ViewerCard file={file} data={data} compact={compact} />
  if (data.encoding === 'utf8') {
    return (
      <pre className="whitespace-pre-wrap rounded-xl border border-line bg-code p-4 font-mono text-[14px] leading-6 text-ink">
        {data.content}
      </pre>
    )
  }
  return <DownloadOnly data={data} />
}
