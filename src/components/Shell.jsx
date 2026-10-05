// The signed-in frame: left sidebar + top bar on desktop, top bar + bottom tabs on phones.

import { Bookmark, FileQuestion, Home, LayoutGrid, LogOut, Moon, Search, Sun, User } from 'lucide-react'
import { createElement, useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth.js'
import { useLibrary } from '../context/libraryContext.js'
import { useBookmarks } from '../lib/store.js'
import { isDarkTheme, setPrefs, usePrefs } from '../lib/prefs.js'
import { Avatar, Logo } from './ui.jsx'

const SIDEBAR = [
  { to: '/', label: 'Dashboard', icon: Home, end: true },
  { to: '/subjects', label: 'Subjects', icon: LayoutGrid },
  { to: '/pyqs', label: 'PYQ Archive', icon: FileQuestion },
  { to: '/saved', label: 'Saved', icon: Bookmark },
  { to: '/search', label: 'Search', icon: Search },
  { to: '/profile', label: 'Profile & Settings', icon: User },
]

const TABS = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/search', label: 'Search', icon: Search },
  { to: '/saved', label: 'Saved', icon: Bookmark },
  { to: '/profile', label: 'Profile', icon: User },
]

export function ThemeToggle() {
  const { theme } = usePrefs()
  const dark = isDarkTheme(theme)
  const label = dark ? 'Switch to light theme' : 'Switch to dark theme'
  return (
    <button type="button" className="icon-btn" onClick={() => setPrefs({ theme: dark ? 'light' : 'midnight' })} aria-label={label} title={label}>
      {dark ? <Sun className="size-5" aria-hidden="true" /> : <Moon className="size-5" aria-hidden="true" />}
    </button>
  )
}

function Sidebar() {
  const { user, logout } = useAuth()
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-line bg-canvas px-3 py-4 lg:flex" aria-label="Main">
      <Link to="/" className="mb-6 flex items-center gap-3 rounded-xl px-2 py-1">
        <Logo />
        <span>
          <span className="block text-heading leading-tight">
            2AM Notes <span className="font-mono text-caption font-semibold text-primary-ink">PRO</span>
          </span>
          <span className="text-caption text-ink-3">MCA study portal</span>
        </span>
      </Link>
      <nav className="flex flex-col gap-1">
        {SIDEBAR.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex min-h-11 items-center gap-3 rounded-xl px-3 text-body font-medium transition-colors ${
                isActive ? 'bg-surface-2 text-ink' : 'text-ink-2 hover:bg-surface hover:text-ink'
              }`
            }
          >
            {createElement(item.icon, { className: 'size-5', 'aria-hidden': true })}
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto flex items-center gap-3 rounded-2xl border border-line bg-surface p-3">
        <Avatar user={user} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-label font-semibold text-ink">{user?.name}</span>
          <span className="block truncate text-caption text-ink-3">{user?.email}</span>
        </span>
        <button type="button" className="icon-btn" onClick={() => logout()} aria-label="Sign out" title="Sign out">
          <LogOut className="size-5" aria-hidden="true" />
        </button>
      </div>
    </aside>
  )
}

// Desktop search box in the top bar; Ctrl/⌘+K focuses it from anywhere.
function TopSearch() {
  const navigate = useNavigate()
  const inputRef = useRef(null)
  const [value, setValue] = useState('')

  useEffect(() => {
    function onKey(event) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        if (window.matchMedia('(min-width: 1024px)').matches) inputRef.current?.focus()
        else navigate('/search')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [navigate])

  return (
    <form
      role="search"
      className="hidden w-full max-w-md items-center gap-2 rounded-xl border border-line bg-surface px-3 focus-within:border-primary-ink lg:flex"
      onSubmit={(event) => {
        event.preventDefault()
        navigate(`/search?q=${encodeURIComponent(value.trim())}`)
        setValue('')
        inputRef.current?.blur()
      }}
    >
      <Search className="size-4 text-ink-3" aria-hidden="true" />
      <label htmlFor="top-search" className="sr-only">
        Search notes, PYQs and references
      </label>
      <input
        id="top-search"
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search notes, PYQs, references…"
        className="h-11 min-w-0 flex-1 bg-transparent text-body text-ink outline-none placeholder:text-ink-3"
      />
      <kbd className="rounded-md border border-line px-1.5 font-mono text-caption text-ink-3">Ctrl K</kbd>
    </form>
  )
}

function MobileTopBar() {
  const { user } = useAuth()
  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-line bg-canvas/90 px-4 py-2 pt-[max(0.5rem,env(safe-area-inset-top))] backdrop-blur lg:hidden">
      <Link to="/" className="flex flex-1 items-center gap-2.5">
        <Logo className="size-8" />
        <span className="text-heading leading-tight">2AM Notes Pro</span>
      </Link>
      <ThemeToggle />
      <Link to="/profile" aria-label="Profile">
        <Avatar user={user} className="size-9" />
      </Link>
    </header>
  )
}

function BottomNav() {
  const bookmarks = useBookmarks()
  const { library } = useLibrary()
  // Files removed from Drive don't count once the library has loaded.
  const saved = Object.keys(bookmarks).filter((id) => !library || library.byId.has(id)).length
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-canvas/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
    >
      <ul className="mx-auto flex h-16 max-w-md items-stretch justify-around">
        {TABS.map((tab) => (
          <li key={tab.to} className="flex flex-1">
            <NavLink
              to={tab.to}
              end={tab.end}
              className={({ isActive }) =>
                `relative flex flex-1 flex-col items-center justify-center gap-0.5 text-caption font-medium ${
                  isActive ? 'text-primary-ink' : 'text-ink-2'
                }`
              }
            >
              {createElement(tab.icon, { className: 'size-6', 'aria-hidden': true })}
              {tab.label}
              {tab.to === '/saved' && saved > 0 && (
                <span className="absolute top-1.5 left-1/2 ml-2 rounded-full bg-teal px-1.5 font-mono text-[10px] font-semibold text-canvas">
                  {saved}
                </span>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export default function Shell() {
  const location = useLocation()
  const mainRef = useRef(null)

  // New page: start at the top.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  return (
    <div className="min-h-svh lg:pl-64">
      <a
        href="#main"
        className="sr-only z-50 rounded-xl bg-primary px-4 py-2 text-on-primary focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>
      <Sidebar />
      <MobileTopBar />
      <header className="sticky top-0 z-20 hidden h-16 items-center justify-between gap-4 border-b border-line bg-canvas/90 px-6 backdrop-blur lg:flex">
        <TopSearch />
        <ThemeToggle />
      </header>
      <main id="main" ref={mainRef} tabIndex={-1} className="mx-auto max-w-6xl px-5 pt-5 pb-28 outline-none lg:px-8 lg:pt-8 lg:pb-16">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
