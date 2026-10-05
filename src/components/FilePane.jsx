// Desktop preview pane on the subject page: the chosen file, readable right there, with a way
// into the full reader.

import { BookOpen, MousePointerClick } from 'lucide-react'
import { Link } from 'react-router-dom'
import { fileHref, formatSize, kindLabel } from '../lib/files.js'
import { readingStyleFrom, usePrefs } from '../lib/prefs.js'
import { useFile } from '../lib/useFile.js'
import { BookmarkButton, FileTypeIcon } from './FileBits.jsx'
import FileContent from './FileContent.jsx'
import { Card, ErrorState, Skeleton, Tag } from './ui.jsx'

export default function FilePane({ file, subject }) {
  const prefs = usePrefs()
  const { data, error, loading, retry } = useFile(file)

  if (!file) {
    return (
      <Card className="flex flex-col items-center gap-3 px-6 py-16 text-center">
        <MousePointerClick className="size-8 text-ink-3" aria-hidden="true" />
        <p className="text-heading">Pick a file</p>
        <p className="max-w-xs text-body text-ink-2">Choose a note, paper or reference on the left to read it here.</p>
      </Card>
    )
  }
  const meta = [file.unit ? `Unit ${file.unit}` : null, kindLabel(file.kind), formatSize(file.size)].filter(Boolean)
  return (
    <Card className="flex flex-col gap-5 p-5">
      <div className="flex items-start gap-3">
        <FileTypeIcon kind={file.kind} className="size-11" />
        <div className="min-w-0 flex-1">
          <Tag look={subject.look}>{meta.join(' · ')}</Tag>
          <h2 className="mt-1.5 text-title">{data?.noteTitle || file.title}</h2>
        </div>
        <BookmarkButton file={file} />
        <Link to={fileHref(file)} className="btn-primary shrink-0">
          <BookOpen className="size-4" aria-hidden="true" /> Open reader
        </Link>
      </div>
      <div className="max-h-[calc(100vh-14rem)] overflow-y-auto border-t border-line pt-5 pr-1" tabIndex={0} aria-label={`Preview of ${file.title}`}>
        {error && <ErrorState message={error} onRetry={retry} />}
        {loading && (
          <div className="flex flex-col gap-3" aria-label="Loading">
            {[100, 90, 95, 70].map((w, i) => (
              <Skeleton key={i} className="h-4" style={{ width: `${w}%` }} />
            ))}
          </div>
        )}
        {data && <FileContent file={file} data={data} readingStyle={readingStyleFrom(prefs)} measure={false} compact />}
      </div>
    </Card>
  )
}
