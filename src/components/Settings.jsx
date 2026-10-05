// Form controls for the settings page: a section card, a segmented choice (radio group) and an
// on/off switch.

import { createElement, useId } from 'react'
import { Card } from './ui.jsx'

export function SettingsSection({ icon, title, description, children }) {
  const id = useId()
  return (
    <Card className="flex flex-col gap-5 p-5" aria-labelledby={id}>
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary-ink" aria-hidden="true">
          {createElement(icon, { className: 'size-5' })}
        </span>
        <div className="min-w-0">
          <h2 id={id} className="text-title">
            {title}
          </h2>
          {description && <p className="text-label text-ink-2">{description}</p>}
        </div>
      </div>
      {children}
    </Card>
  )
}

export function Segmented({ legend, name, options, value, onChange, columns = options.length }) {
  return (
    <fieldset className="flex min-w-0 flex-col gap-2">
      <legend className="mb-2 font-mono text-caption font-medium tracking-wide text-ink-3 uppercase">{legend}</legend>
      <div className="grid gap-1 rounded-xl border border-line bg-surface-2 p-1" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
        {options.map((o) => {
          const on = o.value === value
          return (
            <label
              key={String(o.value)}
              className={`flex min-h-11 cursor-pointer flex-col items-center justify-center rounded-lg px-2 py-1.5 text-center transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-primary-ink ${
                on ? 'bg-surface text-ink shadow-sm ring-1 ring-line-strong' : 'text-ink-2 hover:text-ink'
              }`}
            >
              <input type="radio" name={name} value={String(o.value)} checked={on} onChange={() => onChange(o.value)} className="sr-only" />
              <span className="text-label font-semibold" style={o.style}>
                {o.label}
              </span>
              {o.hint && <span className="text-caption text-ink-3">{o.hint}</span>}
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}

export function Switch({ label, hint, checked, onChange }) {
  const id = useId()
  return (
    <div className="flex items-center gap-4">
      <div className="min-w-0 flex-1">
        <p id={`${id}-label`} className="text-body font-medium text-ink">
          {label}
        </p>
        {hint && (
          <p id={`${id}-hint`} className="text-label text-ink-2">
            {hint}
          </p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={`${id}-label`}
        aria-describedby={hint ? `${id}-hint` : undefined}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 shrink-0 rounded-full border transition-colors ${
          checked ? 'border-teal bg-teal' : 'border-line-strong bg-surface-2'
        }`}
      >
        <span
          className={`absolute top-1/2 size-5 -translate-y-1/2 rounded-full shadow transition-[left] ${
            checked ? 'left-[calc(100%-1.375rem)] bg-white' : 'left-0.5 bg-ink-3'
          }`}
          aria-hidden="true"
        />
      </button>
    </div>
  )
}
