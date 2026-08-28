import { Routes, Route } from 'react-router-dom'
import Login from './pages/Login.jsx'
import Home from './pages/Home.jsx'
import Subject from './pages/Subject.jsx'
import NotFound from './pages/NotFound.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Home />} />
      <Route path="/subject/:subjectId" element={<Subject />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
