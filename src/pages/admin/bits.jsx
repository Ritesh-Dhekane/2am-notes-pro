// Shared pieces of the admin pages: stat cards, panels and simple bar lists.

import { Card } from '../../components/ui.jsx'

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
