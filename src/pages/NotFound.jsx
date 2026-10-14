import { MapPinOff } from 'lucide-react'
import { Link } from 'react-router-dom'
import { EmptyState } from '../components/ui.jsx'

export default function NotFound() {
  return (
    <div className="py-8">
      <h1 className="sr-only">Page not found</h1>
      <EmptyState
        icon={MapPinOff}
        title="This page doesn't exist"
        text="The link may be old, or the file may have moved."
        action={
          <Link to="/" className="btn-primary">
            Back to dashboard
          </Link>
        }
      />
    </div>
  )
}
