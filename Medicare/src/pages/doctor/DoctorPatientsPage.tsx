import { AnimatedPage } from '@/components/shared/AnimatedPage'
import { EmptyState } from '@/components/shared/EmptyState'
import { PageHeader } from '@/components/shared/PageHeader'
import type { Appointment, Consultation, Patient, Prescription, User } from '@/types'
import { APPOINTMENT_STATUS_LABELS } from '@/types'
import * as api from '@/services/mockApi'
import { useAuthStore } from '@/store/index'
import { format } from 'date-fns'
import { useDoctorWorkspace } from '@/pages/doctor/useDoctorWorkspace'
import HistoryIcon from '@mui/icons-material/History'
import InsightsIcon from '@mui/icons-material/Insights'
import PersonIcon from '@mui/icons-material/Person'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Chip from '@mui/material/Chip'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Stack from '@mui/material/Stack'
import Tab from '@mui/material/Tab'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Tabs from '@mui/material/Tabs'
import Typography from '@mui/material/Typography'
import { useCallback, useEffect, useMemo, useState } from 'react'

type EnrichedPatient = {
  patient: Patient
  user?: User
  lastVisit?: string
}

/** Directory of patients tied to this physician with longitudinal history preview. */
export function DoctorPatientsPage() {
  const userId = useAuthStore((s) => s.session?.userId)
  const { doctor, loading: wsLoad } = useDoctorWorkspace(userId)
  const [busy, setBusy] = useState(false)
  const [patients, setPatients] = useState<Patient[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [consultations, setConsultations] = useState<Consultation[]>([])
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [focusPatient, setFocusPatient] = useState<Patient | null>(null)
  const [historyTab, setHistoryTab] = useState<'appts' | 'consults' | 'scripts'>('appts')

  const hydrate = useCallback(async () => {
    if (!userId || !doctor) return
    setBusy(true)
    try {
      const [patt, usr, appt, consults, scripts] = await Promise.all([
        api.getPatients(),
        api.getUsers(),
        api.getAppointments(userId, 'doctor'),
        api.getConsultations(),
        api.getPrescriptions(undefined, doctor.id),
      ])
      setPatients(patt)
      setUsers(usr)
      setAppointments(appt)
      setConsultations(consults.filter((c) => c.doctorId === doctor.id))
      setPrescriptions(scripts)
    } finally {
      setBusy(false)
    }
  }, [userId, doctor])

  useEffect(() => {
    void hydrate()
  }, [hydrate])

  const enriched: EnrichedPatient[] = useMemo(() => {
    if (!doctor) return []
    const ids = new Set<string>()
    appointments.forEach((a) => ids.add(a.patientId))
    prescriptions.forEach((r) => ids.add(r.patientId))
    const mapped = [...ids].map((id) => {
      const patient = patients.find((p) => p.id === id)
      if (!patient) return undefined
      const user = users.find((u) => u.id === patient.userId)
      const lastAppt = appointments
        .filter((a) => a.patientId === id && a.doctorId === doctor.id)
        .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime())[0]
      return {
        patient,
        user,
        lastVisit: lastAppt?.scheduledAt,
      } satisfies EnrichedPatient
    })
    return mapped.filter(Boolean) as EnrichedPatient[]
  }, [doctor, appointments, prescriptions, patients, users])

  if (!wsLoad && doctor === null) {
    return (
      <AnimatedPage>
        <EmptyState title="Patient registry unavailable" description="Link a clinician workspace first." />
      </AnimatedPage>
    )
  }

  const historyForPatient = focusPatient
    ? {
        appts: appointments.filter((a) => a.patientId === focusPatient.id && a.doctorId === doctor?.id),
        consults: consultations.filter((c) => c.patientId === focusPatient.id),
        rx: prescriptions.filter((p) => p.patientId === focusPatient.id),
      }
    : null

  return (
    <AnimatedPage>
      <PageHeader title="Patients" description="Cross-reference scheduling, prescribing, and past encounters across your MediCare roster." />
      <Card variant="outlined" sx={{ borderColor: 'success.light' }}>
        <CardHeader
          title={`Active panel (${enriched.length})`}
          titleTypographyProps={{ variant: 'h6' }}
          action={
            <Chip
              label={busy ? 'Refreshing…' : 'Ledger synced'}
              size="small"
              color="secondary"
              variant={busy ? undefined : 'outlined'}
            />
          }
        />
        <CardContent sx={{ p: 0 }}>
          <TableContainer sx={{ maxHeight: 'min(70vh, 700px)' }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: 11, bgcolor: 'success.light' }}>
                    Patient
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: 11, bgcolor: 'success.light' }}>
                    History flags
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: 11, bgcolor: 'success.light' }}>
                    Last seen
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: 11, bgcolor: 'success.light' }}>
                    Chart
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {enriched.map(({ patient, user, lastVisit }) => (
                  <TableRow key={patient.id} hover>
                    <TableCell sx={{ verticalAlign: 'middle' }}>
                      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                        <Avatar sx={{ width: 40, height: 40 }} src={user?.avatar ?? undefined}>
                          {(user?.name ?? 'Pt').slice(0, 2)}
                        </Avatar>
                        <Box>
                          <Typography sx={{ fontWeight: 700 }}>{user?.name ?? 'Patient'}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {user?.gender ?? '—'} · {user?.phone ?? patient.id}
                          </Typography>
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell sx={{ maxWidth: 220, color: 'text.secondary', verticalAlign: 'middle' }}>
                      {patient.medicalHistory.slice(0, 2).join(' · ') || 'No chronic flags'}
                    </TableCell>
                    <TableCell sx={{ verticalAlign: 'middle' }}>
                      <Typography variant="caption" color="text.secondary">
                        {lastVisit ? format(new Date(lastVisit), 'MMM d, yyyy · p') : '—'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ verticalAlign: 'middle' }}>
                      <Button size="small" variant="outlined" startIcon={<HistoryIcon />} onClick={() => setFocusPatient(patient)}>
                        History
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Dialog open={!!focusPatient} onClose={() => setFocusPatient(null)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonIcon color="primary" />
          {focusPatient ? users.find((u) => u.id === focusPatient.userId)?.name : 'Patient'}
        </DialogTitle>
        <DialogContent sx={{ pb: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Timeline limited to encounters you anchored in mock data.
          </Typography>

          <Tabs value={historyTab} onChange={(_, v) => setHistoryTab(v)} variant="scrollable" sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Tab
              value="appts"
              label={
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                  <span>Visits</span>
                  <Chip label={historyForPatient?.appts.length ?? 0} size="small" />
                </Stack>
              }
            />
            <Tab
              value="consults"
              label={
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                  <span>Consultations</span>
                  <Chip label={historyForPatient?.consults.length ?? 0} size="small" />
                </Stack>
              }
            />
            <Tab
              value="scripts"
              label={
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                  <span>Prescriptions</span>
                  <Chip label={historyForPatient?.rx.length ?? 0} size="small" />
                </Stack>
              }
            />
          </Tabs>

          {historyTab === 'appts' && (
            <Box sx={{ maxHeight: 288, overflow: 'auto', border: 1, borderColor: 'divider', borderRadius: 2, p: 2 }}>
              {historyForPatient?.appts.length === 0 && (
                <EmptyState
                  icon={<InsightsIcon sx={{ fontSize: 36, opacity: 0.75 }} />}
                  title="No visits"
                  description="No scheduling events yet."
                />
              )}
              <Stack component="ul" spacing={1.5} sx={{ m: 0, p: 0, listStyle: 'none' }}>
                {historyForPatient?.appts.map((a) => (
                  <Box key={a.id} component="li" sx={{ borderRadius: 1, border: 1, borderColor: 'divider', px: 1.5, py: 1 }}>
                    <Typography sx={{ fontWeight: 600 }}>{format(new Date(a.scheduledAt), 'PPpp')}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {APPOINTMENT_STATUS_LABELS[a.status]} · {a.reason}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </Box>
          )}

          {historyTab === 'consults' && (
            <Box sx={{ maxHeight: 288, overflow: 'auto', border: 1, borderColor: 'divider', borderRadius: 2, p: 2 }}>
              {(historyForPatient?.consults ?? []).length === 0 ? (
                <EmptyState icon={<HistoryIcon sx={{ fontSize: 36, opacity: 0.75 }} />} title="No notes" />
              ) : (
                <Stack component="ul" spacing={1.5} sx={{ m: 0, p: 0, listStyle: 'none' }}>
                  {historyForPatient?.consults.map((c) => (
                    <Box
                      key={c.id}
                      component="li"
                      sx={{
                        borderRadius: 1,
                        border: 1,
                        borderColor: 'success.light',
                        px: 1.5,
                        py: 1,
                      }}
                    >
                      <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase' }}>
                        {format(new Date(c.createdAt), 'MMM d, yyyy · p')}
                      </Typography>
                      <Typography sx={{ fontWeight: 700 }} color="success.dark">
                        {c.diagnosis || 'Assessment pending'}
                      </Typography>
                      <Typography variant="body2">
                        {c.summary.slice(0, 160)}
                        {c.summary.length > 160 ? '…' : ''}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              )}
            </Box>
          )}

          {historyTab === 'scripts' && (
            <Box sx={{ maxHeight: 288, overflow: 'auto', border: 1, borderColor: 'divider', borderRadius: 2, p: 2 }}>
              {(historyForPatient?.rx ?? []).length === 0 ? (
                <EmptyState title="No prescriptions" />
              ) : (
                <Stack component="ul" spacing={1.5} sx={{ m: 0, p: 0, listStyle: 'none' }}>
                  {historyForPatient?.rx.map((p) => (
                    <Box key={p.id} component="li" sx={{ borderRadius: 1, border: 1, borderColor: 'divider', px: 1.5, py: 1 }}>
                      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase' }}>
                          {format(new Date(p.createdAt), 'PP')}
                        </Typography>
                        <Chip label={p.status} size="small" />
                      </Stack>
                      <Typography variant="body2" sx={{ mt: 0.5 }}>
                        {p.medicines.map((m) => m.name).join(', ') || '—'}
                      </Typography>
                      {p.diagnosis && (
                        <Typography variant="caption" color="text.secondary">
                          Dx: {p.diagnosis}
                        </Typography>
                      )}
                    </Box>
                  ))}
                </Stack>
              )}
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </AnimatedPage>
  )
}
