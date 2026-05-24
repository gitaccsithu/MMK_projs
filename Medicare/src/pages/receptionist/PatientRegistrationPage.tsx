import { useEffect, useMemo, useState } from 'react'
import AddCircleOutlinedIcon from '@mui/icons-material/AddCircleOutlined'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import EditIcon from '@mui/icons-material/Edit'
import PersonIcon from '@mui/icons-material/Person'
import SearchIcon from '@mui/icons-material/Search'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import IconButton from '@mui/material/IconButton'
import Skeleton from '@mui/material/Skeleton'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { alpha, useTheme } from '@mui/material/styles'
import { toast } from 'sonner'
import { AnimatedPage } from '@/components/shared/AnimatedPage'
import { PageHeader } from '@/components/shared/PageHeader'
import * as api from '@/services/mockApi'
import type { Patient, User } from '@/types'
import { generateId } from '@/utils/cn'

type Row = { patient: Patient; user: User | undefined }

async function hydrateRows(patients: Patient[]): Promise<Row[]> {
  return Promise.all(
    patients.map(async (patient) => {
      const user = await api.getUserById(patient.userId)
      return { patient, user }
    })
  )
}

export function PatientRegistrationPage() {
  const theme = useTheme()
  const [loading, setLoading] = useState(true)
  const [rows, setRows] = useState<Row[]>([])
  const [query, setQuery] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)

  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    phone: '',
    bloodType: 'O+',
  })
  const [editTarget, setEditTarget] = useState<Row | null>(null)
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    allergyNote: '',
  })

  async function refresh() {
    setLoading(true)
    const pts = await api.getPatients()
    const hydrated = await hydrateRows(pts)
    setRows(hydrated.sort((a, b) => (a.user?.name ?? '').localeCompare(b.user?.name ?? '')))
    setLoading(false)
  }

  useEffect(() => {
    void refresh()
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((r) => {
      const n = r.user?.name?.toLowerCase() ?? ''
      const e = r.user?.email?.toLowerCase() ?? ''
      return n.includes(q) || e.includes(q) || r.patient.id.toLowerCase().includes(q)
    })
  }, [query, rows])

  async function handleCreate() {
    if (!createForm.email || !createForm.name || !createForm.phone) {
      toast.error('Name, phone, and email are required.')
      return
    }
    const pwd = `MediCare_${generateId('pw').slice(-8)}`
    const res = await api.register({
      email: createForm.email,
      password: pwd,
      name: createForm.name,
      phone: createForm.phone,
      role: 'patient',
    })
    if (res.error || !res.data) {
      toast.error(res.error ?? 'Unable to save patient.')
      return
    }
    const newUser = res.data
    const patientProfile = await api.getPatientByUserId(newUser.id)
    if (patientProfile) {
      await api.updatePatient(patientProfile.id, {
        bloodType: createForm.bloodType || patientProfile.bloodType,
      })
    }
    toast.success(`Patient created. Demo portal password emailed (mock): ${pwd}`)
    setCreateOpen(false)
    setCreateForm({ name: '', email: '', phone: '', bloodType: 'O+' })
    await refresh()
  }

  function beginEdit(row: Row) {
    setEditTarget(row)
    const allergies = row.patient.allergies?.join(', ') ?? ''
    setEditForm({
      name: row.user?.name ?? '',
      phone: row.user?.phone ?? '',
      allergyNote: allergies,
    })
    setEditOpen(true)
  }

  async function handleSaveEdit() {
    if (!editTarget?.user || !editTarget.patient) {
      toast.error('Missing profile context.')
      return
    }
    await api.updateUser(editTarget.user.id, {
      name: editForm.name,
      phone: editForm.phone,
    })
    const allergyList =
      editForm.allergyNote
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean) || ['None']
    await api.updatePatient(editTarget.patient.id, { allergies: allergyList })
    toast.success('Profile updated.')
    setEditOpen(false)
    await refresh()
  }

  return (
    <AnimatedPage>
      <PageHeader
        title="Patient roster"
        description="Search MediCare profiles, onboard walk-ins, and edit demographic & allergy cues."
      >
        <Button variant="contained" size="small" startIcon={<AddCircleOutlinedIcon />} onClick={() => setCreateOpen(true)}>
          New patient
        </Button>
      </PageHeader>

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Register patient</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField
            id="p-name"
            label="Full name"
            fullWidth
            margin="dense"
            value={createForm.name}
            onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
          />
          <TextField
            id="p-email"
            label="Email"
            type="email"
            placeholder="name@workspace.com"
            fullWidth
            margin="dense"
            value={createForm.email}
            onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
          />
          <TextField
            id="p-phone"
            label="Phone"
            fullWidth
            margin="dense"
            value={createForm.phone}
            onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
          />
          <TextField
            id="p-blood"
            label="Blood type"
            fullWidth
            margin="dense"
            value={createForm.bloodType}
            onChange={(e) => setCreateForm({ ...createForm, bloodType: e.target.value })}
          />
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              display: 'block',
              bgcolor: (t) => alpha(t.palette.action.hover, 0.55),
              px: 1.5,
              py: 1,
              borderRadius: 1,
            }}
          >
            MediCare generates a provisional password automatically (demo-safe). Invite is logged to the kiosk console.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button variant="outlined" onClick={() => setCreateOpen(false)}>
            Cancel
          </Button>
          <Button variant="contained" onClick={() => void handleCreate()}>
            Save profile
          </Button>
        </DialogActions>
      </Dialog>

      <Box
        sx={{
          position: 'relative',
          mx: 'auto',
          mb: 3,
          maxWidth: 544,
          borderRadius: 999,
          border: '1px solid',
          borderColor: alpha(theme.palette.primary.main, 0.35),
          bgcolor: (t) => alpha(t.palette.action.hover, 0.45),
          px: 1,
          py: 0.5,
          pr: { xs: 1, sm: 4 },
          boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.06)',
        }}
      >
        <SearchIcon
          sx={{
            pointerEvents: 'none',
            position: 'absolute',
            left: 20,
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: 22,
            color: 'primary.main',
          }}
          aria-hidden
        />
        <TextField
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name, MediCare handle, email…"
          variant="standard"
          fullWidth
          slotProps={{
            htmlInput: { 'aria-label': 'Search patients' },
          }}
          sx={{
            pl: 5,
            pr: { sm: 4 },
            '& .MuiInput-root': {
              '&:before': { borderBottom: 'none' },
              '&:after': { borderBottom: 'none' },
              '&:hover:not(.Mui-disabled):before': { borderBottom: 'none' },
            },
            '& .MuiInputBase-input': { py: 1.25 },
          }}
        />
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            pointerEvents: 'none',
            position: 'absolute',
            right: 24,
            top: '50%',
            transform: 'translateY(-50%)',
            textTransform: 'uppercase',
            display: { xs: 'none', sm: 'block' },
          }}
        >
          <Box component="kbd" sx={{ px: 0.5, border: '1px solid', borderColor: 'divider', borderRadius: 0.5 }}>
            ⌘ K
          </Box>
        </Typography>
      </Box>

      <Box
        sx={{
          overflow: 'hidden',
          borderRadius: 2,
          border: '1px solid',
          borderColor: alpha(theme.palette.primary.dark, 0.28),
          bgcolor: 'background.paper',
          boxShadow: 1,
        }}
      >
        {loading ? (
          <Box sx={{ px: 3, py: 2 }}>
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} variant="rounded" sx={{ my: 1.5, height: 64 }} />
            ))}
          </Box>
        ) : (
          <Box sx={{ maxHeight: 'min(70vh, 720px)', overflow: 'auto' }}>
            <Table size="medium" sx={{ captionSide: 'top' }}>
              <caption style={{ captionSide: 'top', position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0,0,0,0)', border: 0 }}>
                Patient roster
              </caption>
              <TableHead>
                <TableRow
                  sx={{
                    bgcolor: (t) =>
                      alpha(t.palette.primary.main, t.palette.mode === 'dark' ? 0.35 : 0.12),
                    '& th': {
                      fontWeight: 600,
                      fontSize: 11,
                      textTransform: 'uppercase',
                      letterSpacing: '0.2em',
                      color: theme.palette.mode === 'dark' ? 'primary.light' : 'primary.dark',
                    },
                  }}
                >
                  <TableCell>Patient</TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Contact</TableCell>
                  <TableCell sx={{ display: { xs: 'none', xl: 'table-cell' }, maxWidth: 256 }}>
                    Allergies
                  </TableCell>
                  <TableCell align="right">Manage</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((row) => (
                  <TableRow key={row.patient.id} sx={{ borderTop: '1px solid', borderColor: alpha(theme.palette.primary.main, 0.25), verticalAlign: 'middle' }}>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 2 }}>
                        <Box
                          sx={{
                            width: 48,
                            height: 48,
                            borderRadius: 2,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: theme.palette.mode === 'dark'
                              ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.35)}, ${alpha(theme.palette.secondary.main, 0.35)})`
                              : `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.6)}, ${alpha('#26A69A', 0.4)})`,
                          }}
                        >
                          <PersonIcon sx={{ fontSize: 34, color: theme.palette.mode === 'dark' ? 'primary.light' : 'primary.dark' }} aria-hidden />
                        </Box>
                        <Box sx={{ minWidth: 0 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography sx={{ fontWeight: 600 }} noWrap>
                              {row.user?.name ?? 'Unlinked chart'}
                            </Typography>
                            <IconButton size="small" aria-expanded={false} title="Peek chart" sx={{ color: 'text.secondary' }}>
                              <ChevronRightIcon sx={{ display: 'none', fontSize: 18 }} />
                            </IconButton>
                          </Box>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            Patient ID · {row.patient.id}
                          </Typography>
                          <BadgeLike label={row.patient.bloodType ?? '—'} />
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                      <Typography variant="body2">{row.user?.email}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {row.user?.phone}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ display: { xs: 'none', xl: 'table-cell' }, verticalAlign: 'top' }}>
                      <Typography variant="body2">{(row.patient.allergies ?? []).join(', ') || 'None recorded'}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Button size="small" variant="outlined" startIcon={<EditIcon sx={{ fontSize: 14 }} />} onClick={() => beginEdit(row)}>
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filtered.length === 0 && (
              <Box sx={{ px: 5, py: 8, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Nothing matches &quot;{query}&quot;. Invite a caregiver or widen your search keywords.
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </Box>

      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Update demographics</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField id="e-name" label="Name" fullWidth margin="dense" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
          <TextField id="e-phone" label="Phone" fullWidth margin="dense" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
          <TextField
            id="e-allerg"
            label="Allergies (comma-separated)"
            fullWidth
            margin="dense"
            value={editForm.allergyNote}
            onChange={(e) => setEditForm({ ...editForm, allergyNote: e.target.value })}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button variant="outlined" onClick={() => setEditOpen(false)}>
            Cancel
          </Button>
          <Button variant="contained" onClick={() => void handleSaveEdit()}>
            Sync chart
          </Button>
        </DialogActions>
      </Dialog>
    </AnimatedPage>
  )
}

function BadgeLike({ label }: { label: string }) {
  return (
    <Chip
      label={label}
      size="small"
      sx={{
        mt: 0.5,
        width: 'fit-content',
        fontWeight: 600,
        fontSize: 11,
        bgcolor: (t) => alpha(t.palette.primary.main, t.palette.mode === 'dark' ? 0.45 : 0.15),
        color: (t) => (t.palette.mode === 'dark' ? 'primary.light' : 'primary.dark'),
      }}
    />
  )
}
