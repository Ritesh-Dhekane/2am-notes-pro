// Choose a semester and its electives. Used by first-time setup and by Settings; the caller keeps
// the draft ({ semester, electives }) and decides when to save it.

import { Check } from 'lucide-react'
import { SEMESTERS, semesterById } from '../lib/catalog.js'
import { subjectLook } from '../lib/subjects.js'
import { SubjectIcon } from './ui.jsx'

function OptionCard({ type, name, checked, onChange, title, detail, look }) {
  return (
    <label
      className={`relative flex cursor-pointer items-center gap-3 rounded-xl border p-3 pr-10 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary-ink ${
        checked ? 'border-primary bg-primary-soft/40 ring-1 ring-primary' : 'border-line bg-surface hover:border-line-strong'
      }`}
    >
      <input type={type} name={name} checked={checked} onChange={onChange} className="sr-only" />
      {look && <SubjectIcon look={look} size="sm" />}
      <span className="min-w-0 flex-1">
        <span className="block text-body font-semibold text-ink">{title}</span>
        {detail && <span className="block truncate font-mono text-caption text-ink-3">{detail}</span>}
      </span>
      <span
        className={`absolute top-1/2 right-3 grid size-5 -translate-y-1/2 place-items-center border ${type === 'radio' ? 'rounded-full' : 'rounded-md'} ${
          checked ? 'border-primary bg-primary text-on-primary' : 'border-line-strong'
        }`}
        aria-hidden="true"
      >
        {checked && <Check className="size-3.5" />}
      </span>
    </label>
  )
}

export default function StudyPicker({ value, onChange }) {
  const semester = semesterById(value.semester)

  function pickSemester(id) {
    if (id !== value.semester) onChange({ semester: id, electives: {} })
  }

  function pick(group, slug) {
    const current = value.electives[group.id]
    let next
    if (group.pick === 'one') next = slug
    else {
      const list = Array.isArray(current) ? current : []
      next = list.includes(slug) ? list.filter((s) => s !== slug) : [...list, slug]
    }
    onChange({ ...value, electives: { ...value.electives, [group.id]: next } })
  }

  return (
    <div className="flex flex-col gap-6">
      <fieldset>
        <legend className="mb-3 text-heading">Your semester</legend>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {SEMESTERS.map((s) => (
            <OptionCard
              key={s.id}
              type="radio"
              name="semester"
              checked={value.semester === s.id}
              onChange={() => pickSemester(s.id)}
              title={`MCA ${s.label}`}
              detail={`${s.core.length} core subjects · ${s.groups.map((g) => g.label).join(', ')}`}
            />
          ))}
        </div>
      </fieldset>

      {semester && (
        <>
          <div>
            <h3 className="mb-2 text-heading">Core subjects</h3>
            <p className="mb-3 text-label text-ink-2">Everyone in {semester.label} studies these.</p>
            <ul className="flex flex-wrap gap-2">
              {semester.core.map((slug) => {
                const look = subjectLook(slug, slug)
                return (
                  <li key={slug} className="flex items-center gap-2 rounded-full border border-line bg-surface py-1 pr-3 pl-1">
                    <SubjectIcon look={look} size="sm" />
                    <span className="text-label font-medium text-ink">{look.name}</span>
                  </li>
                )
              })}
            </ul>
          </div>

          {semester.groups.map((group) => {
            const selected = value.electives[group.id]
            return (
              <fieldset key={group.id}>
                <legend className="text-heading">{group.label}</legend>
                <p className="mt-1 mb-3 text-label text-ink-2">{group.hint || 'Pick the one you study.'}</p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {group.options.map((slug) => {
                    const look = subjectLook(slug, slug)
                    const checked = group.pick === 'one' ? selected === slug : Array.isArray(selected) && selected.includes(slug)
                    return (
                      <OptionCard
                        key={slug}
                        type={group.pick === 'one' ? 'radio' : 'checkbox'}
                        name={group.id}
                        checked={checked}
                        onChange={() => pick(group, slug)}
                        title={look.name}
                        detail={look.code}
                        look={look}
                      />
                    )
                  })}
                </div>
              </fieldset>
            )
          })}
        </>
      )}
    </div>
  )
}
