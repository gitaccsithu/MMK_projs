import { AnimatedPage } from '@/components/shared/AnimatedPage'
import { EmptyState } from '@/components/shared/EmptyState'
import { PageHeader } from '@/components/shared/PageHeader'
import type { Appointment, AppointmentStatus } from '@/types'
import { APPOINTMENT_STATUS_LABELS } from '@/types'
import * as api from '@/services/mockApi'
import { useAuthStore } from '@/store/index'
import { format } from 'date-fns'
import { useDoctorWorkspace } from '@/pages/doctor/useDoctorWorkspace'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import RefreshIcon from '@mui/icons-material/Refresh'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Chip from '@mui/material/Chip'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

const STATUSES_ORDER: AppointmentStatus[] = ['pending', 'confirmed', 'waiting', 'in_consultation', 'completed', 'cancelled']

/** Appointments inbox with triage controls and reschedule (mock ledger). */
export function DoctorAppointmentsPage() {
  const userId = useAuthStore((s) => s.session?.userId)
  const { doctor, loading: wsLoad } = useDoctorWorkspace(userId)
  const [busy, setBusy] = useState(false)
  const [rows, setRows] = useState<Appointment[]>([])
  const [reschedule, setReschedule] = useState<Appointment | null>(null)

  const load = useCallback(async () => {
    if (!userId) return
    setBusy(true)
    try {
      const next = await api.getAppointments(userId, 'doctor')
      next.sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
      setRows(next)
    } finally {
      setBusy(false)
    }
  }, [userId])

  useEffect(() => {
    void load()
  }, [load, doctor])

  const changeStatus = async (id: string, status: AppointmentStatus) => {
    setBusy(true)
    const result = await api.updateAppointmentStatus(id, status)
    setBusy(false)
    if (result.error) toast.error(result.error)
    else {
      toast.success('Visit status updated.')
      await load()
    }
  }

  const acceptPending = async (id: string) => changeStatus(id, 'confirmed')
  const rejectPending = async (id: string) => changeStatus(id, 'cancelled')

  const applyReschedule = async () => {
    if (!reschedule) return
    setBusy(true)
    const result = await api.updateAppointment(reschedule.id, {
      scheduledAt: new Date(`${rescheduleScheduledDate}T${rescheduleScheduledTime}:00`).toISOString(),
    })
    setBusy(false)
    if (result.error) toast.error(result.error)
    else {
      toast.success('Appointment rescheduled.')
      setReschedule(null)
      await load()
    }
  }

  const [rescheduleScheduledDate, setRescheduleScheduledDate] = useState('')
  const [rescheduleScheduledTime, setRescheduleScheduledTime] = useState('09:00')

  useEffect(() => {
    if (!reschedule) return
    const d = new Date(reschedule.scheduledAt)
    setRescheduleScheduledDate(format(d, 'yyyy-MM-dd'))
    setRescheduleScheduledTime(format(d, 'HH:mm'))
  }, [reschedule])

  const statLine = useMemo(() => `${rows.filter((r) => r.status === 'pending').length} pending · ${rows.length} tracked`, [rows])

  if (!wsLoad && doctor === null) {
    return (
      <AnimatedPage>
        <EmptyState title="No clinician workspace" description="Profile missing for authenticated user." />
      </AnimatedPage>
    )
  }

  return (
    <AnimatedPage>
      <PageHeader title="Appointments" description="Accept, reschedule, or update visit states with practice-grade controls." />
      <Card variant="outlined" sx={{ borderColor: 'success.light' }}>
        <CardHeader
          title="Active calendar"
          subheader={statLine}
          titleTypographyProps={{ variant: 'h6' }}
          action={
            <Button variant="outlined" size="small" startIcon={<RefreshIcon sx={{ animation: busy ? 'spin 1s linear infinite' : undefined, '@keyframes spin': { to: { transform: 'rotate(360deg)' } } }} />} onClick={() => void load()} disabled={busy}>
              Sync
            </Button>
          }
        />
        <CardContent sx={{ p: 0 }}>
          <TableContainer sx={{ maxHeight: 'min(70vh, 720px)' }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, bgcolor: 'success.light', textTransform: 'uppercase', letterSpacing: 1.2 }}>
                    When
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, bgcolor: 'success.light', textTransform: 'uppercase', letterSpacing: 1.2 }}>
                    Reason
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, bgcolor: 'success.light', textTransform: 'uppercase', letterSpacing: 1.2 }}>
                    Mode
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, bgcolor: 'success.light', textTransform: 'uppercase', letterSpacing: 1.2 }}>
                    Status
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, bgcolor: 'success.light', textTransform: 'uppercase', letterSpacing: 1.2 }}>
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((a) => (
                  <TableRow key={a.id} hover>
                    <TableCell sx={{ fontWeight: 600, verticalAlign: 'top' }}>
                      {format(new Date(a.scheduledAt), 'MMM d, yyyy · p')}
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        ID {a.id}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ verticalAlign: 'top' }}>{a.reason}</TableCell>
                    <TableCell sx={{ verticalAlign: 'top' }}>
                      <Chip label={a.mode} size="small" variant="outlined" color="secondary" />
                    </TableCell>
                    <TableCell sx={{ verticalAlign: 'top' }}>
                      <FormControl size="small" sx={{ minWidth: 160 }}>
                        <InputLabel id={`status-${a.id}`}>Status</InputLabel>
                        <Select
                          labelId={`status-${a.id}`}
                          label="Status"
                          value={a.status}
                          onChange={(e) => void changeStatus(a.id, e.target.value as AppointmentStatus)}
                        >
                          {STATUSES_ORDER.map((s) => (
                            <MenuItem key={s} value={s}>
                              {APPOINTMENT_STATUS_LABELS[s]}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </TableCell>
                    <TableCell align="right" sx={{ verticalAlign: 'top' }}>
                      <Stack
                        direction="row"
                        spacing={1}
                        useFlexGap
                        sx={{ flexWrap: 'wrap', justifyContent: 'flex-end' }}
                      >
                        {a.status === 'pending' && (
                          <>
                            <Button size="small" variant="contained" onClick={() => void acceptPending(a.id)} disabled={busy}>
                              Accept
                            </Button>
                            <Button size="small" variant="outlined" onClick={() => void rejectPending(a.id)} disabled={busy}>
                              Reject
                            </Button>
                          </>
                        )}
                        <Button size="small" variant="contained" color="secondary" startIcon={<CalendarMonthIcon />} onClick={() => setReschedule(a)} disabled={busy}>
                          Reschedule
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Dialog open={!!reschedule} onClose={() => setReschedule(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Reschedule visit</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Adjust the slot and sync with your operating hours (mock API).
          </Typography>
          <Stack spacing={2}>
            <TextField
              label="Date"
              type="date"
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
              value={rescheduleScheduledDate}
              onChange={(e) => setRescheduleScheduledDate(e.target.value)}
            />
            <TextField
              label="Time"
              type="time"
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
              value={rescheduleScheduledTime}
              onChange={(e) => setRescheduleScheduledTime(e.target.value)}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReschedule(null)}>Cancel</Button>
          <Button variant="contained" onClick={() => void applyReschedule()} disabled={busy}>
            Save slot
          </Button>
        </DialogActions>
      </Dialog>
    </AnimatedPage>
  )
}
