import { Link } from 'react-router-dom'
import { useAuth } from '../context/useAuth.js'

export default function Home() {
  const { user, logout } = useAuth()

  if (!user) {
    return (
      <div className="p-6">
        <p className="text-sm text-gray-500">
          You're not signed in. <Link to="/login" className="underline">Go to login</Link>.
        </p>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Subjects</h1>
          <p className="mt-1 text-sm text-gray-500">Signed in as {user.email}</p>
        </div>
        <button onClick={logout} className="text-sm underline">
          Log out
        </button>
      </div>
      <p className="mt-4 text-sm text-gray-500">Subject listing placeholder</p>
    </div>
  )
}
