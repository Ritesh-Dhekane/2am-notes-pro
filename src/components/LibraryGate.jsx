// Shows loading / error states until the library is ready, then renders children with it.

import { useLibrary } from '../context/libraryContext.js'
import { ErrorState, Skeleton } from './ui.jsx'

export default function LibraryGate({ children, skeleton }) {
  const { status, library, error, retry } = useLibrary()
  if (status === 'error') return <ErrorState message={error} onRetry={retry} />
  if (status !== 'ready')
    return (
      skeleton || (
        <div className="flex flex-col gap-4" aria-busy="true" aria-label="Loading">
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      )
    )
  return children(library)
}
