import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { format, formatDistanceToNow, isFuture, parseISO } from 'date-fns'
import EventIcon from '@mui/icons-material/Event'
import FavoriteIcon from '@mui/icons-material/Favorite'
import MedicationIcon from '@mui/icons-material/Medication'
import VaccinesIcon from '@mui/icons-material/Vaccines'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Chip from '@mui/material/Chip'
import Grid from '@mui/material/Grid'
import Skeleton from '@mui/material/Skeleton'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useTheme } from '@mui/material/styles'
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, Tooltip } from 'recharts'
import { PageHeader } from '@/components/shared/PageHeader'
import { AnimatedCard, AnimatedPage } from '@/components/shared/AnimatedPage'
import * as api from '@/services/mockApi'
import type { Appointment, VitalReading } from '@/types'
import { useAuthStore } from '@/store'

function deriveSeries(reading: VitalReading, points = 12) {
  const baseNum = Number.parseFloat(String(reading.value).split(/[\s/-]/)[0]) || 70
  return Array.from({ length: points }, (_, i) => ({
    label: `${i + 1}d`,
    v: Math.round(baseNum + Math.sin(i * 0.4) * 4 + i * (reading.type === 'weight' ? 0.03 : reading.type === 'blood_sugar' ? 1.2 : reading.type === 'heart_rate' ? 1.8 : 0.6)),
  }))
}

async function resolveDoctor(doctorId: string) {
  const d = await api.getDoctorById(doctorId)
  if (!d) return null
  const u = await api.getUserById(d.userId)
  return { doctor: d, name: u?.name ?? 'Clinician' }
}

export function PatientDashboard() {
  const theme = useTheme()
  const user = useAuthStore((s) => s.user)
  const [loading, setLoading] = useState(true)
  const [patient, setPatient] = useState<Awaited<ReturnType<typeof api.getPatientByUserId>>>(undefined)
  const [upcoming, setUpcoming] = useState<(Appointment & { doctorName?: string })[]>([])
  const [reminders, setReminders] = useState<{ id: string; label: string; when: string }[]>([])

  useEffect(() => {
    if (!user?.id) {
      setLoading(false)
      return
    }
    let cancelled = false
    const uid = user.id
    async function load() {
      setLoading(true)
      const [p, appts] = await Promise.all([api.getPatientByUserId(uid), api.getAppointments(uid, 'patient')])
      if (cancelled) return
      setPatient(p)
      const fut = [...appts]
        .filter((a) => a.status !== 'cancelled' && a.status !== 'completed' && isFuture(parseISO(a.scheduledAt)))
        .sort((a, b) => parseISO(a.scheduledAt).getTime() - parseISO(b.scheduledAt).getTime())
        .slice(0, 6)
      const enriched = await Promise.all(
        fut.map(async (a) => {
          const r = await resolveDoctor(a.doctorId)
          return { ...a, doctorName: r?.name }
        })
      )
      setUpcoming(enriched)
      if (p?.id) {
        const rx = await api.getPrescriptions(p.id)
        setReminders(
          rx
            .filter((r) => r.status === 'active' && r.refillReminder)
            .slice(0, 4)
            .map((r) => ({
              id: r.id,
              label: r.medicines[0]?.name ?? 'Medication refill',
              when: formatDistanceToNow(parseISO(r.refillReminder!), { addSuffix: true }),
            }))
        )
      }
      setLoading(false)
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [user?.id])

  const metrics = patient?.vitals ?? []
  const summary = useMemo(
    () => ({
      meds: reminders.length,
      apptsSoon: upcoming.length,
      allergies: patient?.allergies?.filter((x) => x !== 'None').length ?? 0,
    }),
    [reminders.length, upcoming.length, patient?.allergies]
  )

  if (!user) {
    return (
      <AnimatedPage>
        <PageHeader title="Patient dashboard" description="Sign in to view your MediCare+ home." />
      </AnimatedPage>
    )
  }

  return (
    <AnimatedPage>
      <Stack spacing={4}>
        <PageHeader title="Welcome back" description="Your care timeline, prescriptions, and vitals snapshot.">
          <Button variant="contained" color="primary" component={Link} to="/patient/appointments/book">
            Book visit
          </Button>
        </PageHeader>

        <Grid container spacing={2}>
          {loading
            ? [1, 2, 3, 4].map((i) => (
                <Grid item key={i} xs={12} sm={6} xl={3}>
                  <Card variant="outlined" sx={{ borderColor: 'rgba(16, 185, 129, 0.35)' }}>
                    <CardContent sx={{ p: 3 }}>
                      <Skeleton variant="rectangular" height={96} sx={{ borderRadius: 1 }} />
                    </CardContent>
                  </Card>
                </Grid>
              ))
            : (
                <>
                  <Grid item xs={12} sm={6} xl={3}>
                    <AnimatedCard>
                      <Card
                        sx={{
                          height: '100%',
                          overflow: 'hidden',
                          borderColor: 'rgba(16, 185, 129, 0.35)',
                          background: (t) =>
                            t.palette.mode === 'dark'
                              ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), #1e1e1e)'
                              : 'linear-gradient(135deg, rgba(236, 253, 245, 1), #fff)',
                        }}
                        variant="outlined"
                      >
                        <CardHeader
                          sx={{ pb: 1 }}
                          title={
                            <Box>
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                Upcoming
                              </Typography>
                              <Typography variant="h3" sx={{ color: 'success.dark', fontWeight: 700 }}>
                                {summary.apptsSoon}
                              </Typography>
                            </Box>
                          }
                        />
                        <CardContent sx={{ pt: 0 }}>
                          <Typography variant="body2" color="text.secondary">
                            Confirmed & scheduled appointments
                          </Typography>
                        </CardContent>
                      </Card>
                    </AnimatedCard>
                  </Grid>
                  <Grid item xs={12} sm={6} xl={3}>
                    <AnimatedCard>
                      <Card sx={{ height: '100%', borderColor: 'rgba(20, 184, 166, 0.35)' }} variant="outlined">
                        <CardHeader
                          sx={{ pb: 1 }}
                          title={
                            <Box>
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                Refill reminders
                              </Typography>
                              <Typography variant="h3" sx={{ color: 'info.dark', fontWeight: 700 }}>
                                {summary.meds}
                              </Typography>
                            </Box>
                          }
                        />
                        <CardContent sx={{ pt: 0 }}>
                          <Typography variant="body2" color="text.secondary">
                            Medications tracked this month
                          </Typography>
                        </CardContent>
                      </Card>
                    </AnimatedCard>
                  </Grid>
                  <Grid item xs={12} sm={6} xl={3}>
                    <AnimatedCard>
                      <Card sx={{ height: '100%', borderColor: 'rgba(245, 158, 11, 0.35)' }} variant="outlined">
                        <CardHeader
                          sx={{ pb: 1 }}
                          title={
                            <Box>
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                Allergy alerts
                              </Typography>
                              <Typography variant="h3" sx={{ color: 'warning.dark', fontWeight: 700 }}>
                                {summary.allergies}
                              </Typography>
                            </Box>
                          }
                        />
                        <CardContent sx={{ pt: 0 }}>
                          <Typography variant="body2" color="text.secondary">
                            Listed for prescriber review
                          </Typography>
                        </CardContent>
                      </Card>
                    </AnimatedCard>
                  </Grid>
                  <Grid item xs={12} sm={6} xl={3}>
                    <AnimatedCard>
                      <Card sx={{ height: '100%', borderColor: 'rgba(34, 197, 94, 0.35)' }} variant="outlined">
                        <CardHeader
                          sx={{ pb: 1, display: 'flex', flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}
                          title={
                            <Typography variant="body2" color="text.secondary">
                              Health score
                            </Typography>
                          }
                          action={<FavoriteIcon sx={{ color: 'success.main', fontSize: 28 }} />}
                        />
                        <CardContent sx={{ pt: 0 }}>
                          <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.dark' }}>
                            Stable
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                            Trending positively — keep hydration & meds on track.
                          </Typography>
                        </CardContent>
                      </Card>
                    </AnimatedCard>
                  </Grid>
                </>
              )}
        </Grid>

        <Grid container spacing={3}>
          <Grid item xs={12} xl={7}>
            <AnimatedCard>
              <Card variant="outlined" sx={{ borderColor: 'rgba(6, 78, 59, 0.12)' }}>
                <CardHeader
                  sx={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}
                  title={
                    <Stack direction="row" sx={{ alignItems: 'center', gap: 1 }}>
                      <EventIcon sx={{ color: 'success.main' }} />
                      <Typography variant="h6" component="span">
                        Upcoming appointments
                      </Typography>
                    </Stack>
                  }
                  subheader="Sorted by earliest date · telehealth & clinic visits"
                  action={
                    <Button size="small" component={Link} to="/patient/appointments" endIcon={<ChevronRightIcon />}>
                      Manage
                    </Button>
                  }
                />
                <CardContent>
                  <Stack spacing={2}>
                    {loading && [...Array(4)].map((_, i) => <Skeleton key={i} variant="rectangular" height={80} sx={{ borderRadius: 1 }} />)}
                    {!loading && upcoming.length === 0 && (
                      <Typography variant="body2" color="text.secondary">
                        No upcoming visits. Ready when you are.
                      </Typography>
                    )}
                    {!loading &&
                      upcoming.map((a) => (
                        <Box
                          key={a.id}
                          sx={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 2,
                            p: 2,
                            borderRadius: 2,
                            border: 1,
                            borderColor: 'divider',
                            bgcolor: 'action.hover',
                          }}
                        >
                          <Box sx={{ minWidth: 0, flex: 1 }}>
                            <Typography noWrap sx={{ fontWeight: 600 }}>
                              {a.reason}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" noWrap>
                              {format(parseISO(a.scheduledAt), 'EEE, MMM d · h:mm a')} ·{' '}
                              <span>{a.mode === 'online' ? 'Video visit' : 'Clinic'} · {a.doctorName}</span>
                            </Typography>
                            <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1, mt: 1 }}>
                              <Chip
                                label={a.mode}
                                size="small"
                                color={a.mode === 'online' ? 'primary' : 'default'}
                                variant={a.mode === 'online' ? 'filled' : 'outlined'}
                              />
                              <Chip label={a.status} size="small" variant="outlined" />
                            </Stack>
                          </Box>
                          <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
                            {a.mode === 'online' && (
                              <Button size="small" variant="outlined" component={Link} to={`/patient/teleconsultation/${a.id}`}>
                                Join lobby
                              </Button>
                            )}
                            <Button size="small" component={Link} to={`/patient/appointments#${a.id}`}>
                              Details
                            </Button>
                          </Stack>
                        </Box>
                      ))}
                  </Stack>
                </CardContent>
              </Card>
            </AnimatedCard>
          </Grid>

          <Grid item xs={12} xl={5}>
            <AnimatedCard>
              <Card variant="outlined" sx={{ borderColor: 'rgba(6, 78, 59, 0.12)' }}>
                <CardHeader
                  title={
                    <Stack direction="row" sx={{ alignItems: 'center', gap: 1 }}>
                      <MedicationIcon sx={{ color: 'success.main' }} />
                      <Typography variant="h6" component="span">
                        Prescription reminders
                      </Typography>
                    </Stack>
                  }
                  subheader="Next refills surfaced from your pharmacy plan"
                />
                <CardContent>
                  <Stack spacing={2}>
                    {loading && <Skeleton variant="rectangular" height={128} sx={{ borderRadius: 1 }} />}
                    {!loading &&
                      reminders.map((r) => (
                        <Box
                          key={r.id}
                          sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, p: 2, borderRadius: 2, border: 1, borderColor: 'divider' }}
                        >
                          <Box>
                            <Typography sx={{ fontWeight: 500 }}>{r.label}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              Refill estimated {r.when}
                            </Typography>
                          </Box>
                          <Chip label="track" color="success" size="small" sx={{ flexShrink: 0 }} />
                        </Box>
                      ))}
                    {!loading && reminders.length === 0 && (
                      <Typography variant="body2" color="text.secondary">
                        You are caught up!
                      </Typography>
                    )}
                    <Button fullWidth variant="outlined" size="small" component={Link} to="/patient/prescriptions">
                      View prescriptions
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </AnimatedCard>
          </Grid>
        </Grid>

        <AnimatedCard>
          <Card variant="outlined" sx={{ borderColor: 'rgba(6, 78, 59, 0.12)' }}>
            <CardHeader
              title={
                <Stack direction="row" sx={{ alignItems: 'center', gap: 1 }}>
                  <MonitorHeartIcon sx={{ color: 'success.main' }} />
                  <Typography variant="h6" component="span">
                    Vitals at a glance
                  </Typography>
                </Stack>
              }
              subheader="Mini curves from historical baselines tracked in MediCare+"
            />
            <CardContent>
              {loading && (
                <Grid container spacing={3}>
                  {[1, 2, 3, 4].map((i) => (
                    <Grid item key={i} xs={12} md={6} xl={3}>
                      <Skeleton variant="rectangular" height={160} sx={{ borderRadius: 2 }} />
                    </Grid>
                  ))}
                </Grid>
              )}
              {!loading && metrics.length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  No vitals synced yet.
                </Typography>
              )}
              {!loading && metrics.length > 0 && (
                <Grid container spacing={3}>
                  {metrics.map((m) => {
                    const chart = deriveSeries(m, 14)
                    return (
                      <Grid item key={m.id} xs={12} md={6} xl={3}>
                        <Card variant="outlined" sx={{ p: 2, boxShadow: (t) => t.shadows[1] }}>
                          <Stack direction="row" spacing={1} sx={{ mb: 2, alignItems: 'center' }}>
                            <VaccinesIcon sx={{ display: { xs: 'none', sm: 'inline' }, fontSize: 18, color: 'success.main' }} aria-hidden />
                            <Typography variant="body2" sx={{ textTransform: 'capitalize', flex: 1, fontWeight: 600 }}>
                              {String(m.type).replace(/_/g, ' ')}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {m.unit}
                            </Typography>
                          </Stack>
                          <Typography variant="h5" sx={{ mb: 2, fontWeight: 700, color: 'success.dark' }}>
                            {m.value}
                            <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 0.5, fontWeight: 400 }}>
                              {m.unit}
                            </Typography>
                          </Typography>
                          <Box sx={{ height: 112 }}>
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={chart}>
                                <CartesianGrid strokeDasharray="4 8" stroke={theme.palette.divider} />
                                <XAxis dataKey="label" hide />
                                <Tooltip
                                  formatter={(value) => {
                                    const n =
                                      typeof value === 'number' ? value : value != null && value !== '' ? Number(value) : NaN
                                    return [`${Number.isFinite(n) ? n : '—'} ${m.unit}`, 'Trend']
                                  }}
                                  contentStyle={{
                                    borderRadius: 12,
                                    border: `1px solid ${theme.palette.divider}`,
                                    background: theme.palette.background.paper,
                                  }}
                                />
                                <Line type="monotone" dataKey="v" stroke="#059669" strokeWidth={2} dot={false} />
                              </LineChart>
                            </ResponsiveContainer>
                          </Box>
                        </Card>
                      </Grid>
                    )
                  })}
                </Grid>
              )}
            </CardContent>
          </Card>
        </AnimatedCard>
      </Stack>
    </AnimatedPage>
  )
}
