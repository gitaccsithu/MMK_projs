import { useState, useEffect } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, MessageSquare, BookOpen, Upload, Search, BarChart3,
  Settings, History, Activity, FileCode, Menu, X, Zap, Command, Moon, Sun, LogOut,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { useAuthStore, useSettingsStore } from '@/store'
import { Button } from '@/components/ui/Button'
import { CommandPalette } from '@/components/layout/CommandPalette'

const nav = [
  { to: '/app', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/app/chat', icon: MessageSquare, label: 'AI Chat' },
  { to: '/app/knowledge', icon: BookOpen, label: 'Knowledge' },
  { to: '/app/search', icon: Search, label: 'Search' },
  { to: '/app/ingest', icon: Upload, label: 'Ingestion', admin: true },
  { to: '/app/analytics', icon: BarChart3, label: 'Analytics', admin: true },
  { to: '/app/prompts', icon: FileCode, label: 'Prompts', admin: true },
  { to: '/app/monitoring', icon: Activity, label: 'Monitoring', admin: true },
  { to: '/app/history', icon: History, label: 'History' },
  { to: '/app/settings', icon: Settings, label: 'Settings' },
]

export function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [cmdOpen, setCmdOpen] = useState(false)
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCmdOpen((o) => !o)
      }
    }
    window.addEventListener('keydown', down)
    return () => window.removeEventListener('keydown', down)
  }, [])
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const { theme, toggleTheme, agentOnline } = useSettingsStore()
  const navigate = useNavigate()

  const filteredNav = nav.filter((n) => !n.admin || user?.role === 'admin')

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <aside className={cn(
        'fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-zinc-200 bg-white/80 backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-900/80 md:static md:translate-x-0 transition-transform',
        mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
      )}>
        <div className="flex h-14 items-center gap-2 border-b border-zinc-200 px-4 dark:border-zinc-800">
          <Zap className="h-5 w-5 text-indigo-500" />
          <span className="font-semibold">InsightFlow</span>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
          {filteredNav.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800',
                )
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-zinc-200 p-3 dark:border-zinc-800">
          <p className="truncate text-xs text-zinc-500">{user?.name}</p>
          <p className="truncate text-xs capitalize text-zinc-400">{user?.role}</p>
        </div>
      </aside>

      <div className="flex flex-1 flex-col md:pl-0">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-zinc-200 bg-white/70 px-4 backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-900/70">
          <button type="button" className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <div className="flex-1" />
          <span className={cn('hidden text-xs sm:inline', agentOnline ? 'text-emerald-500' : 'text-amber-500')}>
            {agentOnline ? 'Agent online' : 'Agent offline'}
          </span>
          <Button variant="ghost" size="sm" onClick={() => setCmdOpen(true)} title="Cmd+K">
            <Command className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={toggleTheme}>
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => { logout(); navigate('/login') }}>
            <LogOut className="h-4 w-4" />
          </Button>
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />
    </div>
  )
}
