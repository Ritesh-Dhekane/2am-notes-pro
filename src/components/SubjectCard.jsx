import { Link } from 'react-router-dom'
import { trackEvent } from '../lib/analytics.js'
import { tintStyle } from '../lib/subjects.js'
import { SubjectIcon } from './ui.jsx'

function Count({ value, label, accent }) {
  return (
    <span className="flex flex-col">
      <span className={`font-mono text-heading ${accent ? 'text-teal-ink' : 'text-ink'}`}>{value}</span>
      <span className="text-caption text-ink-3">{label}</span>
    </span>
  )
}

export default function SubjectCard({ subject }) {
  const { look, files } = subject
  const newCount = [...files.notes, ...files.pyqs, ...files.references].filter((f) => f.isNew).length
  return (
    <Link
      to={`/subject/${subject.slug}`}
      onClick={() => trackEvent('subject_click', { subject: subject.slug })}
      className="tint group flex h-full flex-col gap-4 rounded-2xl border border-line bg-surface p-5 transition-colors hover:border-line-strong"
      style={tintStyle(look)}
    >
      <span className="flex items-start gap-3">
        <SubjectIcon look={look} />
        <span className="min-w-0 flex-1">
          <span className="block text-heading group-hover:text-primary-ink">{subject.name}</span>
          <span className="mt-0.5 block font-mono text-caption text-ink-3">
            {subject.unitCount > 0 ? `${subject.unitCount} ${subject.unitCount === 1 ? 'unit' : 'units'}` : 'No units yet'}
          </span>
        </span>
        {newCount > 0 && (
          <span className="tint-soft tint-text rounded-full px-2 py-0.5 text-caption font-semibold">{newCount} new</span>
        )}
      </span>
      <span className="line-clamp-2 text-label leading-5 text-ink-2">{look.about}</span>
      <span className="mt-auto grid grid-cols-3 gap-2 border-t border-line pt-4">
        <Count value={files.notes.length} label="Notes" />
        <Count value={files.pyqs.length} label="PYQs" accent />
        <Count value={files.references.length} label="References" />
      </span>
    </Link>
  )
}
