import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from 'cmdk'
import { useAuthStore } from '@/store/authStore'
import { getNavForRole } from '@/routes/roleRoutes'

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const navigate = useNavigate()
  const { session } = useAuthStore()
  const nav = session ? getNavForRole(session.role) : []

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        onOpenChange(!open)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [open, onOpenChange])

  const run = (href: string) => {
    navigate(href)
    onOpenChange(false)
  }

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} label="Command Menu">
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Navigation">
          {nav.map((item) => (
            <CommandItem key={item.href} onSelect={() => run(item.href)}>
              <item.icon className="mr-2 h-4 w-4" />
              {item.title}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Quick Actions">
          <CommandItem onSelect={() => run(`/${session?.role}/settings`)}>Open Settings</CommandItem>
          <CommandItem onSelect={() => run('/help')}>Help Center</CommandItem>
          <CommandItem onSelect={() => run('/faq')}>FAQ</CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
