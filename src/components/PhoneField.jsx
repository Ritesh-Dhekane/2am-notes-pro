// Optional phone number input with its own validation message. Used by Setup and Profile.

import { normalizePhone } from '../lib/phone.js'

export default function PhoneField({ value, onChange, showError, id = 'phone' }) {
  const { error } = normalizePhone(value)
  const invalid = Boolean(showError && error)
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-heading">
        Phone number <span className="text-label font-normal text-ink-3">(optional)</span>
      </label>
      <input
        id={id}
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="98765 43210"
        aria-invalid={invalid}
        aria-describedby={`${id}-hint`}
        className={`h-11 w-full max-w-xs rounded-xl border bg-surface px-3 text-body text-ink outline-none placeholder:text-ink-3 focus:border-primary-ink ${
          invalid ? 'border-danger' : 'border-line'
        }`}
      />
      <p id={`${id}-hint`} className={`text-label ${invalid ? 'text-danger' : 'text-ink-2'}`} aria-live="polite">
        {invalid ? error : 'Only the portal owner sees it, to help you if something goes wrong.'}
      </p>
    </div>
  )
}
