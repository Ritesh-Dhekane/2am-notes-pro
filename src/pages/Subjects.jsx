import { LayoutGrid } from 'lucide-react'
import { Link } from 'react-router-dom'
import LibraryGate from '../components/LibraryGate.jsx'
import SubjectCard from '../components/SubjectCard.jsx'
import { EmptyState } from '../components/ui.jsx'
import { useStudy } from '../lib/study.js'

export default function Subjects() {
  const { semesterInfo: semester } = useStudy()
  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="font-mono text-caption text-teal-ink">MCA {semester?.label}</p>
        <h1 className="mt-1 text-display">Subjects</h1>
        <p className="mt-1 text-body text-ink-2">
          Your core subjects and electives.{' '}
          <Link to="/profile#study" className="font-medium text-primary-ink underline-offset-2 hover:underline">
            Change semester or electives
          </Link>
        </p>
      </div>
      <LibraryGate>
        {(library) =>
          library.subjects.length === 0 ? (
            <EmptyState icon={LayoutGrid} title="No subjects yet" text="Subjects appear here once their folders are added to Drive." />
          ) : (
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
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
