// Production only: discourage copying and saving notes (right-click, selection, copy, drag, save,
// print, view-source). A deterrent, not a lock: screenshots and developer tools still work.

const BLOCKED_KEYS = new Set(['c', 'x', 's', 'p', 'u', 'a'])
const isField = (el) => el instanceof Element && !!el.closest('input, textarea, [contenteditable="true"]')

export function protectContent() {
  if (!import.meta.env.PROD) return
  document.documentElement.classList.add('protect')
  const block = (event) => {
    if (!isField(event.target)) event.preventDefault()
  }
  for (const type of ['contextmenu', 'copy', 'cut', 'dragstart', 'selectstart']) document.addEventListener(type, block)
  document.addEventListener('keydown', (event) => {
    if ((event.ctrlKey || event.metaKey) && BLOCKED_KEYS.has(event.key.toLowerCase()) && !isField(event.target)) {
      event.preventDefault()
    }
  })
}
