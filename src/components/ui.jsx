// Small shared building blocks.

import { AlertTriangle, RotateCw, Sparkles } from 'lucide-react'
import { createElement } from 'react'
import { Link } from 'react-router-dom'
import { useLoadingMark, useSlowLoading } from '../lib/slow.js'
import { tintStyle } from '../lib/subjects.js'

export function Logo({ className = 'size-9' }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
      <rect x="0.75" y="0.75" width="46.5" height="46.5" rx="14" className="fill-surface stroke-line" strokeWidth="1.5" />
      <path
        d="M14 26C14 19.3726 19.3726 14 26 14C27.1 14 28.16 14.15 29.17 14.43C25.46 16.48 23 20.47 23 25C23 29.53 25.46 33.52 29.17 35.57C28.16 35.85 27.1 36 26 36C19.3726 36 14 30.6274 14 26Z"
        fill="#6366F1"
      />
      <circle cx="31" cy="20" r="2.5" fill="#38BDF8" />
      <path d="M28 29L33 33" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

export function Card({ as: Tag = 'section', className = '', children, ...rest }) {
  return (
    <Tag className={`rounded-2xl border border-line bg-surface ${className}`} {...rest}>
      {children}
    </Tag>
  )
}

// A subject's icon on its own colour.
export function SubjectIcon({ look, size = 'md' }) {
  const box = size === 'lg' ? 'size-12 rounded-2xl' : size === 'sm' ? 'size-8 rounded-lg' : 'size-10 rounded-xl'
  const glyph = size === 'lg' ? 'size-6' : size === 'sm' ? 'size-4' : 'size-5'
  return (
    <span className={`tint tint-soft tint-text grid shrink-0 place-items-center ${box}`} style={tintStyle(look)}>
      {createElement(look.icon, { className: glyph, 'aria-hidden': true })}
    </span>
  )
}

// Subject or category tag in the mono "label-code" style.
export function Tag({ look, children, className = '' }) {
  return (
    <span
      className={`tint tint-soft tint-text tint-border inline-flex items-center rounded-md border px-2 py-0.5 font-mono text-caption font-medium ${className}`}
      style={look ? tintStyle(look) : { '--tint': '#6366F1' }}
    >
      {children}
    </span>
  )
}

// A subject's or file's state from /admin/content (apps-script/Visibility.js): "Coming soon", and
// "Hidden", which only admins ever get.
export function StatusBadges({ item }) {
  return (
    <>
      {item.comingSoon && (
        <span className="shrink-0 rounded-full bg-primary-soft px-2 py-0.5 text-caption font-semibold text-primary-ink">Coming soon</span>
      )}
      {item.hidden && (
        <span className="shrink-0 rounded-full border border-line-strong px-2 py-0.5 text-caption font-semibold text-ink-2">Hidden</span>
      )}
    </>
  )
}

export function Avatar({ user, className = 'size-9' }) {
  if (user?.picture) {
    return (
      <img
        src={user.picture}
        alt=""
        referrerPolicy="no-referrer"
        className={`${className} shrink-0 rounded-full border border-line object-cover`}
      />
    )
  }
  const initials = (user?.name || '?')
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
  return (
    <span
      className={`${className} grid shrink-0 place-items-center rounded-full bg-primary-soft font-semibold text-primary-ink`}
      aria-hidden="true"
    >
      <span className="text-label">{initials}</span>
    </span>
  )
}

export function EmptyState({ icon, title, text, action }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-line px-6 py-12 text-center">
      {icon && (
        <span className="grid size-12 place-items-center rounded-full bg-surface-2 text-ink-2">
          {createElement(icon, { className: 'size-6', 'aria-hidden': true })}
        </span>
      )}
      <p className="mt-1 text-heading">{title}</p>
      {text && <p className="max-w-sm text-body text-ink-2">{text}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  )
}

export function ErrorState({ message, onRetry }) {
  return (
    <div role="alert" className="flex flex-col items-center gap-3 rounded-2xl border border-line bg-surface px-6 py-10 text-center">
      <AlertTriangle className="size-7 text-danger" aria-hidden="true" />
      <p className="max-w-md text-body text-ink">{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn-secondary">
          <RotateCw className="size-4" aria-hidden="true" /> Try again
        </button>
      )}
    </div>
  )
}

export function Skeleton({ className = '', style }) {
  useLoadingMark()
  return <span className={`block animate-pulse rounded-lg bg-surface-2 ${className}`} style={style} aria-hidden="true" />
}

// Shown top right when a screen has been loading for a while (lib/slow.js).
export function SlowToast() {
  const slow = useSlowLoading()
  return (
    <div role="status" aria-live="polite" className="pointer-events-none fixed top-3 right-3 z-50 lg:top-5 lg:right-5">
      {slow && (
        <p className="max-w-xs rounded-xl border border-line-strong bg-surface px-4 py-3 text-label text-ink shadow-lg">
          The server is taking a little longer than usual. Please wait a few more moments.
        </p>
      )}
    </div>
  )
}

// Credit line for footers.
export function MadeBy({ className = '' }) {
  return (
    <p className={`text-caption text-ink-3 ${className}`}>
      Made with <span aria-label="love">♥</span> by{' '}
      <a href="https://ritesh-dhekane.github.io/" target="_blank" rel="noopener" className="font-semibold text-ink-2 underline-offset-2 hover:text-ink hover:underline">
        Ritesh Dhekane
      </a>
      {' · '}
      <Link to="/privacy" className="underline-offset-2 hover:text-ink hover:underline">
        Privacy
      </Link>
    </p>
  )
}

// AI notice above every note and solution.
export function AiNotice() {
  return (
    <p className="mb-4 flex items-start gap-2 rounded-xl border border-line bg-surface-2 px-3 py-2 text-label text-ink-2">
      <Sparkles className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <span>AI-generated notes and solutions. Please double-check them with your textbook or sources.</span>
    </p>
  )
}
