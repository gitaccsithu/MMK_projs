import { Link } from 'react-router-dom'
import { Zap } from 'lucide-react'
import { cn } from '@/utils/cn'

type PublicVariant = 'default' | 'wide' | 'full'

export function PublicLayout({
  children,
  variant = 'default',
}: {
  children: React.ReactNode
  variant?: PublicVariant
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/60 backdrop-blur-md">
        <div
          className={cn(
            'mx-auto flex h-16 items-center justify-between px-4',
            variant === 'full' ? 'max-w-none' : 'max-w-6xl'
          )}
        >
          <Link to="/" className="flex items-center gap-2 font-bold text-lg tracking-tight">
            <Zap className="h-6 w-6 text-primary" aria-hidden />
            ServiceHub
          </Link>
          <nav className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            <Link to="/help" className="text-muted-foreground hover:text-foreground transition-colors">
              Help
            </Link>
            <Link to="/faq" className="text-muted-foreground hover:text-foreground transition-colors">
              FAQ
            </Link>
            <Link to="/terms" className="text-muted-foreground hover:text-foreground transition-colors">
              Terms
            </Link>
            <Link to="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">
              Privacy
            </Link>
            <Link
              to="/login"
              className="rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
            >
              Login
            </Link>
          </nav>
        </div>
      </header>
      <main
        className={cn(
          'mx-auto px-4 py-8',
          variant === 'full' && 'max-w-none py-0',
          variant === 'wide' && 'max-w-6xl',
          variant === 'default' && 'max-w-5xl'
        )}
      >
        {children}
      </main>
    </div>
  )
}
