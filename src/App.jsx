import { useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Login from './pages/Login.jsx'
import Home from './pages/Home.jsx'
import Subject from './pages/Subject.jsx'
import NotFound from './pages/NotFound.jsx'
import { trackPageView } from './lib/analytics.js'

export default function App() {
  const location = useLocation()

  useEffect(() => {
    trackPageView(location.pathname)
  }, [location.pathname])

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Home />} />
      <Route path="/subject/:subjectId" element={<Subject />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
