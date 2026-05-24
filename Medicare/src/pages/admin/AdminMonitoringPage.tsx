import { useEffect, useMemo, useState } from 'react'
import ShowChartIcon from '@mui/icons-material/ShowChart'
import WavesIcon from '@mui/icons-material/Waves'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Chip from '@mui/material/Chip'
import Skeleton from '@mui/material/Skeleton'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { AnimatedCard, AnimatedPage } from '@/components/shared/AnimatedPage'
import { PageHeader } from '@/components/shared/PageHeader'
import * as api from '@/services/mockApi'
import type { Appointment, Consultation } from '@/types'
import { APPOINTMENT_STATUS_LABELS } from '@/types'
import { formatCurrency, formatDateTime } from '@/utils/cn'

export function AdminMonitoringPage() {
  const [busy, setBusy] = useState(true)
  const [live, setLive] = useState<(Appointment & { patient?: string; doctor?: string })[]>([])
  const [consultations, setConsultations] = useState<Consultation[]>([])
  const [billingSeries, setBillingSeries] = useState<{ hour: string; cash: number; claims: number }[]>([])
  const [logs, setLogs] = useState<Awaited<ReturnType<typeof api.getActivityLogs>>>([])

  async function refresh() {
    setBusy(true)
    const appointments = await api.getAppointments()
    const enriched = await Promise.all(
      appointments
        .filter((a) => a.status === 'in_consultation')
        .map(async (appointment) => {
          const pt = await api.getPatientById(appointment.patientId)
          const pu = pt ? await api.getUserById(pt.userId) : null
          const doc = await api.getDoctorById(appointment.doctorId)
          const du = doc ? await api.getUserById(doc.userId) : null
          return { ...appointment, patient: pu?.name, doctor: du?.name }
        })
    )
    setLive(enriched)
    const consultationsAll = await api.getConsultations()
    setConsultations(consultationsAll.slice(0, 8))

    const invoices = await api.getInvoices()
    const grouped = invoices.reduce<
      Record<string, { patientPay: number; insuranceClaim: number }>
    >((acc, inv) => {
      const hr = `${new Date(inv.createdAt).getHours()}:00`
      if (!acc[hr]) acc[hr] = { patientPay: 0, insuranceClaim: 0 }
      acc[hr].patientPay += inv.patientPay
      acc[hr].insuranceClaim += inv.insuranceClaim ?? 0
      return acc
    }, {})

    const series = Object.entries(grouped)
      .map(([hour, v]) => ({
        hour,
        cash: Math.round(v.patientPay),
        claims: Math.round(v.insuranceClaim),
      }))
      .slice(0, 12)
      .reverse()
    setBillingSeries(series.length ? series : [{ hour: 'n/a', cash: 1200, claims: 800 }])

    const activity = await api.getActivityLogs()
    setLogs(activity.slice(0, 22))
    setBusy(false)
  }

  useEffect(() => {
    void refresh()
  }, [])

  const kpis = useMemo(() => {
    return {
      liveArrivals: live.length,
      consultVolume: consultations.length,
      backlog: consultations.filter((c) => c.duration > 30).length,
    }
  }, [consultations, live.length])

  const gridStroke = 'rgba(0, 0, 0, 0.12)'

  return (
    <AnimatedPage>
      <PageHeader title="Operational monitoring" description="Hybrid telehealth bays, claims velocity, MediCare SOC-style logs." />
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', lg: 'repeat(3, minmax(0, 1fr))' } }}>
        <Card
          sx={(theme) => ({
            borderColor: `${theme.palette.success.main}50`,
            background: `linear-gradient(135deg, ${theme.palette.success.dark} 0%, ${theme.palette.primary.main} 100%)`,
            color: '#fff',
          })}
        >
          <CardHeader
            title={
              <Stack spacing={1}>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Realtime consult anchors
                </Typography>
                {busy ? (
                  <Skeleton variant="rounded" sx={{ bgcolor: 'rgba(255,255,255,0.25)', width: 96, height: 40 }} />
                ) : (
                  <Typography variant="h3">{kpis.liveArrivals}</Typography>
                )}
              </Stack>
            }
          />
          <CardContent sx={{ pt: 0 }}>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Telehealth bays currently locked
            </Typography>
          </CardContent>
        </Card>
        <Card variant="outlined">
          <CardHeader
            title={
              <Stack direction="row" spacing={1.5} alignItems="center">
                <ShowChartIcon aria-hidden fontSize="small" />
                <Typography variant="h6" component="span">
                  Clinical depth
                </Typography>
              </Stack>
            }
            subheader="Captured consult narratives"
          />
          <CardContent>
            <Typography variant="h4" component="span" fontWeight={600}>
              {kpis.consultVolume}
            </Typography>
          </CardContent>
        </Card>
        <Card variant="outlined" sx={(theme) => ({ borderColor: `${theme.palette.warning.main}90`, bgcolor: theme.palette.mode === 'dark' ? `${theme.palette.warning.dark}44` : `${theme.palette.warning.light}77` })}>
          <CardHeader
            title={
              <Stack direction="row" spacing={1.5} alignItems="center">
                <WavesIcon aria-hidden fontSize="small" />
                <Typography variant="h6" component="span">
                  Long dwell (&gt;30&nbsp;min)
                </Typography>
              </Stack>
            }
            subheader="Escalations for clinician rotation"
          />
          <CardContent>
            <Typography variant="h4" component="span" fontWeight={600}>
              {kpis.backlog}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      <Box sx={{ mt: 5, display: 'grid', gap: 4, gridTemplateColumns: { xs: '1fr', xl: 'repeat(2, minmax(0, 1fr))' } }}>
        <AnimatedCard>
          <Card variant="outlined" sx={(theme) => ({ borderColor: `${theme.palette.primary.dark}26` })}>
            <CardHeader title="Claims vs cash velocity" subheader="Rolling MediCare payer mock — synthetic hourly rollup" />
            <CardContent sx={{ height: 288 }}>
              {busy ? (
                <Skeleton variant="rectangular" sx={{ height: '100%', width: '100%' }} />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={billingSeries}>
                    <CartesianGrid strokeDasharray="4 6" stroke={gridStroke} />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip formatter={(value) => [formatCurrency(Number(value ?? 0)), 'Amount']} />
                    <Line type="monotone" dataKey="cash" stroke="#047857" strokeWidth={3} dot={false} />
                    <Line type="monotone" dataKey="claims" stroke="#bbf7d0" strokeWidth={2} strokeDasharray="6 8" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </AnimatedCard>

        <AnimatedCard>
          <Card variant="outlined">
            <CardHeader title="Active arrivals" subheader="Bridging clinician + kiosk presence" />
            <CardContent>
              <Box sx={{ maxHeight: '18rem', overflow: 'auto', pr: 1 }}>
                {busy && [...Array(3)].map((_, i) => <Skeleton key={i} sx={{ mb: 2, height: 80 }} variant="rounded" />)}
                {!busy &&
                  live.map((appointment) => (
                    <Box key={appointment.id} sx={{ mb: 2, borderRadius: 2, border: 1, borderColor: 'divider', px: 2, py: 1.5 }}>
                      <Typography fontWeight={600}>
                        {appointment.patient ?? 'Patient'} · {appointment.doctor ?? 'Doctor'}
                      </Typography>
                      <Typography variant="caption" sx={{ textTransform: 'uppercase', letterSpacing: '0.06em', color: 'success.main', display: 'block', mt: 0.5 }}>
                        Status · {APPOINTMENT_STATUS_LABELS[appointment.status]}
                      </Typography>
                      <Chip label="Locked session" color="success" size="small" sx={{ mt: 1 }} />
                    </Box>
                  ))}
                {!busy && live.length === 0 && (
                  <Typography variant="body2" color="text.secondary">
                    Quiet floor — MediCare kiosk idle.
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </AnimatedCard>
      </Box>

      <Box sx={{ mt: 5 }}>
        <AnimatedCard>
          <Card variant="outlined">
            <CardHeader title="Activity corpus" subheader="Immutable audit deltas for compliance tours" />
            <CardContent>
              <Box sx={{ maxHeight: 420, overflow: 'auto', pr: 1 }}>
                <Stack component="ul" spacing={1.5} sx={{ m: 0, p: 0, listStyle: 'none' }}>
                  {busy && [...Array(6)].map((_, i) => <Skeleton key={i} variant="rounded" sx={{ height: 48 }} />)}
                  {!busy &&
                    logs.map((evt) => (
                      <Box
                        component="li"
                        key={evt.id}
                        sx={{
                          display: 'flex',
                          flexDirection: { xs: 'column', md: 'row' },
                          justifyContent: 'space-between',
                          gap: 1,
                          borderRadius: 2,
                          border: 1,
                          borderColor: 'divider',
                          px: 2,
                          py: 1.5,
                          typography: 'body2',
                        }}
                      >
                        <Typography component="span" fontWeight={600}>
                          {evt.details}
                        </Typography>
                        <Typography component="span" variant="caption" color="text.secondary">
                          {formatDateTime(evt.createdAt)}
                        </Typography>
                      </Box>
                    ))}
                </Stack>
              </Box>
            </CardContent>
          </Card>
        </AnimatedCard>
      </Box>
    </AnimatedPage>
  )
}
