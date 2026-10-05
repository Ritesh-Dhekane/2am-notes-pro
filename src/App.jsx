import { lazy, Suspense, useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import Shell from './components/Shell.jsx'
import { useAuth } from './context/useAuth.js'
import { trackPageView } from './lib/analytics.js'
import { useStudy } from './lib/study.js'
import Login from './pages/Login.jsx'
import NotFound from './pages/NotFound.jsx'
import Welcome from './pages/Welcome.jsx'

const Dashboard = lazy(() => import('./pages/Dashboard.jsx'))
const Subjects = lazy(() => import('./pages/Subjects.jsx'))
const Subject = lazy(() => import('./pages/Subject.jsx'))
const Reader = lazy(() => import('./pages/Reader.jsx'))
const Pyqs = lazy(() => import('./pages/Pyqs.jsx'))
const Search = lazy(() => import('./pages/Search.jsx'))
const Saved = lazy(() => import('./pages/Saved.jsx'))
const Profile = lazy(() => import('./pages/Profile.jsx'))
const Setup = lazy(() => import('./pages/Setup.jsx'))

// Signed-out visitors see what's on offer and sign in there, then go back to where they were going.
function RequireAuth({ children }) {
  const { user } = useAuth()
  const location = useLocation()
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  return children
}

// Signed in but no semester chosen yet: set that up first.
// Not set up on this device: first check the choice saved with the account (a moment after sign-in).
function RequireSetup({ children }) {
  const { complete, syncedToken } = useStudy()
  const { user } = useAuth()
  const location = useLocation()
  if (!complete && syncedToken !== user?.idToken) return <PageLoading />
  if (!complete) return <Navigate to="/setup" replace state={{ from: location.pathname + location.search }} />
  return children
}

function Home() {
  const { user } = useAuth()
  return user ? <Dashboard /> : <Welcome />
}

function PageLoading() {
  return <div className="h-40" aria-busy="true" />
}

export default function App() {
  const location = useLocation()
  const { user } = useAuth()

  useEffect(() => {
    trackPageView(location.pathname)
  }, [location.pathname])

  return (
    <Suspense fallback={<PageLoading />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        {!user && <Route path="/" element={<Welcome />} />}
        <Route
          path="/setup"
          element={
            <RequireAuth>
              <Setup />
            </RequireAuth>
          }
        />
        <Route
          element={
            <RequireAuth>
              <RequireSetup>
                <Shell />
              </RequireSetup>
            </RequireAuth>
          }
        >
          <Route path="/" element={<Home />} />
          <Route path="/subjects" element={<Subjects />} />
          <Route path="/subject/:subjectId" element={<Subject />} />
          <Route path="/read/:subjectId/:fileId" element={<Reader />} />
          <Route path="/pyqs" element={<Pyqs />} />
          <Route path="/search" element={<Search />} />
          <Route path="/saved" element={<Saved />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  )
}
