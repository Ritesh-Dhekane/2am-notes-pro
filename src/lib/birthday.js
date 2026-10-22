// The optional birthday in Setup and Profile, as "YYYY-MM-DD": a real date, not in the future, aged 15
// to 80 today. The backend checks the same rule (apps-script/Students.js). Never sent to analytics.

const pad = (n) => String(n).padStart(2, '0')
const dayText = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`

// { birthday } ('' when empty), or { error }.
export function checkBirthday(input, today = new Date()) {
  const text = String(input || '').trim()
  if (!text) return { birthday: '' }
  const m = text.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  const date = m && new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  if (!m || date.getFullYear() !== Number(m[1]) || date.getMonth() !== Number(m[2]) - 1 || date.getDate() !== Number(m[3])) {
    return { error: 'Enter a real date.' }
  }
  if (text > dayText(today)) return { error: "Your birthday can't be in the future." }
  const age = today.getFullYear() - date.getFullYear() - (today.getMonth() * 100 + today.getDate() < date.getMonth() * 100 + date.getDate() ? 1 : 0)
  if (age < 15 || age > 80) return { error: 'Your age must be between 15 and 80.' }
  return { birthday: text }
}

// Whole years since a "YYYY-MM-DD" birthday, or null.
export function ageOf(birthday, today = new Date()) {
  const m = String(birthday || '').match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!m) return null
  const [y, mo, d] = m.slice(1).map(Number)
  return today.getFullYear() - y - (today.getMonth() * 100 + today.getDate() < (mo - 1) * 100 + d ? 1 : 0)
}

