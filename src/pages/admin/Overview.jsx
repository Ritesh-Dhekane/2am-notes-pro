// /admin: how many students, who is active, what they open and on which devices.

import { RefreshCw } from 'lucide-react'
import { ErrorState, Skeleton } from '../../components/ui.jsx'
import { subjectLook } from '../../lib/subjects.js'
import { semesterLabel, useAdmin } from './adminData.js'
import { Bars, Panel, StatCard } from './bits.jsx'

function SignUps({ days }) {
  const max = Math.max(...days.map((d) => d.count), 1)
  const total = days.reduce((sum, d) => sum + d.count, 0)
  return (
    <Panel title="Sign-ups, last 30 days">
      <p className="mb-2 text-label text-ink-2">{total} new students</p>
      <div className="flex h-28 items-end gap-[2px]" role="img" aria-label={`${total} sign-ups in the last 30 days`}>
        {days.map((d) => (
          <div
            key={d.day}
            className="min-w-0 flex-1 rounded-t-sm bg-primary"
            style={{ height: `${d.count ? Math.max((d.count / max) * 100, 6) : 2}%`, opacity: d.count ? 1 : 0.3 }}
            title={`${d.day}: ${d.count}`}
          />
        ))}
      </div>
      <div className="mt-1 flex justify-between font-mono text-caption text-ink-3">
        <span>{days[0]?.day.slice(5)}</span>
        <span>{days.at(-1)?.day.slice(5)}</span>
      </div>
    </Panel>
  )
}

function Courses({ courses }) {
  return (
    <Panel title="Students by course">
      {!courses.length && <p className="text-label text-ink-3">No students yet.</p>}
      <div className="flex flex-col gap-5">
        {courses.map((c) => (
          <div key={c.course} className="min-w-0">
            <p className="text-label font-semibold text-ink">
              {c.course} <span className="font-mono text-ink-2">· {c.students}</span>
            </p>
            <div className="mt-2 flex flex-col gap-3 border-l border-line pl-3">
              {c.semesters.map((s) => (
                <div key={s.semester} className="min-w-0">
                  <p className="text-label text-ink">
                    {semesterLabel(s.semester)} <span className="font-mono text-ink-2">· {s.students}</span>
                  </p>
                  {s.electives.length > 0 && (
                    <div className="mt-1.5">
                      <Bars items={s.electives.map((e) => ({ key: e.slug, label: subjectLook(e.slug, e.slug).name, count: e.count }))} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Panel>
  )
}

const INSTALLED = { Yes: 'Installed app', No: 'Browser' }

export default function Overview() {
  const { data, error, loading, reload } = useAdmin('adminOverview')
  const overview = data?.overview

  if (error && !overview) return <ErrorState message={error} onRetry={reload} />

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-display">Overview</h1>
          <p className="mt-1 text-label text-ink-2">
            {overview
              ? `Updated ${new Date(overview.generatedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} · kept for 10 minutes`
              : 'Loading…'}
          </p>
        </div>
        <button type="button" className="btn-secondary" onClick={reload} disabled={loading}>
          <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" /> Refresh
        </button>
      </div>

      {!overview ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard label="Students" value={overview.totals.students} hint={`${overview.totals.fileOpens} files opened`} />
            <StatCard label="Active today" value={overview.totals.activeToday} />
            <StatCard label="Active, 7 days" value={overview.totals.active7} />
            <StatCard label="Active, 30 days" value={overview.totals.active30} />
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <SignUps days={overview.signUps} />
            <Panel title="Devices">
              <Bars items={overview.devices} empty="No devices logged yet." />
              <h3 className="mt-5 mb-2 text-label font-semibold text-ink">Installed app vs browser</h3>
              <Bars items={overview.installed.map((i) => ({ ...i, label: INSTALLED[i.label] || i.label }))} empty="Not logged yet." />
            </Panel>
            <Courses courses={overview.courses} />
            <Panel title="Most-opened subjects">
              <Bars
                items={overview.topSubjects.map((s) => ({ key: s.subject, label: s.name, count: s.count, detail: semesterLabel(s.subject.split('/')[0]) }))}
                empty="No files opened yet."
              />
            </Panel>
            <Panel title="Most-opened files">
              <Bars
                items={overview.topFiles.map((f) => ({
                  key: f.file,
                  label: f.file.split('/').pop(),
                  title: f.file,
                  count: f.count,
                  detail: f.file.split('/').slice(0, -1).join(' / '),
                }))}
                empty="No files opened yet."
              />
            </Panel>
            <Panel title="Never opened">
              {overview.neverOpened.length ? (
                <ul className="flex flex-col divide-y divide-line">
                  {overview.neverOpened.map((s) => (
                    <li key={s.subject} className="flex items-baseline justify-between gap-3 py-2 text-label">
                      <span className="min-w-0 truncate text-ink">
                        {s.name} <span className="text-ink-3">· {semesterLabel(s.subject.split('/')[0])}</span>
                      </span>
                      <span className="shrink-0 font-mono text-ink-3">{s.files} files</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-label text-ink-3">Every subject with files has been opened.</p>
              )}
            </Panel>
          </div>
        </>
      )}
    </div>
  )
}
