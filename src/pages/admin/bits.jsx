// Shared pieces of the admin pages: stat cards, panels, simple bar lists and flags.

import { Ban, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Card } from '../../components/ui.jsx'
import { useAuth } from '../../context/useAuth.js'
import { FLAG_RULES, formatTime, studentPath, useAdminAction } from './adminData.js'

export function StatCard({ label, value, hint }) {
  return (
    <Card className="min-w-0 p-4">
      <p className="truncate text-label text-ink-2">{label}</p>
      <p className="mt-1 font-mono text-title text-ink">{value}</p>
      {hint && <p className="truncate text-caption text-ink-3">{hint}</p>}
    </Card>
  )
}

// A titled card around one block of a page.
export function Panel({ title, children, className = '' }) {
  return (
    <Card className={`min-w-0 p-4 ${className}`}>
      <h2 className="mb-3 text-heading">{title}</h2>
      {children}
    </Card>
  )
}

// Horizontal bars: [{ label, count, key?, title?, detail? }].
export function Bars({ items, empty = 'Nothing yet.' }) {
  if (!items?.length) return <p className="text-label text-ink-3">{empty}</p>
  const max = Math.max(...items.map((i) => i.count), 1)
  return (
    <ul className="flex flex-col gap-2.5">
      {items.map((item) => (
        <li key={item.key || item.label} className="min-w-0">
          <div className="flex items-baseline justify-between gap-3 text-label">
            <span className="min-w-0 truncate text-ink" title={item.title || item.label}>
              {item.label}
            </span>
            <span className="shrink-0 font-mono text-ink-2">{item.count}</span>
          </div>
          <div className="mt-1 h-1.5 rounded-full bg-surface-2">
            <div className="h-full rounded-full bg-primary" style={{ width: `${(item.count / max) * 100}%` }} />
          </div>
          {item.detail && <p className="mt-0.5 truncate text-caption text-ink-3">{item.detail}</p>}
        </li>
      ))}
    </ul>
  )
}

const STATUS_LOOK = {
  open: 'border-danger text-danger',
  dismissed: 'border-line text-ink-3',
  blocked: 'border-line-strong bg-surface-2 text-ink',
}

// One flag from the Flags tab; `actions` are its buttons.
export function FlagItem({ flag, showEmail = true, actions }) {
  return (
    <li className="flex min-w-0 flex-col gap-2 py-3 sm:flex-row sm:items-start sm:gap-4">
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-ink">{FLAG_RULES[flag.rule] || flag.rule}</span>
          <span className={`rounded-full border px-2 py-px text-caption font-medium ${STATUS_LOOK[flag.status] || STATUS_LOOK.dismissed}`}>
            {flag.status}
          </span>
        </p>
        {showEmail && (
          <Link to={studentPath(flag.email)} className="block truncate font-mono text-caption text-primary-ink hover:underline">
            {flag.email}
          </Link>
        )}
        <p className="mt-1 text-label break-words text-ink-2">{flag.evidence}</p>
        <p className="mt-0.5 text-caption text-ink-3">
          {formatTime(flag.time)}
          {flag.reviewedBy && ` · ${flag.status} by ${flag.reviewedBy}, ${formatTime(flag.reviewedAt)}`}
        </p>
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </li>
  )
}

// Block or unblock a student, after asking for the reason (kept in the Blocks tab and the Admin log).
// Blocking applies on their next request. onDone(block) gets the new status.
export function BlockControl({ email, blocked, onDone }) {
  const { user } = useAuth()
  const [run, action] = useAdminAction()
  const [asking, setAsking] = useState(false)
  const [reason, setReason] = useState('')
  const verb = blocked ? 'Unblock' : 'Block'

  if (!blocked && email.toLowerCase() === user?.email?.toLowerCase()) return null // admins can't block themselves

  async function submit(e) {
    e.preventDefault()
    const result = await run(blocked ? 'adminUnblock' : 'adminBlock', { email, reason: reason.trim() })
    if (!result) return
    setAsking(false)
    setReason('')
    onDone?.(result.block)
  }

  if (!asking) {
    return (
      <button type="button" className="btn-secondary" onClick={() => setAsking(true)}>
        {blocked ? <ShieldCheck className="size-4" aria-hidden="true" /> : <Ban className="size-4 text-danger" aria-hidden="true" />} {verb}
      </button>
    )
  }
  return (
    <form onSubmit={submit} className="flex w-full flex-col gap-2 sm:w-72">
      <label className="flex flex-col gap-1 text-label text-ink-2">
        {blocked ? 'Why unblock?' : `Why block ${email}?`}
        <input
          autoFocus
          required
          maxLength={200}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="h-11 min-w-0 rounded-xl border border-line bg-surface px-3 text-body text-ink"
        />
      </label>
      {action.error && (
        <p role="alert" className="text-label text-danger">
          {action.error}
        </p>
      )}
      <span className="flex gap-2">
        <button type="submit" className="btn-primary flex-1" disabled={action.busy || !reason.trim()}>
          {action.busy ? 'Saving…' : verb}
        </button>
        <button type="button" className="btn-secondary" onClick={() => setAsking(false)}>
          Cancel
        </button>
      </span>
    </form>
  )
}
