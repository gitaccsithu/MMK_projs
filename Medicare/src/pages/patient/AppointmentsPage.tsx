import { useEffect, useMemo, useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { format, parseISO } from 'date-fns'
import EventAvailableIcon from '@mui/icons-material/EventAvailable'
import PlaceIcon from '@mui/icons-material/Place'
import VideocamIcon from '@mui/icons-material/Videocam'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Chip from '@mui/material/Chip'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Skeleton from '@mui/material/Skeleton'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { toast } from 'sonner'
import * as api from '@/services/mockApi'
import type { Appointment } from '@/types'
import { useAuthStore } from '@/store'
import { AnimatedCard, AnimatedPage } from '@/components/shared/AnimatedPage'
import { EmptyState } from '@/components/shared/EmptyState'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'

function patchAppointment(id: string, updates: Partial<Appointment>) {
  const data = api.getAppDataSync()
  const idx = data.appointments.findIndex((a) => a.id === id)
  if (idx === -1) return false
  data.appointments[idx] = { ...data.appointments[idx], ...updates, updatedAt: new Date().toISOString() }
  api.saveAppDataSync(data)
  return true
}

export function AppointmentsPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const [rows, setRows] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [doctorNames, setDoctorNames] = useState<Record<string, string>>({})

  const load = useCallback(async () => {
    if (!user?.id) {
      setRows([])
      setLoading(false)
      return
    }
    setLoading(true)
    const appts = await api.getAppointments(user.id, 'patient')
    appts.sort((a, b) => parseISO(b.scheduledAt).getTime() - parseISO(a.scheduledAt).getTime())
    setRows(appts)
    const uniq = [...new Set(appts.map((a) => a.doctorId))]
    const mapped: Record<string, string> = {}
    await Promise.all(
      uniq.map(async (doctorId) => {
        const d = await api.getDoctorById(doctorId)
        const u = d ? await api.getUserById(d.userId) : undefined
        mapped[doctorId] = u?.name ?? 'Clinician'
      })
    )
    setDoctorNames(mapped)
    setLoading(false)
  }, [user?.id])

  useEffect(() => {
    void load()
  }, [load])

  const telehealthEligible = useMemo(() => rows.filter((a) => a.mode === 'online' && a.status !== 'cancelled'), [rows])

  const cancelFlow = async (id: string) => {
    const res = await api.cancelAppointment(id)
    if (res.error) {
      toast.error(res.error)
      return
    }
    toast.success('Appointment cancelled')
    void load()
  }

  const applyReschedule = (id: string, isoLocal: string) => {
    const next = new Date(isoLocal)
    if (Number.isNaN(next.getTime())) {
      toast.error('Pick a valid time')
      return
    }
    const ok = patchAppointment(id, { scheduledAt: next.toISOString(), status: 'confirmed' })
    if (!ok) toast.error('Could not reschedule')
    else toast.success('Time updated locally')
    void load()
  }

  return (
    <AnimatedPage>
      <Stack spacing={3}>
        <PageHeader title="Appointments" description="Everything scheduled under your MediCare+ profile.">
          <Button variant="contained" component={Link} to="/patient/appointments/book">
            Book appointment
          </Button>
        </PageHeader>

        {loading && [...Array(4)].map((_, i) => <Skeleton key={i} variant="rectangular" height={128} sx={{ borderRadius: 2 }} />)}

        {!loading && rows.length === 0 && (
          <AnimatedCard>
            <EmptyState
              title="No appointments yet"
              description="Kick off intake or book a clinician when you're ready."
              action={{ label: 'Book visit', onClick: () => navigate('/patient/appointments/book') }}
            />
          </AnimatedCard>
        )}

        {!loading &&
          rows.map((a) => (
            <AnimatedCard key={a.id}>
              <Card id={a.id} variant="outlined" sx={{ borderColor: 'rgba(6, 78, 59, 0.15)', boxShadow: 1, scrollMarginTop: 112 }}>
                <CardHeader
                  sx={{ pb: 1 }}
                  title={
                    <Typography variant="h6" component="div">
                      {format(parseISO(a.scheduledAt), 'EEE, MMM d · h:mm a')}
                    </Typography>
                  }
                  subheader={
                    <>
                      <Typography sx={{ mt: 0.5 }} color="text.secondary">
                        {a.reason}
                      </Typography>
                      <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        <Chip
                          size="small"
                          icon={a.mode === 'online' ? <VideocamIcon sx={{ fontSize: '16px !important' }} /> : <PlaceIcon sx={{ fontSize: '16px !important' }} />}
                          label={a.mode === 'online' ? 'Teleconsult' : 'Clinic visit'}
                          sx={{ bgcolor: 'action.hover' }}
                        />
                        <Chip
                          size="small"
                          icon={<EventAvailableIcon sx={{ fontSize: '16px !important' }} />}
                          label={`Duration ${a.duration} min · ${doctorNames[a.doctorId]}`}
                          sx={{ bgcolor: 'action.hover' }}
                        />
                      </Box>
                    </>
                  }
                  action={
                    <Stack
                      spacing={1}
                      sx={{
                        alignItems: { xs: 'stretch', sm: 'flex-end' },
                        mt: { xs: 2, sm: 0 },
                        width: { xs: '100%', sm: 'auto' },
                      }}
                    >
                      <Box sx={{ alignSelf: { xs: 'flex-start', sm: 'flex-end' } }}>
                        <StatusBadge status={a.status} />
                      </Box>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: { xs: 'flex-start', sm: 'flex-end' } }}>
                        {a.mode === 'online' && a.status !== 'cancelled' && a.status !== 'completed' && (
                          <Button size="small" variant="outlined" color="success" component={Link} to={`/patient/teleconsultation/${a.id}`}>
                            Teleconsult lobby
                          </Button>
                        )}
                        {a.status !== 'cancelled' && a.status !== 'completed' && (
                          <RescheduleDialog onApply={(iso) => applyReschedule(a.id, iso)} />
                        )}
                        {['pending', 'confirmed', 'waiting'].includes(a.status) && (
                          <Button size="small" color="error" onClick={() => void cancelFlow(a.id)}>
                            Cancel
                          </Button>
                        )}
                      </Box>
                    </Stack>
                  }
                />
                <CardContent sx={{ pt: 0 }}>
                  {telehealthEligible.includes(a) && (
                    <Chip variant="outlined" size="small" label="Low-latency video lane unlocked" color="success" />
                  )}
                </CardContent>
              </Card>
            </AnimatedCard>
          ))}
      </Stack>
    </AnimatedPage>
  )
}

function RescheduleDialog({ onApply }: { onApply: (isoLocal: string) => void }) {
  const defaultValue = toLocalDatetimeValue(new Date())
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState(defaultValue)

  return (
    <>
      <Button size="small" variant="contained" color="secondary" onClick={() => setOpen(true)}>
        Reschedule
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Pick a fresh slot</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <TextField
            margin="dense"
            fullWidth
            id="rdt"
            label="Datetime"
            type="datetime-local"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            sx={{ mt: 1 }}
            slotProps={{
              inputLabel: { shrink: true },
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              onApply(value)
              setOpen(false)
            }}
          >
            Save locally
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

function toLocalDatetimeValue(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
