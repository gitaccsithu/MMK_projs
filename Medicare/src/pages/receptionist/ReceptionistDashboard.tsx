import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { format, parseISO, isWithinInterval, startOfDay, endOfDay } from 'date-fns'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import CreditCardIcon from '@mui/icons-material/CreditCard'
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered'
import GroupsIcon from '@mui/icons-material/Groups'
import LocalHospitalIcon from '@mui/icons-material/LocalHospital'
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Chip from '@mui/material/Chip'
import Grid from '@mui/material/Grid'
import Skeleton from '@mui/material/Skeleton'
import Typography from '@mui/material/Typography'
import { alpha, useTheme } from '@mui/material/styles'
import { AnimatedCard, AnimatedPage } from '@/components/shared/AnimatedPage'
import { PageHeader } from '@/components/shared/PageHeader'
import * as api from '@/services/mockApi'
import type { Appointment, Invoice } from '@/types'
import { APPOINTMENT_STATUS_LABELS } from '@/types'
import { formatCurrency } from '@/utils/cn'

async function nameForAppointment(a: Appointment) {
  const p = await api.getPatientById(a.patientId)
  const pu = p ? await api.getUserById(p.userId) : null
  const d = await api.getDoctorById(a.doctorId)
  const du = d ? await api.getUserById(d.userId) : null
  return { patient: pu?.name ?? 'Patient', clinician: du?.name ?? 'Clinician' }
}

export function ReceptionistDashboard() {
  const theme = useTheme()
  const [loading, setLoading] = useState(true)
  const [todayAppts, setTodayAppts] = useState<(Appointment & { patientLabel?: string; doctorLabel?: string })[]>(
    []
  )
  const [invoicesToday, setInvoicesToday] = useState<Invoice[]>([])
  const [queueCount, setQueueCount] = useState(0)
  const [checkedCount, setCheckedCount] = useState(0)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      const [appts, inv] = await Promise.all([api.getAppointments(), api.getInvoices()])
      const start = startOfDay(new Date())
      const end = endOfDay(new Date())
      const todays = appts.filter((a) =>
        isWithinInterval(parseISO(a.scheduledAt), { start, end })
      )
      const enriched = await Promise.all(
        todays.map(async (a) => {
          const nm = await nameForAppointment(a)
          return { ...a, patientLabel: nm.patient, doctorLabel: nm.clinician }
        })
      )
      if (cancelled) return
      setTodayAppts(enriched.slice(0, 12))

      const invToday = inv.filter((x) =>
        isWithinInterval(parseISO(x.createdAt), { start, end })
      )
      setInvoicesToday(invToday)
      const waiting = enriched.filter((a) => ['waiting', 'confirmed', 'in_consultation'].includes(a.status))
      setQueueCount(waiting.filter((x) => x.status === 'waiting').length)
      setCheckedCount(
        enriched.filter((a) => a.status !== 'pending' && a.status !== 'cancelled').length
      )
      setLoading(false)
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  const billing = useMemo(() => {
    const paid = invoicesToday.filter((i) => i.status === 'paid').reduce((s, x) => s + x.amount, 0)
    const pending = invoicesToday.filter((i) => i.status === 'pending').reduce((s, x) => s + x.patientPay, 0)
    return { paid, pending, count: invoicesToday.length }
  }, [invoicesToday])

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <AnimatedPage>
        <PageHeader
          title="Front desk overview"
          description="Today's schedule, arrivals, billing snapshot, and quick links for walk-ins."
        >
          <Button
            variant="outlined"
            size="small"
            component={Link}
            to="/receptionist/queue"
            startIcon={<FormatListNumberedIcon fontSize="small" />}
            sx={{ borderColor: alpha(theme.palette.primary.main, 0.35) }}
          >
            Queue
          </Button>
          <Button
            variant="contained"
            size="small"
            component={Link}
            to="/receptionist/scheduling"
            startIcon={<CalendarTodayIcon fontSize="small" />}
          >
            Schedule visit
          </Button>
        </PageHeader>

        <Grid container spacing={2} columns={{ xs: 4, sm: 8, xl: 16 }}>
          {loading
            ? [...Array(4)].map((_, i) => (
                <Grid item key={i} xs={4} sm={4} xl={4}>
                  <Card
                    sx={{
                      border: '1px solid',
                      borderColor: alpha(theme.palette.primary.main, 0.35),
                      height: '100%',
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Skeleton variant="rounded" sx={{ height: 80 }} />
                    </CardContent>
                  </Card>
                </Grid>
              ))
            : (
                <>
                  <Grid item xs={4} sm={4} xl={4}>
                    <AnimatedCard>
                      <Card
                        sx={{
                          height: '100%',
                          overflow: 'hidden',
                          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)}, ${theme.palette.background.paper}, ${theme.palette.background.paper})`,
                          border: '1px solid',
                          borderColor: alpha(theme.palette.primary.main, 0.4),
                          ...(theme.palette.mode === 'dark'
                            ? {
                                background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.15)}, rgba(255,255,255,0.05))`,
                                borderColor: alpha(theme.palette.primary.light, 0.25),
                              }
                            : {}),
                        }}
                      >
                        <CardContent>
                          <Typography variant="caption" color="text.secondary">
                            Today's appointments
                          </Typography>
                          <Typography variant="h4" sx={{ fontWeight: 600, color: 'primary.dark', mt: 0.5 }}>
                            {todayAppts.length}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            Across telehealth & on-site bays
                          </Typography>
                        </CardContent>
                      </Card>
                    </AnimatedCard>
                  </Grid>
                  <Grid item xs={4} sm={4} xl={4}>
                    <AnimatedCard>
                      <Card
                        sx={{
                          height: '100%',
                          border: '1px solid',
                          borderColor: alpha('#00897B', 0.45),
                        }}
                      >
                        <CardContent>
                          <Typography variant="caption" color="text.secondary">
                            Patients waiting
                          </Typography>
                          <Typography variant="h4" sx={{ fontWeight: 600, color: '#00695C', mt: 0.5 }}>
                            {queueCount}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            Routed to clinician availability
                          </Typography>
                        </CardContent>
                      </Card>
                    </AnimatedCard>
                  </Grid>
                  <Grid item xs={4} sm={4} xl={4}>
                    <AnimatedCard>
                      <Card
                        sx={{
                          height: '100%',
                          border: '1px solid',
                          borderColor: alpha(theme.palette.success.main, 0.45),
                        }}
                      >
                        <CardContent>
                          <Typography variant="caption" color="text.secondary">
                            Checked in
                          </Typography>
                          <Typography variant="h4" sx={{ fontWeight: 600, color: 'success.dark', mt: 0.5 }}>
                            {checkedCount}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            Today's arrivals accounted for
                          </Typography>
                        </CardContent>
                      </Card>
                    </AnimatedCard>
                  </Grid>
                  <Grid item xs={4} sm={4} xl={4}>
                    <AnimatedCard>
                      <Card
                        sx={{
                          height: '100%',
                          border: '1px solid',
                          borderColor: alpha(theme.palette.warning.main, 0.45),
                        }}
                      >
                        <CardHeader
                          sx={{ pb: 0.5 }}
                          title={
                            <Typography variant="caption" color="text.secondary">
                              Invoices (today)
                            </Typography>
                          }
                          action={<CreditCardIcon sx={{ color: 'warning.main', fontSize: 22 }} />}
                        />
                        <Box sx={{ px: 3, pb: 0 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'warning.dark' }}>
                            {billing.count} totals ·{' '}
                            <Box
                              component="span"
                              sx={{ fontWeight: 400, color: 'text.secondary', fontSize: '1rem' }}
                            >
                              pending {formatCurrency(billing.pending)}
                            </Box>
                          </Typography>
                        </Box>
                        <CardContent sx={{ pt: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            Paid {formatCurrency(billing.paid)}
                          </Typography>
                        </CardContent>
                      </Card>
                    </AnimatedCard>
                  </Grid>
                </>
              )}
        </Grid>

        <Grid container spacing={3}>
          <Grid item xs={12} xl={8}>
            <AnimatedCard>
              <Card
                elevation={2}
                sx={{
                  border: '1px solid',
                  borderColor: alpha(theme.palette.primary.dark, 0.25),
                  height: '100%',
                }}
              >
                <CardHeader
                  title={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CalendarTodayIcon sx={{ fontSize: 22, color: 'primary.main' }} />
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Daily slate
                      </Typography>
                    </Box>
                  }
                  subheader={
                    <Typography variant="body2" color="text.secondary">
                      Next visits on the calendar ({format(new Date(), 'EEE · MMM d')})
                    </Typography>
                  }
                  action={
                    <Button
                      variant="outlined"
                      size="small"
                      component={Link}
                      to="/receptionist/scheduling"
                      endIcon={<ArrowForwardIcon fontSize="small" />}
                    >
                      Walk-in booking
                    </Button>
                  }
                  sx={{
                    alignItems: { xs: 'flex-start', sm: 'flex-start' },
                    flexWrap: 'wrap',
                    '& .MuiCardHeader-action': {
                      mt: { xs: 2, sm: 0 },
                      ml: { xs: 0, sm: 2 },
                    },
                  }}
                />
                <CardContent>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {loading &&
                      [...Array(5)].map((_, i) => (
                        <Skeleton key={i} variant="rounded" sx={{ height: 76 }} />
                      ))}
                    {!loading &&
                      todayAppts
                        .sort((a, b) => parseISO(a.scheduledAt).getTime() - parseISO(b.scheduledAt).getTime())
                        .map((a) => (
                          <Box
                            key={a.id}
                            sx={{
                              display: 'flex',
                              flexWrap: 'wrap',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: 1.5,
                              borderRadius: 2,
                              border: '1px solid',
                              borderColor: 'divider',
                              p: 2,
                              bgcolor: (t) => alpha(t.palette.action.hover, 0.12),
                            }}
                          >
                            <Box sx={{ minWidth: 0, flex: 1 }}>
                              <Box
                                sx={{
                                  display: 'flex',
                                  flexWrap: 'wrap',
                                  alignItems: 'center',
                                  gap: 1,
                                }}
                              >
                                <Typography sx={{ fontWeight: 600 }} noWrap>
                                  {a.patientLabel}
                                </Typography>
                                <Chip
                                  size="small"
                                  label={a.mode}
                                  color={a.mode === 'online' ? 'primary' : 'default'}
                                  variant={a.mode === 'online' ? 'filled' : 'outlined'}
                                />
                                <Chip size="small" label={APPOINTMENT_STATUS_LABELS[a.status]} variant="outlined" />
                              </Box>
                              <Typography variant="body2" color="text.secondary" noWrap>
                                {format(parseISO(a.scheduledAt), 'h:mm a')} · {a.reason} · {a.doctorLabel}
                              </Typography>
                            </Box>
                            <Button size="small" variant="outlined" component={Link} to="/receptionist/queue">
                              Desk
                            </Button>
                          </Box>
                        ))}
                    {!loading && todayAppts.length === 0 && (
                      <Typography align="center" variant="body2" color="text.secondary" sx={{ py: 5 }}>
                        Quiet day — tap schedule to anchor the next arrival.
                      </Typography>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </AnimatedCard>
          </Grid>

          <Grid item xs={12} xl={4}>
            <AnimatedCard>
              <Card
                elevation={2}
                sx={{
                  border: '1px solid',
                  borderColor: alpha(theme.palette.primary.dark, 0.25),
                  height: '100%',
                }}
              >
                <CardHeader
                  title={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <GroupsIcon sx={{ fontSize: 22, color: 'teal' }} />
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        Reception shortcuts
                      </Typography>
                    </Box>
                  }
                  subheader={
                    <Typography variant="body2" color="text.secondary">
                      High-impact tasks for coordinators
                    </Typography>
                  }
                />
                <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <Button
                    variant="outlined"
                    component={Link}
                    to="/receptionist/patients"
                    sx={{ justifyContent: 'flex-start', py: 1.25, px: 1.5 }}
                    fullWidth
                    startIcon={<PersonAddIcon color="primary" />}
                  >
                    <Box sx={{ textAlign: 'left' }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, display: 'block' }}>
                        Patient directory
                      </Typography>
                      <Typography variant="caption" sx={{ fontWeight: 400, color: 'text.secondary' }}>
                        Create or revise profiles quickly
                      </Typography>
                    </Box>
                  </Button>
                  <Button
                    variant="outlined"
                    component={Link}
                    to="/receptionist/billing"
                    sx={{ justifyContent: 'flex-start', py: 1.25, px: 1.5 }}
                    fullWidth
                    startIcon={<CreditCardIcon color="primary" />}
                  >
                    <Box sx={{ textAlign: 'left' }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, display: 'block' }}>
                        Billing console
                      </Typography>
                      <Typography variant="caption" sx={{ fontWeight: 400, color: 'text.secondary' }}>
                        Payment status · copay capture
                      </Typography>
                    </Box>
                  </Button>
                  <Button
                    variant="outlined"
                    component={Link}
                    to="/receptionist/notifications"
                    sx={{ justifyContent: 'flex-start', py: 1.25, px: 1.5 }}
                    fullWidth
                    startIcon={<LocalHospitalIcon color="primary" />}
                  >
                    <Box sx={{ textAlign: 'left' }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, display: 'block' }}>
                        Care desk alerts
                      </Typography>
                      <Typography variant="caption" sx={{ fontWeight: 400, color: 'text.secondary' }}>
                        Operational SMS & kiosk notices
                      </Typography>
                    </Box>
                  </Button>
                </CardContent>
              </Card>
            </AnimatedCard>
          </Grid>
        </Grid>
      </AnimatedPage>
    </Box>
  )
}
