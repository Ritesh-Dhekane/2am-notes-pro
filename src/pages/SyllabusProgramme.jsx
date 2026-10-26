// One programme's SPPU syllabi (/syllabus/p/:slug), newest first. Pre-rendered at build like the others.

import { ArrowLeft, FileWarning } from 'lucide-react'
import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CourseNotesLink, EntryRow, ShareButton, SourceCredit, SyllabusFrame } from '../components/SyllabusBits.jsx'
import { EmptyState, Skeleton } from '../components/ui.jsx'
import { byNewest, programmeOf, programmeSlug, programmeTitle } from '../lib/syllabus.js'
import { useDocumentTitle, useSyllabi } from '../lib/useSyllabi.js'

export default function SyllabusProgramme() {
  const { slug } = useParams()
  const { entries, error } = useSyllabi()
  const list = useMemo(() => (entries || []).filter((e) => programmeSlug(e) === slug).sort(byNewest), [entries, slug])
  const name = list[0] && programmeOf(list[0])
  useDocumentTitle(name && programmeTitle(name, list))

  if (entries && !list.length) {
    return (
      <SyllabusFrame>
        <EmptyState
          icon={FileWarning}
          title="Programme not found"
          action={<Link to="/syllabus" className="btn-primary">Browse all syllabi</Link>}
        />
      </SyllabusFrame>
    )
  }

  return (
    <SyllabusFrame>
      <Link to="/syllabus" className="mb-3 inline-flex items-center gap-1.5 text-label font-semibold text-ink-2 hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden="true" /> All syllabi
      </Link>
      {!name ? (
        error ? <p className="text-body text-ink-2">{error}</p> : <Skeleton className="h-40 w-full" />
      ) : (
        <>
          <p className="font-mono text-caption text-ink-3">{list[0].faculty}</p>
          <h1 className="mt-1 text-[26px] leading-8 font-bold tracking-tight text-ink">SPPU {name} syllabus</h1>
          <p className="mt-1 text-label text-ink-2">
            {list.length} official syllabus PDF{list.length === 1 ? '' : 's'}, newest first. Read any of them here.
          </p>
          <SourceCredit library={list[0].library} className="mt-2" />
          <div className="mt-4">
            <ShareButton title={`SPPU ${name} syllabus`} />
          </div>
          <ul className="mt-5 rounded-2xl border border-line bg-surface p-1">
            {list.map((e, i) => <EntryRow key={e.id} entry={e} latest={i === 0} />)}
          </ul>
          <div className="mt-6">
            <CourseNotesLink programme={name} />
          </div>
        </>
      )}
    </SyllabusFrame>
  )
}
