// PYQ Archive: every previous-year paper and solution across subjects, newest exam first.

import { FileQuestion } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import Chips from '../components/Chips.jsx'
import FileRow from '../components/FileRow.jsx'
import LibraryGate from '../components/LibraryGate.jsx'
import PaneLayout from '../components/PaneLayout.jsx'
import { Card, EmptyState } from '../components/ui.jsx'
import { byExamDesc, pyqDate } from '../lib/files.js'
import { useFilePane } from '../lib/useFilePane.js'

function byYear(files) {
  const groups = new Map()
  for (const file of files) {
    const year = pyqDate(file).year ?? 'other'
    if (!groups.has(year)) groups.set(year, [])
    groups.get(year).push(file)
  }
  return [...groups.entries()]
}

function PyqsBody({ library }) {
  const [params, setParams] = useSearchParams()
  const { active, activeId, open } = useFilePane(library)
  const subjectFilter = library.bySlug.has(params.get('subject')) ? params.get('subject') : 'all'

  const all = library.subjects.flatMap((s) => s.files.pyqs).sort(byExamDesc)
  const shown = all.filter((f) => subjectFilter === 'all' || f.subject === subjectFilter)
  const groups = byYear(shown)
  const options = [
    { key: 'all', label: 'All subjects', count: all.length },
    ...library.subjects.filter((s) => s.files.pyqs.length).map((s) => ({ key: s.slug, label: s.look.short, count: s.files.pyqs.length })),
  ]

  function setSubject(key) {
    const next = new URLSearchParams(params)
    if (key === 'all') next.delete('subject')
    else next.set('subject', key)
    next.delete('file')
    setParams(next, { replace: true })
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="font-mono text-caption text-teal-ink">Previous-year papers</p>
        <h1 className="mt-1 text-display">PYQ Archive</h1>
        <p className="mt-1 text-body text-ink-2">End-semester papers and solutions for every subject, newest exam first.</p>
      </div>

      {all.length === 0 ? (
        <EmptyState icon={FileQuestion} title="No papers yet" text="Papers appear here once they're added to a subject's pyqs folder in Drive." />
      ) : (
        <>
          {options.length > 2 && <Chips label="Subject" options={options} value={subjectFilter} onChange={setSubject} mono />}
          <PaneLayout library={library} active={active}>
            {groups.map(([year, files]) => (
              <section key={year} aria-labelledby={`year-${year}`}>
                <h2 id={`year-${year}`} className="mb-2 flex items-baseline gap-2 px-1">
                  <span className="text-heading">{year === 'other' ? 'Other papers' : year}</span>
                  <span className="font-mono text-caption text-ink-3">
                    {files.length} {files.length === 1 ? 'paper' : 'papers'}
                  </span>
                </h2>
                <Card as="ul" className="flex flex-col gap-1 p-2">
                  {files.map((file) => (
                    <FileRow
                      key={file.id}
                      file={file}
                      prefix={library.bySlug.get(file.subject)?.look.short}
                      showUnit
                      active={file.id === activeId}
                      onOpen={open}
                    />
                  ))}
                </Card>
              </section>
            ))}
          </PaneLayout>
        </>
      )}
    </div>
  )
}

export default function Pyqs() {
  return <LibraryGate>{(library) => <PyqsBody library={library} />}</LibraryGate>
}
