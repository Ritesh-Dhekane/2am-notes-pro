import { formatSize, kindLabel } from '../lib/files.js'
import { BookmarkButton, FileTypeIcon } from './FileBits.jsx'

// One file in a list. `onOpen` decides what opening means (preview pane on desktop, reader on phones).
export default function FileRow({ file, active, onOpen, showUnit = false }) {
  const meta = [
    showUnit && file.unit ? `Unit ${file.unit}` : null,
    kindLabel(file.kind),
    formatSize(file.size),
  ].filter(Boolean)
  return (
    <li className="relative">
      <button
        type="button"
        onClick={() => onOpen(file)}
        aria-current={active ? 'true' : undefined}
        className={`flex w-full items-center gap-3 rounded-xl border py-2.5 pr-14 pl-3 text-left transition-colors ${
          active ? 'border-line-strong bg-surface-2' : 'border-transparent hover:bg-surface-2'
        }`}
      >
        <FileTypeIcon kind={file.kind} />
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            {file.isNew && (
              <span className="shrink-0 rounded bg-primary-soft px-1.5 font-mono text-[10px] font-semibold text-primary-ink">NEW</span>
            )}
            <span className="truncate text-body font-medium text-ink">{file.title}</span>
          </span>
          <span className="block truncate font-mono text-caption text-ink-3">{meta.join(' · ')}</span>
        </span>
      </button>
      <span className="absolute top-1/2 right-1 -translate-y-1/2">
        <BookmarkButton file={file} />
      </span>
    </li>
  )
}
