// Small pieces every file list uses: type icon, bookmark toggle and a file's link.

import { Bookmark, BookmarkCheck, File, FileCode2, FileText, NotebookText } from 'lucide-react'
import { createElement } from 'react'
import { toggleBookmark, useBookmarks } from '../lib/store.js'

const KIND = {
  note: { icon: NotebookText, className: 'bg-primary-soft text-primary-ink' },
  pdf: { icon: FileText, className: 'bg-[color-mix(in_oklab,#f43f5e_14%,transparent)] text-danger' },
  text: { icon: FileCode2, className: 'bg-[color-mix(in_oklab,#14b8a6_14%,transparent)] text-teal-ink' },
  other: { icon: File, className: 'bg-surface-2 text-ink-2' },
}

export function FileTypeIcon({ kind, className = 'size-9' }) {
  const k = KIND[kind] || KIND.other
  return (
    <span className={`grid shrink-0 place-items-center rounded-lg ${k.className} ${className}`} aria-hidden="true">
      {createElement(k.icon, { className: 'size-[18px]' })}
    </span>
  )
}

export function BookmarkButton({ file, className = '' }) {
  const bookmarks = useBookmarks()
  const saved = Boolean(bookmarks[file.id])
  const label = saved ? `Remove ${file.title} from Saved` : `Save ${file.title}`
  return (
    <button
      type="button"
      className={`icon-btn ${saved ? 'text-teal-ink' : ''} ${className}`}
      aria-pressed={saved}
      aria-label={label}
      title={saved ? 'Saved' : 'Save'}
      onClick={(event) => {
        event.preventDefault()
        event.stopPropagation()
        toggleBookmark(file)
      }}
    >
      {saved ? <BookmarkCheck className="size-5" aria-hidden="true" /> : <Bookmark className="size-5" aria-hidden="true" />}
    </button>
  )
}
