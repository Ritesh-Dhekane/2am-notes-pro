// /admin/announcements: short notices shown as a dismissible banner in the app, for everyone, one course
// or one semester (apps-script/Announcements.js). Plain text, up to 280 characters. Deactivating keeps
// an announcement here to post again later.

import { Megaphone, Pencil } from 'lucide-react'
import { useState } from 'react'
import { EmptyState, ErrorState, Skeleton } from '../../components/ui.jsx'
import { audienceLabel } from '../../lib/announcements.js'
import { COURSES, SEMESTERS } from '../../lib/catalog.js'
import { useAdmin, useAdminAction } from './adminData.js'
import { Panel } from './bits.jsx'

const MAX = 280
const SELECT = 'h-11 min-w-0 rounded-xl border border-line bg-surface px-3 text-body text-ink'
const EMPTY = { id: '', text: '', audience: 'all' }

function when(iso) {
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? '–' : date.toLocaleString([], { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })
}

function Editor({ draft, setDraft, onSave, action }) {
  const length = draft.text.trim().length
  return (
    <Panel title={draft.id ? 'Edit announcement' : 'New announcement'}>
      <form
        className="flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault()
          onSave({ ...draft, text: draft.text.trim(), active: true })
        }}
      >
        <label className="flex flex-col gap-1 text-label text-ink-2">
          Text
          <textarea
            required
            rows={3}
            maxLength={MAX}
            value={draft.text}
            onChange={(e) => setDraft({ ...draft, text: e.target.value })}
            placeholder="Unit 3 notes for Java are up. Exams start 10 Nov: good luck!"
            className="min-w-0 rounded-xl border border-line bg-surface px-3 py-2 text-body text-ink outline-none placeholder:text-ink-3 focus:border-primary-ink"
          />
        </label>
        <p className={`-mt-2 text-right font-mono text-caption ${length > MAX ? 'text-danger' : 'text-ink-3'}`}>
          {length} / {MAX}
        </p>
        <label className="flex flex-col gap-1 text-label text-ink-2">
          Who sees it
          <select className={SELECT} value={draft.audience} onChange={(e) => setDraft({ ...draft, audience: e.target.value })}>
            <option value="all">Everyone, also signed out</option>
            {COURSES.map((c) => (
              <option key={c.id} value={`course:${c.id}`}>
                All {c.name} students
              </option>
            ))}
            {SEMESTERS.map((s) => (
              <option key={s.id} value={`semester:${s.id}`}>
                {s.course} {s.label}
              </option>
            ))}
          </select>
        </label>
        {action.error && (
          <p role="alert" className="text-label text-danger">
            {action.error}
          </p>
        )}
        <span className="flex flex-wrap gap-2">
          <button type="submit" className="btn-primary" disabled={action.busy || !length || length > MAX}>
            <Megaphone className="size-4" aria-hidden="true" /> {action.busy ? 'Saving…' : draft.id ? 'Save' : 'Post'}
          </button>
          {draft.id && (
            <button type="button" className="btn-secondary" onClick={() => setDraft(EMPTY)}>
              Cancel
            </button>
          )}
        </span>
      </form>
    </Panel>
  )
}

export default function Announcements() {
  const { data, error, reload } = useAdmin('adminAnnouncements')
  const [run, action] = useAdminAction()
  const [draft, setDraft] = useState(EMPTY)

  async function save(item) {
    if (await run('adminAnnouncementSet', item)) {
      setDraft(EMPTY)
      reload()
    }
  }

  const list = data?.announcements
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-display">Announcements</h1>
        <p className="mt-1 text-body text-ink-2">Shown as a banner at the top of the app until a student dismisses it.</p>
      </div>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start">
        <Editor draft={draft} setDraft={setDraft} onSave={save} action={action} />
        {error && !list ? (
          <ErrorState message={error} onRetry={reload} />
        ) : !list ? (
          <Skeleton className="h-48" />
        ) : !list.length ? (
          <EmptyState icon={Megaphone} title="No announcements yet" text="Write one to show it to students." />
        ) : (
          <Panel title={`All announcements (${list.length})`}>
            <ul className="-my-3 flex flex-col divide-y divide-line">
              {list.map((a) => (
                <li key={a.id} className="flex min-w-0 flex-col gap-2 py-3 sm:flex-row sm:items-start sm:gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2 text-caption">
                      <span
                        className={`rounded-full border px-2 py-px font-medium ${a.active ? 'border-primary text-primary-ink' : 'border-line text-ink-3'}`}
                      >
                        {a.active ? 'Active' : 'Inactive'}
                      </span>
                      <span className="text-ink-2">{audienceLabel(a.audience)}</span>
                      <span className="text-ink-3">· {when(a.createdAt)}</span>
                    </p>
                    <p className={`mt-1 text-label break-words ${a.active ? 'text-ink' : 'text-ink-3'}`}>{a.text}</p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <button type="button" className="btn-secondary" disabled={action.busy} onClick={() => setDraft({ id: a.id, text: a.text, audience: a.audience })}>
                      <Pencil className="size-4" aria-hidden="true" /> Edit
                    </button>
                    <button type="button" className="btn-secondary" disabled={action.busy} onClick={() => save({ ...a, active: !a.active })}>
                      {a.active ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </Panel>
        )}
      </div>
    </div>
  )
}
