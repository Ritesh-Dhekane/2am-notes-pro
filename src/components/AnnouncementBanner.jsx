// The owner's announcements, one banner each, above the page. Signed out (no idToken) only those for
// everyone. A dismissed one stays hidden on this device. The text is shown as plain text.

import { Megaphone, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { dismissAnnouncement, dismissedAnnouncements, loadAnnouncements } from '../lib/announcements.js'

export default function AnnouncementBanner({ idToken, semester, className = '' }) {
  const [list, setList] = useState([])
  const [dismissed, setDismissed] = useState(dismissedAnnouncements)

  useEffect(() => {
    let cancelled = false
    loadAnnouncements(idToken, semester)
      .then((items) => !cancelled && setList(items))
      .catch(() => {}) // a banner is never worth an error
    return () => {
      cancelled = true
    }
  }, [idToken, semester])

  const shown = list.filter((a) => !dismissed.includes(a.id))
  if (!shown.length) return null

  function dismiss(id) {
    dismissAnnouncement(id)
    setDismissed((d) => [...d, id])
  }

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {shown.map((a) => (
        <section
          key={a.id}
          aria-label="Announcement"
          className="flex min-w-0 items-start gap-3 rounded-2xl border border-primary bg-primary-soft py-2 pr-2 pl-4 text-primary-ink"
        >
          <Megaphone className="mt-2.5 size-4 shrink-0" aria-hidden="true" />
          <p className="min-w-0 flex-1 py-2 text-label break-words text-ink">{a.text}</p>
          <button type="button" className="icon-btn size-9 shrink-0" onClick={() => dismiss(a.id)} aria-label="Dismiss announcement">
            <X className="size-4" aria-hidden="true" />
          </button>
        </section>
      ))}
    </div>
  )
}
