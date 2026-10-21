// Optional birthday input with its own validation message, next to the phone number in Setup and Profile.
// No min/max on the input: the browser would block the form with its own message instead of this one.

import { checkBirthday } from '../lib/birthday.js'

export default function BirthdayField({ value, onChange, showError, id = 'birthday' }) {
  const { error } = checkBirthday(value)
  const invalid = Boolean(showError && error)
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <label htmlFor={id} className="text-heading">
        Birthday <span className="text-label font-normal text-ink-3">(optional)</span>
      </label>
      <input
        id={id}
        type="date"
        autoComplete="bday"

        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={invalid}
        aria-describedby={`${id}-hint`}
        className={`h-11 w-full max-w-xs min-w-0 rounded-xl border bg-surface px-3 text-body text-ink outline-none focus:border-primary-ink ${
          invalid ? 'border-danger' : 'border-line'
        }`}
      />
      <p id={`${id}-hint`} className={`text-label ${invalid ? 'text-danger' : 'text-ink-2'}`} aria-live="polite">
        {invalid ? error : 'Kept private, seen only by the portal owner.'}
      </p>
    </div>
  )
}
