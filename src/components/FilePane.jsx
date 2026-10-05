// Desktop preview pane on the subject page: the chosen file's details and a way into the reader.

import { BookOpen, MousePointerClick } from 'lucide-react'
import { Link } from 'react-router-dom'
import { fileHref, formatSize, kindLabel } from '../lib/files.js'
import { BookmarkButton, FileTypeIcon } from './FileBits.jsx'
import { Card, Tag } from './ui.jsx'

export default function FilePane({ file, subject }) {
  if (!file) {
    return (
      <Card className="flex flex-col items-center gap-3 px-6 py-16 text-center">
        <MousePointerClick className="size-8 text-ink-3" aria-hidden="true" />
        <p className="text-heading">Pick a file</p>
        <p className="max-w-xs text-body text-ink-2">Choose a note, paper or reference on the left to see it here.</p>
      </Card>
    )
  }
  const meta = [file.unit ? `Unit ${file.unit}` : null, kindLabel(file.kind), formatSize(file.size)].filter(Boolean)
  return (
    <Card className="flex flex-col gap-4 p-5">
      <div className="flex items-start gap-3">
        <FileTypeIcon kind={file.kind} className="size-11" />
        <div className="min-w-0 flex-1">
          <Tag look={subject.look}>{meta.join(' · ')}</Tag>
          <h2 className="mt-1.5 text-title">{file.title}</h2>
        </div>
        <BookmarkButton file={file} />
      </div>
      <Link to={fileHref(file)} className="btn-primary self-start">
        <BookOpen className="size-4" aria-hidden="true" /> Open in reader
      </Link>
    </Card>
  )
}
