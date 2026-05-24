import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import TextField from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemText from '@mui/material/ListItemText'
import SearchIcon from '@mui/icons-material/Search'
import { useDebounce } from '@/hooks/useDebounce'
import * as api from '@/services/mockApi'

export function GlobalSearch({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [query, setQuery] = useState('')
  const [doctors, setDoctors] = useState<Awaited<ReturnType<typeof api.searchDoctors>>>([])
  const debounced = useDebounce(query, 300)
  const navigate = useNavigate()

  useEffect(() => {
    if (!debounced) {
      setDoctors([])
      return
    }
    api.searchDoctors({ search: debounced }).then(setDoctors)
  }, [debounced])

  return (
    <Dialog open={open} onClose={() => onOpenChange(false)} maxWidth="sm" fullWidth>
      <DialogTitle>Search doctors & records</DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          placeholder="Search..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
          sx={{ mb: 2 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
        />
        <List sx={{ maxHeight: 280, overflow: 'auto' }}>
          {doctors.map((d) => (
            <ListItemButton
              key={d.id}
              onClick={() => {
                navigate('/patient/appointments/book')
                onOpenChange(false)
              }}
            >
              <ListItemText
                primary={d.specialty}
                secondary={`${d.bio.slice(0, 60)}...`}
              />
            </ListItemButton>
          ))}
        </List>
      </DialogContent>
    </Dialog>
  )
}
