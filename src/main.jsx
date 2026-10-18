import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { LibraryProvider } from './context/LibraryContext.jsx'
import './lib/prefs.js'
import './lib/install.js'
import { protectContent } from './lib/protect.js'
import { SlowToast } from './components/ui.jsx'
import './index.css'

protectContent()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AuthProvider>
        <LibraryProvider>
          <App />
          <SlowToast />
        </LibraryProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
