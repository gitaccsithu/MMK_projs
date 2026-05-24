import { useCallback, useEffect, useMemo, useState } from 'react'
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import DoorFrontIcon from '@mui/icons-material/DoorFront'
import HourglassBottomIcon from '@mui/icons-material/HourglassBottom'
import HowToRegIcon from '@mui/icons-material/HowToReg'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Chip from '@mui/material/Chip'
import Skeleton from '@mui/material/Skeleton'
import Typography from '@mui/material/Typography'
import { alpha, useTheme } from '@mui/material/styles'
import { format, formatDistanceStrict, parseISO, isSameDay } from 'date-fns'
import { toast } from 'sonner'
import { AnimatedCard, AnimatedPage } from '@/components/shared/AnimatedPage'
import { PageHeader } from '@/components/shared/PageHeader'
import * as api from '@/services/mockApi'
import type { Appointment, Doctor } from '@/types'
import { APPOINTMENT_STATUS_LABELS } from '@/types'

async function enrich(a: Appointment) {
  const p = await api.getPatientById(a.patientId)
  const pn = p ? await api.getUserById(p.userId) : null
  const d = await api.getDoctorById(a.doctorId)
  const dn = d ? await api.getUserById(d.userId) : null
  return { appt: a, patientLabel: pn?.name ?? 'Patient', doctorLabel: dn?.name ?? 'Clinician', doctor: d }
}

function etaEstimate(position: number) {
  return `${Math.min(180, Math.max(8, position * 12))} min`
}

export function QueuePage() {
  const theme = useTheme()
  const [loading, setLoading] = useState(true)
  const [entries, setEntries] = useState<Awaited<ReturnType<typeof enrich>>[]>([])
  const [docs, setDocs] = useState<Doctor[]>([])

  const load = useCallback(async () => {
    setLoading(true)
    const [appts, doctors] = await Promise.all([
      api.getAppointments(),
      api.searchDoctors({}),
    ])
    const candidates = [...appts].filter((a) =>
      ['waiting', 'confirmed', 'pending', 'in_consultation'].includes(a.status)
    )
    const enriched = await Promise.all(candidates.map((appt) => enrich(appt)))
    enriched.sort((a, b) => {
      const t1 = parseISO(a.appt.checkedInAt ?? a.appt.scheduledAt).getTime()
      const t2 = parseISO(b.appt.checkedInAt ?? b.appt.scheduledAt).getTime()
      return t1 - t2
    })
    const today = enriched.filter(({ appt }) => isSameDay(parseISO(appt.scheduledAt), new Date()))
    setEntries(today.length ? today : enriched.slice(0, 12))
    setDocs(doctors)
    setLoading(false)
  }, [])

  useEffect(() => {
    void load()
    const iv = window.setInterval(() => void load(), 15000)
    return () => window.clearInterval(iv)
  }, [load])

  const busyDoctors = useMemo(() => {
    return docs.filter((d) =>
      entries.some((e) => e.appt.doctorId === d.id && e.appt.status === 'in_consultation')
    ).length
  }, [docs, entries])

  async function checkIn(apptId: string) {
    await api.updateAppointmentStatus(apptId, 'waiting')
    const queued =
      entries.filter((e) => ['waiting'].includes(e.appt.status)).length + 1
    await api.updateAppointment(apptId, {
      queuePosition: queued,
      checkedInAt: new Date().toISOString(),
    })
    toast.success('Patient flagged as arrived.')
    void load()
  }

  async function checkOut(apptId: string) {
    await api.updateAppointmentStatus(apptId, 'completed')
    toast.success('Visit closed at front desk.')
    void load()
  }

  async function moveToChair(apptId: string) {
    await api.updateAppointmentStatus(apptId, 'in_consultation')
    toast.success('Routed to clinician room.')
    void load()
  }

  return (
    <AnimatedPage>
      <PageHeader
        title="Live waiting queue"
        description="Estimated dwell times react to clinician load in this lightweight demo ticker."
      />
      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' },
          mb: 4,
        }}
      >
        <Card
          sx={{
            border: '1px solid',
            borderColor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.4 : 0.45),
            bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.2 : 0.12),
          }}
        >
          <CardHeader sx={{ pb: 0.5 }}
            title={<Typography variant="caption" color="text.secondary">Active concierge threads</Typography>}
          />
          <CardContent sx={{ pt: 0 }}>
            <Typography variant="h4" sx={{ fontWeight: 600, color: 'primary.dark' }}>
              {entries.length}
            </Typography>
          </CardContent>
          <CardContent sx={{ pt: 0, display: 'flex', alignItems: 'center', gap: 1 }}>
            <HourglassBottomIcon sx={{ fontSize: 18, color: 'teal' }} />
            <Typography variant="body2" color="text.secondary">
              ETA refresh every 15s
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: alpha(theme.palette.secondary.main, 0.35) }}>
          <CardHeader sx={{ pb: 0.5 }}
            title={<Typography variant="caption" color="text.secondary">Providers in-chair</Typography>}
          />
          <CardContent sx={{ pt: 0 }}>
            <Typography variant="h4" sx={{ fontWeight: 600, color: '#00897B' }}>
              {busyDoctors}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {Math.max(docs.length - busyDoctors, 0)} doctors signal open coverage
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ border: '1px solid', borderColor: 'divider' }}>
          <CardHeader
            sx={{ pb: 0.5 }}
            title={
              <Typography variant="caption" color="text.secondary">
                Lobby automation
              </Typography>
            }
            subheader={<Typography sx={{ fontWeight: 600 }}>Kiosk synced</Typography>}
            action={<AutoAwesomeIcon sx={{ fontSize: 40, color: 'success.main' }} />}
          />
          <CardContent sx={{ pt: 0 }}>
            <Typography variant="body2" color="text.secondary">
              Front desk writes queue positions for LEDs & SMS nudges (mock APIs).
            </Typography>
          </CardContent>
        </Card>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gap: 3,
          gridTemplateColumns: { xs: '1fr', xl: 'minmax(0, 2fr) minmax(0, 1fr)' },
        }}
      >
        <AnimatedCard>
          <Card
            elevation={2}
            sx={{ border: '1px solid', borderColor: alpha(theme.palette.primary.dark, 0.25), height: '100%' }}
          >
            <CardHeader
              title={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AssignmentTurnedInIcon color="primary" />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Triage runway
                  </Typography>
                </Box>
              }
              subheader={
                <Typography variant="body2" color="text.secondary">
                  Check-in arrivals, escalate to clinician, finalize checkout.
                </Typography>
              }
            />
            <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {loading &&
                [...Array(4)].map((_, i) => <Skeleton key={i} variant="rounded" sx={{ height: 92 }} />)}
              {!loading &&
                entries.map((row, idx) => {
                  const pos = row.appt.queuePosition ?? idx + 1
                  const base = parseISO(row.appt.checkedInAt ?? row.appt.scheduledAt)
                  return (
                    <Box
                      key={row.appt.id}
                      sx={{
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                        p: 2,
                        background: `linear-gradient(135deg, ${theme.palette.background.paper}, ${alpha(theme.palette.action.hover, theme.palette.mode === 'dark' ? 0.2 : 0.35)})`,
                        boxShadow: 1,
                      }}
                    >
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1 }}>
                            <Typography sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
                              {row.patientLabel}
                            </Typography>
                            <Chip size="small" label={`#${pos}`} variant="outlined" />
                          </Box>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            {format(base, 'h:mm a')} · {row.doctorLabel} ·{' '}
                            {APPOINTMENT_STATUS_LABELS[row.appt.status]}
                          </Typography>
                          <Box sx={{ mt: 1.5, display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center' }}>
                            <Typography
                              component="span"
                              variant="caption"
                              sx={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 0.5,
                                px: 1,
                                py: 0.25,
                                borderRadius: 999,
                                bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.5 : 0.15),
                                color: theme.palette.mode === 'dark' ? 'primary.light' : 'primary.dark',
                                fontWeight: 600,
                              }}
                            >
                              <DoorFrontIcon sx={{ fontSize: 16 }} /> ETA · {etaEstimate(pos)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Elapsed lobby ·{' '}
                              <Typography component="span" variant="caption" sx={{ fontWeight: 700 }} color="text.primary">
                                {formatDistanceStrict(parseISO(row.appt.scheduledAt), new Date())}
                              </Typography>
                            </Typography>
                          </Box>
                        </Box>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          {['pending', 'confirmed'].includes(row.appt.status) && (
                            <Button
                              size="small"
                              color="secondary"
                              variant="contained"
                              startIcon={<HowToRegIcon sx={{ fontSize: 18 }} />}
                              onClick={() => void checkIn(row.appt.id)}
                            >
                              Check-in
                            </Button>
                          )}
                          {row.appt.status === 'waiting' && (
                            <>
                              <Button size="small" variant="contained" color="primary" onClick={() => void moveToChair(row.appt.id)}>
                                Send to clinician
                              </Button>
                              <Button size="small" variant="outlined" onClick={() => void checkOut(row.appt.id)}>
                                No-show closure
                              </Button>
                            </>
                          )}
                          {row.appt.status === 'in_consultation' && (
                            <Button size="small" variant="outlined" onClick={() => void checkOut(row.appt.id)}>
                              Check-out patient
                            </Button>
                          )}
                        </Box>
                      </Box>
                    </Box>
                  )
                })}
              {!loading && entries.length === 0 && (
                <Box
                  sx={{
                    borderRadius: 2,
                    border: '1px dashed',
                    borderColor: 'divider',
                    px: 5,
                    py: 8,
                    textAlign: 'center',
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Queue is serene — kiosk has no arrivals in the synced window yet.
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </AnimatedCard>

        <AnimatedCard>
          <Card elevation={2} sx={{ border: '1px solid', borderColor: 'divider', height: '100%' }}>
            <CardHeader
              title={<Typography sx={{ fontWeight: 600 }}>Doctor availability</Typography>}
              subheader={
                <Typography variant="body2" color="text.secondary">
                  Open capacity vs clinicians anchored to chairs
                </Typography>
              }
            />
            <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {!loading &&
                docs.slice(0, 24).map((doctor) => {
                  const occupied = entries.some(
                    (e) => e.appt.doctorId === doctor.id && e.appt.status === 'in_consultation'
                  )
                  const openSlots =
                    doctor.availability?.flatMap((a) => (a.blocked ? [] : a.slots)).length ?? 0
                  return (
                    <Box
                      key={doctor.id}
                      sx={{
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: occupied ? alpha(theme.palette.warning.main, 0.55) : alpha(theme.palette.success.main, 0.45),
                        px: 2,
                        py: 1.5,
                        fontSize: 12,
                        bgcolor: occupied ? alpha(theme.palette.warning.main, theme.palette.mode === 'dark' ? 0.2 : 0.12)
                          : alpha(theme.palette.success.main, theme.palette.mode === 'dark' ? 0.18 : 0.1),
                        color: occupied ? 'warning.dark' : 'success.dark',
                      }}
                    >
                      <Typography sx={{ fontWeight: 600, textTransform: 'capitalize', fontSize: 14 }}>
                        {doctor.specialty}
                      </Typography>
                      <Typography sx={{ opacity: 0.9, display: 'block' }} variant="caption">
                        {occupied ? 'In consultation' : 'Accepting arrivals'}
                      </Typography>
                      <Typography sx={{ mt: 0.5, opacity: 0.75, display: 'block' }} variant="caption">
                        {openSlots} slots published
                      </Typography>
                    </Box>
                  )
                })}
            </CardContent>
          </Card>
        </AnimatedCard>
      </Box>
    </AnimatedPage>
  )
}
