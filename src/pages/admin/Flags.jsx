// /admin/flags: what the hourly misuse check found (apps-script/Flags.js). Nothing is blocked
// automatically: an admin dismisses a flag or blocks the student. The filters live in the URL.

import { Flag, Search } from 'lucide-react'
import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Chips from '../../components/Chips.jsx'
import { Card, EmptyState, ErrorState, Skeleton } from '../../components/ui.jsx'
import { FLAG_RULES, useAdmin, useAdminAction } from './adminData.js'
import { BlockControl, FlagItem } from './bits.jsx'

const SELECT = 'h-11 min-w-0 rounded-xl border border-line bg-surface px-3 text-body text-ink'

// `onChange` updates the count in the admin nav.
export default function Flags({ onChange }) {
  const [params, setParams] = useSearchParams()
  const status = params.get('status') || 'open'
  const rule = params.get('rule') || ''
  const [text, setText] = useState('')
  const { data, error, loading, reload } = useAdmin('adminFlags', { status: status === 'all' ? '' : status })
  const [run, action] = useAdminAction()

  function set(changes) {
    const next = new URLSearchParams(params)
    for (const [key, value] of Object.entries(changes)) {
      if (value && !(key === 'status' && value === 'open')) next.set(key, value)
      else next.delete(key)
    }
    setParams(next, { replace: true })
  }

  async function update(flag, next) {
    if (await run('adminFlagUpdate', { row: flag.row, status: next })) {
      reload()
      onChange?.()
    }
  }

  const counts = data?.counts || {}
  const query = text.trim().toLowerCase()
  const flags = (data?.flags || []).filter((f) => (!rule || f.rule === rule) && (!query || f.email.includes(query)))

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-display">Flags</h1>
        <p className="mt-1 text-body text-ink-2">
          Checked every hour from the access log. A flag is only a hint: look at the student's activity before blocking.
        </p>
      </div>

      <Chips
        label="Status"
        value={status}
        onChange={(key) => set({ status: key })}
        options={[
          { key: 'open', label: 'Open', count: counts.open },
          { key: 'dismissed', label: 'Dismissed', count: counts.dismissed },
          { key: 'blocked', label: 'Blocked', count: counts.blocked },
          { key: 'all', label: 'All' },
        ]}
      />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <label className="flex min-w-0 items-center gap-2 rounded-xl border border-line bg-surface px-3 focus-within:border-primary-ink">
          <Search className="size-4 shrink-0 text-ink-3" aria-hidden="true" />
          <span className="sr-only">Filter by email</span>
          <input
            type="search"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Email"
            className="h-11 min-w-0 flex-1 bg-transparent text-body text-ink outline-none placeholder:text-ink-3"
          />
        </label>
        <select aria-label="Rule" className={SELECT} value={rule} onChange={(e) => set({ rule: e.target.value })}>
          <option value="">All rules</option>
          {Object.entries(FLAG_RULES).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {action.error && (
        <p role="alert" className="text-label text-danger">
          {action.error}
        </p>
      )}
      {error && !data ? (
        <ErrorState message={error} onRetry={reload} />
      ) : !data ? (
        <Skeleton className="h-64" />
      ) : flags.length === 0 ? (
        <EmptyState icon={Flag} title="No flags" text={status === 'open' ? 'Nothing needs a look right now.' : 'No flags match these filters.'} />
      ) : (
        <Card className={`min-w-0 px-4 ${loading ? 'opacity-80' : ''}`}>
          <ul className="flex flex-col divide-y divide-line">
            {flags.map((flag) => (
              <FlagItem
                key={flag.row}
                flag={flag}
                actions={
                  flag.status !== 'blocked' && (
                    <>
                      <button
                        type="button"
                        className="btn-secondary"
                        disabled={action.busy}
                        onClick={() => update(flag, flag.status === 'open' ? 'dismissed' : 'open')}
                      >
                        {flag.status === 'open' ? 'Dismiss' : 'Reopen'}
                      </button>
                      <BlockControl
                        email={flag.email}
                        blocked={false}
                        onDone={() => {
                          reload()
                          onChange?.()
                        }}
                      />
                    </>
                  )
                }
              />
            ))}
          </ul>
        </Card>
      )}
    </div>
  )
}
