import { useEffect, useMemo, useState } from 'react'
import AccountBalanceIcon from '@mui/icons-material/AccountBalance'
import AddIcon from '@mui/icons-material/Add'
import BusinessIcon from '@mui/icons-material/Business'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import Skeleton from '@mui/material/Skeleton'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { toast } from 'sonner'
import { AnimatedPage } from '@/components/shared/AnimatedPage'
import { PageHeader } from '@/components/shared/PageHeader'
import * as api from '@/services/mockApi'
import type { Clinic, Department } from '@/types'

export function ClinicManagementPage() {
  const [loading, setLoading] = useState(true)
  const [clinics, setClinics] = useState<Clinic[]>([])
  const [deps, setDeps] = useState<Department[]>([])
  const [clinicForm, setClinicForm] = useState<Omit<Clinic, 'id'>>({
    name: '',
    address: '',
    phone: '',
    email: '',
    departments: [],
    isActive: true,
  })
  const [deptForm, setDeptForm] = useState({ clinicId: '', name: '', description: '' })

  async function refresh() {
    setLoading(true)
    const [c, d] = await Promise.all([api.getClinics(), api.getDepartments()])
    setClinics(c)
    setDeps(d)
    if (!deptForm.clinicId && c[0]) setDeptForm((f) => ({ ...f, clinicId: c[0].id }))
    setLoading(false)
  }

  useEffect(() => {
    void refresh()
  }, [])

  const deptByClinic = useMemo(() => {
    return clinics.map((clinic) => ({
      clinic,
      departments: deps.filter((dep) => dep.clinicId === clinic.id),
    }))
  }, [clinics, deps])

  async function createClinic() {
    const res = await api.createClinic(clinicForm)
    if (res.error) toast.error(res.error)
    else toast.success('Clinic anchored')
    setClinicForm({ name: '', address: '', phone: '', email: '', departments: [], isActive: true })
    await refresh()
  }

  async function updateClinic(record: Clinic) {
    await api.updateClinic(record.id, record)
    toast.success(`${record.name} updated`)
    await refresh()
  }

  async function removeClinic(id: string) {
    const confirmDelete = window.confirm('Remove clinic and linked departments from sandbox records?')
    if (!confirmDelete) return
    await api.deleteClinic(id)
    toast.success('Clinic dissolved (demo)')
    await refresh()
  }

  async function addDepartment() {
    if (!deptForm.name || !deptForm.clinicId) return
    await api.createDepartment({
      clinicId: deptForm.clinicId,
      name: deptForm.name,
      description: deptForm.description || 'Operational unit',
    })
    toast.success('Department routed')
    setDeptForm({ clinicId: deptForm.clinicId, name: '', description: '' })
    await refresh()
  }

  async function mutateDepartment(dep: Partial<Department> & Pick<Department, 'id'>) {
    await api.updateDepartment(dep.id, dep)
    toast.success('Department refined')
    await refresh()
  }

  async function removeDepartment(id: string) {
    await api.deleteDepartment(id)
    toast.message('Department retired (sandbox)')
    await refresh()
  }

  return (
    <AnimatedPage>
      <PageHeader
        title="Clinic taxonomy"
        description="Anchor facilities, carve departments per market, synchronize phone trees with concierge tooling."
      />
      <Card variant="outlined" sx={(theme) => ({ mb: 5, borderColor: `${theme.palette.primary.dark}26` })}>
        <CardHeader
          title={
            <Stack direction="row" alignItems="center" spacing={1}>
              <BusinessIcon sx={{ color: 'primary.main' }} fontSize="medium" />
              <Typography variant="h6" component="span">
                Provision facility
              </Typography>
            </Stack>
          }
          subheader="Creates an operating location + telephony handles for kiosk routing."
        />
        <CardContent>
          <Box
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: { xs: '1fr', lg: 'repeat(5, minmax(0, 1fr))' },
            }}
          >
            <Box sx={{ gridColumn: { lg: 'span 2' } }}>
              <TextField label="Name" fullWidth value={clinicForm.name} onChange={(e) => setClinicForm({ ...clinicForm, name: e.target.value })} />
            </Box>
            <Box sx={{ gridColumn: { lg: 'span 3' } }}>
              <TextField label="Street" fullWidth value={clinicForm.address} onChange={(e) => setClinicForm({ ...clinicForm, address: e.target.value })} />
            </Box>
            <Box sx={{ gridColumn: { lg: 'span 2' } }}>
              <TextField label="Phone" fullWidth value={clinicForm.phone} onChange={(e) => setClinicForm({ ...clinicForm, phone: e.target.value })} />
            </Box>
            <Box sx={{ gridColumn: { lg: 'span 3' } }}>
              <TextField label="Ingest email" fullWidth type="email" value={clinicForm.email} onChange={(e) => setClinicForm({ ...clinicForm, email: e.target.value })} />
            </Box>
            <Box sx={{ gridColumn: { lg: '1 / -1' } }}>
              <Button fullWidth variant="contained" startIcon={<AddIcon />} type="button" onClick={() => void createClinic()}>
                Save clinic blueprint
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Box
        sx={{
          display: 'grid',
          gap: 3,
          gridTemplateColumns: { xs: '1fr', xl: 'minmax(0, 1.05fr) minmax(0, 1fr)' },
        }}
      >
        <Card variant="outlined">
          <CardHeader title="Facility catalog" subheader="Operational toggles synced with appointment routing" />
          <CardContent>
            <Box sx={{ maxHeight: 'min(60vh, 640px)', overflow: 'auto', pr: 1 }}>
              {loading && [...Array(3)].map((_, i) => <Skeleton key={i} sx={{ mb: 2, height: 144 }} variant="rounded" />)}
              {!loading &&
                deptByClinic.map(({ clinic, departments }) => (
                  <Box key={clinic.id} sx={{ mb: 2.5, borderRadius: 2, border: 1, borderColor: 'divider', px: 2.5, py: 2 }}>
                    <Stack direction="row" flexWrap="wrap" spacing={2} alignItems="flex-start">
                      <Box sx={{ flex: '1 1 200px', minWidth: 0 }}>
                        <Typography variant="h6">{clinic.name}</Typography>
                        <Typography variant="caption" display="block" color="text.secondary">
                          {clinic.address}
                        </Typography>
                      </Box>
                      <FacilityEditLauncher clinic={clinic} onSave={(c) => void updateClinic(c)} />
                      <Button size="small" variant="text" color="error" aria-label="Remove clinic" onClick={() => void removeClinic(clinic.id)}>
                        <DeleteIcon fontSize="small" />
                      </Button>
                    </Stack>
                    <Box component="ul" sx={{ mt: 2, pl: 2, m: 0, listStylePosition: 'outside' }}>
                      <Typography component="li" variant="caption" color="text.secondary" sx={{ display: 'block', listStyle: 'none', ml: -2 }}>
                        {clinic.phone} · {clinic.email}
                      </Typography>
                      <Typography variant="caption" fontWeight={700} sx={{ letterSpacing: '0.25em', display: 'block', mt: 1, color: 'success.main', textTransform: 'uppercase' }}>
                        Programs
                      </Typography>
                      {departments.map((dep) => (
                        <Box
                          component="li"
                          key={dep.id}
                          sx={{
                            mt: 1,
                            display: 'flex',
                            flexWrap: 'wrap',
                            alignItems: 'center',
                            gap: 1,
                            borderRadius: 2,
                            border: 1,
                            borderColor: 'divider',
                            bgcolor: 'action.hover',
                            px: 1.5,
                            py: 1,
                            listStyle: 'none',
                            ml: -2,
                          }}
                        >
                          <Typography variant="body2" sx={{ flex: '1', minWidth: 120 }}>
                            {dep.name}
                          </Typography>
                          <Button size="small" variant="text" type="button" onClick={() => void removeDepartment(dep.id)}>
                            Remove unit
                          </Button>
                          <DepartmentEditLauncher dep={dep} onSave={(d) => void mutateDepartment(d)} />
                        </Box>
                      ))}
                    </Box>
                  </Box>
                ))}
            </Box>
          </CardContent>
        </Card>

        <Card
          variant="outlined"
          sx={(theme) => ({
            borderColor: `${theme.palette.primary.dark}26`,
            background: theme.palette.mode === 'dark' ? `linear-gradient(${theme.palette.primary.dark}40, transparent)` : `linear-gradient(${theme.palette.primary.light}55, transparent)`,
          })}
        >
          <CardHeader
            title={
              <Stack direction="row" spacing={2}>
                <AccountBalanceIcon sx={{ color: 'primary.main' }} fontSize="large" aria-hidden />
                <Box>
                  <Typography variant="h6">Embed department</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Associates clinician pods with payer contracts
                  </Typography>
                </Box>
              </Stack>
            }
          />
          <CardContent>
            <Stack spacing={2}>
              <FormControl fullWidth>
                <InputLabel id="clinic-select-label">Clinic</InputLabel>
                <Select
                  labelId="clinic-select-label"
                  label="Clinic"
                  value={deptForm.clinicId}
                  onChange={(e) => setDeptForm({ ...deptForm, clinicId: e.target.value })}
                >
                  <MenuItem value="">
                    <em>Select…</em>
                  </MenuItem>
                  {clinics.map((c) => (
                    <MenuItem key={c.id} value={c.id}>
                      {c.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField label="Department name" fullWidth value={deptForm.name} onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })} />
              <TextField label="Description" fullWidth value={deptForm.description} onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })} />
              <Button sx={{ mt: 1 }} variant="outlined" type="button" startIcon={<AddIcon />} onClick={() => void addDepartment()}>
                Stage department charter
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Box>
    </AnimatedPage>
  )
}

function FacilityEditLauncher({ clinic, onSave }: { clinic: Clinic; onSave: (c: Clinic) => void }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button size="small" variant="outlined" startIcon={<EditIcon />} onClick={() => setOpen(true)}>
        Edit clinic
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit {clinic.name}</DialogTitle>
        <FacilityEditor clinic={clinic} onSave={onSave} />
      </Dialog>
    </>
  )
}

function FacilityEditor({ clinic, onSave }: { clinic: Clinic; onSave: (c: Clinic) => void }) {
  const [form, setForm] = useState(clinic)

  useEffect(() => {
    setForm(clinic)
  }, [clinic])

  return (
    <>
      <DialogContent>
        <Stack spacing={2}>
          <TextField label="Name" fullWidth value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <TextField label="Address" fullWidth value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          <TextField label="Email" fullWidth type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button variant="contained" type="button" onClick={() => onSave(form)}>
          Save blueprint
        </Button>
      </DialogActions>
    </>
  )
}

function DepartmentEditLauncher({
  dep,
  onSave,
}: {
  dep: Department
  onSave: (d: Department) => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button size="small" variant="outlined" type="button" onClick={() => setOpen(true)}>
        Refine narrative
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
        <DepartmentEditor dep={dep} onSave={onSave} />
      </Dialog>
    </>
  )
}

function DepartmentEditor({ dep, onSave }: { dep: Department; onSave: (d: Department) => void }) {
  const [form, setForm] = useState(dep)
  useEffect(() => setForm(dep), [dep])

  return (
    <>
      <DialogTitle>Update {dep.name}</DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          <TextField label="Name" fullWidth value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <TextField label="Overview" fullWidth value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button variant="contained" type="button" onClick={() => onSave(form)}>
          Sync narrative
        </Button>
      </DialogActions>
    </>
  )
}
