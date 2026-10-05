// Opening a file from a list: on desktop it shows in the preview pane (kept in ?file= so it
// survives reloads), on phones it opens the full reader.

import { useNavigate, useSearchParams } from 'react-router-dom'
import { trackEvent } from './analytics.js'
import { fileHref } from './files.js'

export function isDesktop() {
  return window.matchMedia('(min-width: 1024px)').matches
}

export function useFilePane(library) {
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const activeId = params.get('file')
  const active = activeId ? library.byId.get(activeId) || null : null

  function open(file) {
    trackEvent('file_open', { subject: file.subject, category: file.category, kind: file.kind })
    if (isDesktop()) {
      const next = new URLSearchParams(params)
      next.set('file', file.id)
      setParams(next, { replace: true })
    } else {
      navigate(fileHref(file))
    }
  }

  return { active, activeId, open }
}
