// A file list with the desktop preview pane beside it.

import FilePane from './FilePane.jsx'

export default function PaneLayout({ library, active, children }) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[380px_minmax(0,1fr)] lg:items-start">
      <div className="flex min-w-0 flex-col gap-4">{children}</div>
      <div className="hidden lg:sticky lg:top-24 lg:block">
        <FilePane file={active} subject={active ? library.bySlug.get(active.subject) : null} />
      </div>
    </div>
  )
}
