// A row of toggle chips (scope, subject filters). Scrolls sideways on phones instead of wrapping.

export default function Chips({ label, options, value, onChange, mono = false }) {
  return (
    <div role="group" aria-label={label} className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 lg:mx-0 lg:flex-wrap lg:px-0">
      {options.map((o) => {
        const on = o.key === value
        return (
          <button
            key={o.key}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(o.key)}
            className={`flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 ${mono ? 'font-mono text-caption' : 'text-label'} font-medium transition-colors ${
              on ? 'border-primary bg-primary text-on-primary' : 'border-line bg-surface text-ink-2 hover:border-line-strong hover:text-ink'
            }`}
          >
            {o.label}
            {o.count !== undefined && <span className={`font-mono text-caption ${on ? '' : 'text-ink-3'}`}>{o.count}</span>}
          </button>
        )
      })}
    </div>
  )
}
