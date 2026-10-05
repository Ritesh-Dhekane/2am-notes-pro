// Shows a loaded file the right way for its type: note (Markdown), PDF, plain text, or a download.

import { Download, ExternalLink, FileWarning } from 'lucide-react'
import { useMemo } from 'react'
import MarkdownArticle from './MarkdownArticle.jsx'
import { EmptyState } from './ui.jsx'

function base64ToBlob(base64, type) {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new Blob([bytes], { type })
}

// blob: URLs for base64 content, kept for the most recent few files and revoked as they drop out,
// so going back and forth between files doesn't rebuild them.
const urlCache = new Map()
const URL_CACHE_SIZE = 4

function blobUrl(content, type) {
  if (!content) return null
  if (urlCache.has(content)) return urlCache.get(content)
  const url = URL.createObjectURL(base64ToBlob(content, type))
  urlCache.set(content, url)
  if (urlCache.size > URL_CACHE_SIZE) {
    const [oldest, oldUrl] = urlCache.entries().next().value
    urlCache.delete(oldest)
    URL.revokeObjectURL(oldUrl)
  }
  return url
}

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
  if (data.encoding === 'utf8') {
    return (
      <pre className="whitespace-pre-wrap rounded-xl border border-line bg-code p-4 font-mono text-[14px] leading-6 text-ink">
        {data.content}
      </pre>
    )
  }
  return <DownloadOnly data={data} />
}
