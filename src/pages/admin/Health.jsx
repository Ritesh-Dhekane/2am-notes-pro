// /admin/health: the backend at a glance (apps-script/Health.js). Its version, whether the hourly jobs
// are installed and ran lately, the last swallowed logging error, tab sizes and how full the Script
// Properties the portal writes are. Anything that needs a look is shown in red.

import { RefreshCw } from 'lucide-react'
import { ErrorState, Skeleton } from '../../components/ui.jsx'
import { useAdmin } from './adminData.js'
import { Panel, StatCard } from './bits.jsx'

const HOUR = 60 * 60 * 1000
const STALE = 2 * HOUR // the hourly jobs, with an hour to spare

// ISO time -> "12 min ago"; '' for none.
function age(iso, now = Date.now()) {
  const ms = now - new Date(iso).getTime()
  if (!iso || Number.isNaN(ms)) return ''
  if (ms < HOUR) return `${Math.max(0, Math.round(ms / 60000))} min ago`
  if (ms < 48 * HOUR) return `${Math.round(ms / HOUR)} h ago`
  return `${Math.round(ms / (24 * HOUR))} days ago`
}

const stale = (iso) => !iso || Date.now() - new Date(iso).getTime() > STALE

// [label, value, bad?] rows.
function Rows({ rows }) {
  return (
    <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2 text-label">
      {rows.map(([label, value, bad]) => (
        <div key={label} className="contents">
          <dt className="text-ink-2">{label}</dt>
          <dd className={`min-w-0 break-words ${bad ? 'font-semibold text-danger' : 'text-ink'}`}>{value}</dd>
        </div>
      ))}
    </dl>
  )
}

const rowsOf = (n) => (n === null || n === undefined ? 'No tab yet' : `${n} rows`)

function size({ chars, items }, limit, noun) {
  if (!chars) return 'Not set'
  return `${items === null ? 'unreadable' : `${items} ${noun}`} · ${(chars / 1000).toFixed(1)} of ${limit / 1000} KB`
}

export default function Health() {
  const { data, error, loading, reload } = useAdmin('adminHealth')
  const health = data?.health

  if (error && !health) return <ErrorState message={error} onRetry={reload} />

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-display">Health</h1>
          <p className="mt-1 text-label text-ink-2">
            {health ? `Checked ${new Date(health.time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` : 'Loading…'}
          </p>
        </div>
        <button type="button" className="btn-secondary" onClick={reload} disabled={loading}>
          <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" /> Check again
        </button>
      </div>

      {!health ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard label="Backend version" value={health.version || '–'} />
            <StatCard label="Library refreshed" value={age(health.cache.refreshedAt) || 'Never'} hint={health.cache.catalogCached ? 'Listing cache warm' : 'Listing cache cold'} />
            <StatCard label="Students" value={health.sheets.students ?? '–'} hint="rows in the Students tab" />
            <StatCard label="Log rows" value={health.sheets.logs ?? '–'} hint="in the Logs tab" />
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:items-start">
            <Panel title="Background jobs">
              <Rows
                rows={[
                  ['Library refresh trigger', health.triggers.refreshCaches ? 'Installed (hourly)' : 'Not installed: run installTriggers', !health.triggers.refreshCaches],
                  [
                    'Last library refresh',
                    health.cache.refreshedAt ? `${new Date(health.cache.refreshedAt).toLocaleString()} · ${age(health.cache.refreshedAt)}` : 'Not recorded yet',
                    health.triggers.refreshCaches && stale(health.cache.refreshedAt),
                  ],
                  ['Flag check trigger', health.triggers.checkFlags ? 'Installed (hourly)' : 'Not installed: run installFlagTrigger', !health.triggers.checkFlags],
                  [
                    'Last flag check',
                    health.flags.checkedAt ? `${new Date(health.flags.checkedAt).toLocaleString()} · ${age(health.flags.checkedAt)}` : 'Not recorded yet',
                    health.triggers.checkFlags && stale(health.flags.checkedAt),
                  ],
                  ['Flag check reached', health.flags.cursor ? `Log row ${health.flags.cursor}` : '–'],
                  ...(health.syllabus
                    ? [
                        ['Syllabus mirror trigger', health.triggers.syncSyllabus ? 'Installed (hourly)' : 'Not installed: run installSyllabusTrigger', !health.triggers.syncSyllabus],
                        [
                          'Syllabi mirrored',
                          `${health.syllabus.mirrored} of ${health.syllabus.total}${health.syllabus.syncedAt ? ` · last sync ${age(health.syllabus.syncedAt)}` : ''}`,
                          health.syllabus.total > 0 && health.syllabus.mirrored < health.syllabus.total && stale(health.syllabus.syncedAt),
                        ],
                      ]
                    : []),
                  ...(health.triggers.error ? [['Triggers', health.triggers.error, true]] : []),
                ]}
              />
            </Panel>

            <Panel title="Last logging error">
              {health.lastError ? (
                <p className="font-mono text-label break-words text-danger">{health.lastError}</p>
              ) : (
                <p className="text-label text-ink-2">None in the last 6 hours.</p>
              )}
            </Panel>

            <Panel title="Log spreadsheet">
              <Rows
                rows={
                  health.sheets.configured
                    ? [
                        ['Students', rowsOf(health.sheets.students)],
                        ['Logs', rowsOf(health.sheets.logs)],
                        ['Flags', rowsOf(health.sheets.flags)],
                        ['Admin log', rowsOf(health.sheets.adminLog)],
                        ['Blocks', rowsOf(health.sheets.blocks)],
                        ...(health.sheets.error ? [['Error', health.sheets.error, true]] : []),
                      ]
                    : [['LOG_SHEET_ID', 'Not set: nothing is logged', true]]
                }
              />
            </Panel>

            <Panel title="Script Properties">
              <Rows
                rows={[
                  ['ANNOUNCEMENTS', size(health.properties.announcements, health.properties.limit, 'items'), health.properties.announcements.chars > health.properties.limit * 0.8],
                  ['VISIBILITY', size(health.properties.visibility, health.properties.limit, 'rules'), health.properties.visibility.chars > health.properties.limit * 0.8],
                  ['BLOCKED_EMAILS', `${health.properties.blocked} accounts`],
                  ['ADMIN_EMAILS', `${health.properties.admins} admins`],
                ]}
              />
            </Panel>
          </div>
        </>
      )}
    </div>
  )
}
