import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Menu,
  Zap,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Search,
  Command,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useSettingsStore } from '@/store/settingsStore'
import { getNavForRole } from '@/routes/roleRoutes'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn, getInitials } from '@/utils/cn'
import { NotificationDropdown } from '@/components/notifications/NotificationDropdown'
import { CommandPalette } from '@/components/layout/CommandPalette'
import { GlobalSearch } from '@/components/layout/GlobalSearch'
import { OfflineIndicator } from '@/components/layout/OfflineIndicator'
import { useTheme } from 'next-themes'
import { useState } from 'react'

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { session, user, logout } = useAuthStore()
  const { sidebarCollapsed, toggleSidebar } = useSettingsStore()
  const { theme, setTheme } = useTheme()
  const location = useLocation()
  const [searchOpen, setSearchOpen] = useState(false)
  const [commandOpen, setCommandOpen] = useState(false)

  const nav = session ? getNavForRole(session.role) : []
  const breadcrumbs = location.pathname.split('/').filter(Boolean)

  return (
    <div className="flex min-h-screen bg-background">
      <OfflineIndicator />

      {/* Desktop Sidebar */}
      <motion.aside
        animate={{ width: sidebarCollapsed ? 72 : 256 }}
        transition={{ duration: 0.2 }}
        className="hidden md:flex flex-col border-r bg-card shrink-0"
      >
        <div className="flex h-16 items-center gap-2 border-b px-4">
          <Zap className="h-6 w-6 text-primary shrink-0" />
          {!sidebarCollapsed && <span className="font-bold text-lg">ServiceHub</span>}
        </div>
        <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
          {nav.map((item) => {
            const active = location.pathname === item.href || (item.href !== `/${session?.role}` && location.pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {!sidebarCollapsed && item.title}
              </Link>
            )
          })}
        </nav>
        <div className="border-t p-3">
          <Button variant="ghost" size="sm" className="w-full justify-start" onClick={toggleSidebar}>
            {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4 mr-2" />}
            {!sidebarCollapsed && 'Collapse'}
          </Button>
        </div>
      </motion.aside>

      <div className="flex flex-1 flex-col min-w-0">
        {/* Top Navbar */}
        <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur-xl px-4 md:px-6">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <div className="flex h-16 items-center gap-2 border-b px-4">
                <Zap className="h-6 w-6 text-primary" />
                <span className="font-bold text-lg">ServiceHub</span>
              </div>
              <nav className="space-y-1 p-3">
                {nav.map((item) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent"
                  >
                    <item.icon className="h-5 w-5" />
                    {item.title}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>

          {/* Breadcrumbs */}
          <div className="hidden sm:flex items-center gap-1 text-sm text-muted-foreground capitalize truncate">
            {breadcrumbs.map((crumb, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <span>/</span>}
                <span className={i === breadcrumbs.length - 1 ? 'text-foreground font-medium' : ''}>
                  {crumb.replace(/-/g, ' ')}
                </span>
              </span>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" size="sm" className="hidden sm:flex gap-2" onClick={() => setSearchOpen(true)}>
              <Search className="h-4 w-4" />
              Search...
            </Button>
            <Button variant="outline" size="icon" className="hidden sm:flex" onClick={() => setCommandOpen(true)} title="Command palette (⌘K)">
              <Command className="h-4 w-4" />
            </Button>
            <NotificationDropdown />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>
            <div className="flex items-center gap-2 border-l pl-2 ml-1">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.avatar} />
                <AvatarFallback>{getInitials(user?.name ?? 'U')}</AvatarFallback>
              </Avatar>
              <div className="hidden lg:block">
                <p className="text-sm font-medium leading-none">{user?.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{session?.role}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={logout}>
                Logout
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
    </div>
  )
}
