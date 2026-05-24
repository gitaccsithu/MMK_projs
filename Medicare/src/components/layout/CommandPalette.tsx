import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import TextField from '@mui/material/TextField'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Typography from '@mui/material/Typography'
import { useAuthStore } from '@/store'
import { getNavForRole } from '@/routes/roleRoutes'

export function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const navigate = useNavigate()
  const { session } = useAuthStore()
  const nav = session ? getNavForRole(session.role) : []
  const [filter, setFilter] = useState('')

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

  const filtered = nav.filter((item) =>
    item.title.toLowerCase().includes(filter.toLowerCase())
  )

  return (
    <Dialog open={open} onClose={() => onOpenChange(false)} maxWidth="sm" fullWidth>
      <DialogTitle>Command Menu</DialogTitle>
      <TextField
        fullWidth
        autoFocus
        placeholder="Search pages..."
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        sx={{ px: 3, pb: 1 }}
      />
      <List sx={{ px: 2, pb: 2, maxHeight: 320, overflow: 'auto' }}>
        {filtered.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
            No results.
          </Typography>
        ) : (
          filtered.map((item) => {
            const Icon = item.icon
            return (
              <ListItemButton
                key={item.href}
                onClick={() => {
                  navigate(item.href)
                  onOpenChange(false)
                  setFilter('')
                }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <Icon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary={item.title} />
              </ListItemButton>
            )
          })
        )}
      </List>
    </Dialog>
  )
}
