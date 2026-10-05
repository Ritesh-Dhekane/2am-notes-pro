import { LayoutGrid } from 'lucide-react'
import LibraryGate from '../components/LibraryGate.jsx'
import SubjectCard from '../components/SubjectCard.jsx'
import { EmptyState } from '../components/ui.jsx'

export default function Subjects() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="font-mono text-caption text-teal-ink">MCA Semester 3</p>
        <h1 className="mt-1 text-display">Subjects</h1>
        <p className="mt-1 text-body text-ink-2">Notes, PYQs and references, unit by unit.</p>
      </div>
      <LibraryGate>
        {(library) =>
          library.subjects.length === 0 ? (
            <EmptyState icon={LayoutGrid} title="No subjects yet" text="Subjects appear here once their folders are added to Drive." />
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {library.subjects.map((subject) => (
                <li key={subject.slug}>
                  <SubjectCard subject={subject} />
                </li>
              ))}
            </ul>
          )
        }
      </LibraryGate>
    </div>
  )
}
