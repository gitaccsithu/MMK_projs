import { useEffect, useMemo, useState } from 'react'
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Skeleton from '@mui/material/Skeleton'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { AnimatedPage } from '@/components/shared/AnimatedPage'
import { PageHeader } from '@/components/shared/PageHeader'
import * as api from '@/services/mockApi'
import type { User, UserRole } from '@/types'
import { toast } from 'sonner'

const ROLE_CHIP_SX: Partial<Record<UserRole, Record<string, unknown>>> = {
  patient: {
    bgcolor: 'success.light',
    color: 'success.dark',
  },
  doctor: {
    bgcolor: 'info.light',
    color: 'info.dark',
  },
}

export function AdminUsersPage() {
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<User[]>([])
  const [query, setQuery] = useState('')

  useEffect(() => {
    async function bootstrap() {
      setLoading(true)
      const everybody = await api.getUsers()
      setUsers([...everybody].sort((a, b) => a.name.localeCompare(b.name)))
      setLoading(false)
    }
    void bootstrap()
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return users
    return users.filter((u) => `${u.name} ${u.email} ${u.role}`.toLowerCase().includes(q))
  }, [query, users])

  async function quickToggle(role: UserRole, selected: User) {
    await api.updateUser(selected.id, { role })
    toast.success(`${selected.email} rerouted to ${role}`)
    const next = await api.getUsers()
    setUsers([...next].sort((a, b) => a.name.localeCompare(b.name)))
  }

  return (
    <AnimatedPage>
      <PageHeader
        title="Identity registry"
        description="Audited roles for kiosk gating · sandbox writes stay local-first."
      />
      <Card variant="outlined" sx={(theme) => ({ mb: 5, overflow: 'hidden', borderColor: `${theme.palette.primary.dark}26` })}>
        <CardHeader
          title={
            <Stack direction="row" alignItems="center" spacing={1}>
              <VerifiedUserIcon aria-hidden fontSize="small" />
              <Typography variant="h6" component="span">
                Global directory
              </Typography>
            </Stack>
          }
          subheader={`Searching ${users.length} identities`}
        />
        <CardContent>
          <Box sx={{ maxWidth: 480, mb: 4 }}>
            <TextField
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              label="Filter users"
              placeholder="Keyword across name · email · role"
              fullWidth
              inputProps={{ 'aria-label': 'Filter users' }}
            />
          </Box>

          <TableContainer
            sx={{
              borderRadius: 2,
              border: 1,
              borderColor: 'divider',
            }}
          >
            <Table size="medium">
              <TableHead>
                <TableRow sx={(theme) => ({ bgcolor: theme.palette.success.main, '& .MuiTableCell-head': { color: theme.palette.success.contrastText, fontWeight: 600 } })}>
                  <TableCell>User</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading &&
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={4}>
                        <Skeleton variant="rounded" sx={{ height: 48 }} />
                      </TableCell>
                    </TableRow>
                  ))}
                {!loading &&
                  filtered.slice(0, 80).map((userRow) => (
                    <TableRow key={userRow.id} sx={{ '&:hover': { bgcolor: 'action.hover' }, borderTop: 1, borderColor: 'divider' }}>
                      <TableCell sx={{ verticalAlign: 'middle' }}>
                        <Typography fontWeight={600}>{userRow.name}</Typography>
                        <Typography variant="caption" sx={{ textTransform: 'uppercase', letterSpacing: '0.06em' }} color="text.secondary">
                          {userRow.id.slice(0, 10)}…
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ color: 'text.secondary', verticalAlign: 'middle' }}>{userRow.email}</TableCell>
                      <TableCell sx={{ verticalAlign: 'middle' }}>
                        <Chip
                          label={userRow.role}
                          size="small"
                          sx={{ border: 'none', ...(ROLE_CHIP_SX[userRow.role] ?? { bgcolor: 'action.selected' }) }}
                        />
                      </TableCell>
                      <TableCell align="right" sx={{ verticalAlign: 'middle' }}>
                        <RoleDialog
                          userRecord={userRow}
                          onPick={async (role) => {
                            await quickToggle(role, userRow)
                          }}
                        >
                          Adjust role
                        </RoleDialog>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
      {!loading && filtered.length === 0 && (
        <Typography align="center" variant="body2" color="text.secondary">
          No matches · broaden query.
        </Typography>
      )}
    </AnimatedPage>
  )
}

function RoleDialog({
  userRecord,
  onPick,
  children,
}: {
  userRecord: User
  onPick: (role: UserRole) => Promise<void>
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button variant="outlined" size="small" onClick={() => setOpen(true)}>
        {children}
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Route {userRecord.name}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            New role
          </Typography>
          <RolePicker selected={userRecord.role} onPick={onPick} />
        </DialogContent>
      </Dialog>
    </>
  )
}

function RolePicker({
  selected,
  onPick,
}: {
  selected: UserRole
  onPick: (role: UserRole) => Promise<void>
}) {
  const choices: UserRole[] = ['patient', 'doctor', 'receptionist', 'admin']
  const [busy, setBusy] = useState(false)

  async function pick(role: UserRole) {
    if (role === selected) return
    setBusy(true)
    await onPick(role)
    setBusy(false)
  }

  return (
    <Stack spacing={1}>
      {choices.map((role) => (
        <Button
          key={role}
          type="button"
          variant={role === selected ? 'contained' : 'outlined'}
          disabled={busy}
          onClick={() => void pick(role)}
          startIcon={busy ? <CircularProgress size={16} color="inherit" /> : undefined}
        >
          {role}
        </Button>
      ))}
    </Stack>
  )
}
