// Saved: bookmarked files grouped by subject, most recently saved first. Bookmarks are kept in
// this browser only.

import { Bookmark } from 'lucide-react'
import { Link } from 'react-router-dom'
import FileRow from '../components/FileRow.jsx'
import LibraryGate from '../components/LibraryGate.jsx'
import PaneLayout from '../components/PaneLayout.jsx'
import { Card, EmptyState, SubjectIcon } from '../components/ui.jsx'
import { categoryLabel } from '../lib/files.js'
import { removeBookmarks, useBookmarks } from '../lib/store.js'
import { useFilePane } from '../lib/useFilePane.js'

function SavedBody({ library }) {
  const bookmarks = useBookmarks()
  const { active, activeId, open } = useFilePane(library)

  const entries = Object.values(bookmarks).sort((a, b) => b.savedAt.localeCompare(a.savedAt))
  // Gone from Drive = its subject is here but the file isn't. Bookmarks from another semester or an
  // elective you don't take are just not shown.
  const missing = entries.filter((b) => library.bySlug.has(b.subject) && !library.byId.has(b.fileId)).map((b) => b.fileId)
  const groups = library.subjects
    .map((subject) => ({
      subject,
      files: entries.filter((b) => b.subject === subject.slug && library.byId.has(b.fileId)).map((b) => library.byId.get(b.fileId)),
    }))
    .filter((g) => g.files.length)
  const count = groups.reduce((n, g) => n + g.files.length, 0)

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-display">Saved</h1>
        <p className="mt-1 text-body text-ink-2">
          {count ? `${count} ${count === 1 ? 'file' : 'files'} bookmarked on this device.` : 'Bookmarks you add are kept on this device.'}
        </p>
      </div>

      {missing.length > 0 && (
        <Card className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
          <p className="text-label text-ink-2">
            {missing.length} saved {missing.length === 1 ? 'file is' : 'files are'} no longer in the library.
          </p>
          <button type="button" className="btn-secondary" onClick={() => removeBookmarks(missing)}>
            Remove
          </button>
        </Card>
      )}

      {count === 0 ? (
        <EmptyState
          icon={Bookmark}
          title="Nothing saved yet"
          text="Tap the bookmark on any note or paper to keep it here for quick revision."
          action={
            <Link to="/subjects" className="btn-primary">
              Browse subjects
            </Link>
          }
        />
      ) : (
        <PaneLayout library={library} active={active}>
          {groups.map(({ subject, files }) => (
            <section key={subject.slug} aria-labelledby={`saved-${subject.slug}`}>
              <h2 id={`saved-${subject.slug}`} className="mb-2 flex items-center gap-2.5 px-1">
                <SubjectIcon look={subject.look} size="sm" />
                <span className="min-w-0 flex-1 truncate text-heading">{subject.name}</span>
                <span className="font-mono text-caption text-ink-3">{files.length}</span>
              </h2>
              <Card as="ul" className="flex flex-col gap-1 p-2">
                {files.map((file) => (
                  <FileRow
                    key={file.id}
                    file={file}
                    showUnit
                    prefix={file.category === 'notes' ? null : categoryLabel(file.category)}
                    active={file.id === activeId}
                    onOpen={open}
                  />
                ))}
              </Card>
            </section>
          ))}
        </PaneLayout>
      )}
    </div>
  )
}

export default function Saved() {
  return <LibraryGate>{(library) => <SavedBody library={library} />}</LibraryGate>
}
