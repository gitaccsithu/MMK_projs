import {
  AnimatedCard,
  AnimatedPage,
} from '@/components/shared/AnimatedPage'
import { EmptyState } from '@/components/shared/EmptyState'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { BarChartCard, LineChartCard, StatCard } from '@/components/charts/ChartCards'
import type { Appointment, Consultation, Invoice, Patient, User } from '@/types'
import * as api from '@/services/mockApi'
import { useAuthStore } from '@/store/index'
import { format, isSameDay } from 'date-fns'
import { useDoctorWorkspace } from '@/pages/doctor/useDoctorWorkspace'
import { useEffect, useMemo, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import AccessTime from '@mui/icons-material/AccessTime'
import AttachMoney from '@mui/icons-material/AttachMoney'
import Assignment from '@mui/icons-material/Assignment'
import Groups from '@mui/icons-material/Groups'
import ShowChart from '@mui/icons-material/ShowChart'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Chip from '@mui/material/Chip'
import Link from '@mui/material/Link'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

function startOfLocalDay(d: Date) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x.getTime()
}

/** MediCare+ doctor home — queues, KPIs, and clinical analytics. */
export function DoctorDashboard() {
  const userId = useAuthStore((s) => s.session?.userId)
  const { doctor, loading: workspaceLoading } = useDoctorWorkspace(userId)
  const [busy, setBusy] = useState(true)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [consultations, setConsultations] = useState<Consultation[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [users, setUsers] = useState<User[]>([])

  useEffect(() => {
    if (!userId || !doctor) return
    let active = true
    void (async () => {
      setBusy(true)
      try {
        const [appt, rxInv, cs, patt, usr] = await Promise.all([
          api.getAppointments(userId, 'doctor'),
          api.getInvoicesForDoctor(doctor.id),
          api.getConsultations(),
          api.getPatients(),
          api.getUsers(),
        ])
        if (!active) return
        setAppointments(appt)
        setInvoices(rxInv)
        setConsultations(cs.filter((c) => c.doctorId === doctor.id))
        setPatients(patt)
        setUsers(usr)
      } finally {
        if (active) setBusy(false)
      }
    })()
    return () => {
      active = false
    }
  }, [userId, doctor])

  const today = useMemo(() => new Date(), [])

  const patientName = useMemo(() => {
    const map = new Map<string, string>()
    patients.forEach((p) => {
      const u = users.find((x) => x.id === p.userId)
      map.set(p.id, u?.name ?? 'Patient')
    })
    return (pid: string) => map.get(pid) ?? pid
  }, [patients, users])

  const todaysSchedule = appointments.filter((a) => {
    try {
      return isSameDay(new Date(a.scheduledAt), today)
    } catch {
      return false
    }
  })

  const patientQueue = useMemo(() => {
    return appointments
      .filter((a) => ['waiting', 'confirmed', 'pending'].includes(a.status))
      .slice()
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
  }, [appointments])

  const mtdRevenue = useMemo(() => {
    const m = today.getMonth()
    const y = today.getFullYear()
    return invoices
      .filter((inv) => {
        const dt = new Date(inv.createdAt)
        return dt.getMonth() === m && dt.getFullYear() === y
      })
      .reduce((sum, inv) => sum + inv.patientPay + (inv.insuranceClaim ?? 0), 0)
  }, [invoices, today])

  const consultTrend = useMemo(() => {
    const days = 10
    const labels: { name: string; count: number; revenue?: number }[] = []
    for (let i = days - 1; i >= 0; i -= 1) {
      const d = new Date(today.getTime())
      d.setDate(d.getDate() - i)
      const stamp = format(d, 'MMM d')
      const dayStart = startOfLocalDay(d)
      const dayEnd = dayStart + 86400000
      const count = consultations.filter((c) => {
        const t = new Date(c.createdAt).getTime()
        return t >= dayStart && t < dayEnd
      }).length
      const rev = invoices
        .filter((inv) => {
          const t = new Date(inv.createdAt).getTime()
          return t >= dayStart && t < dayEnd
        })
        .reduce((s, i) => s + i.amount, 0)
      labels.push({ name: stamp, count, revenue: Math.round(rev) })
    }
    return labels
  }, [consultations, invoices, today])

  const modalitySplit = useMemo(() => {
    const acc: Record<string, number> = {}
    appointments.forEach((a) => {
      acc[a.mode] = (acc[a.mode] ?? 0) + 1
    })
    return Object.entries(acc).map(([name, sessions]) => ({ name, sessions }))
  }, [appointments])

  if (!workspaceLoading && doctor === null) {
    return (
      <AnimatedPage>
        <EmptyState
          title="Clinician workspace unavailable"
          description="We couldn't match this account with a clinician profile. Confirm your MediCare enrollment or contact admin."
          action={{ label: 'Retry data load', onClick: () => window.location.reload() }}
        />
      </AnimatedPage>
    )
  }

  return (
    <AnimatedPage>
      <PageHeader
        title="Clinical dashboard"
        description="Operational snapshot for MediCare+, focused on throughput, adherence, and collection."
      >
        <Chip
          label={format(today, 'EEEE, MMMM d')}
          size="small"
          color="success"
          variant="outlined"
          sx={{ fontWeight: 600 }}
        />
        <Chip
          label={`${doctor?.verificationStatus ?? 'syncing'} · clinician`}
          size="small"
          color="primary"
        />
      </PageHeader>

      <Box
        sx={{
          display: 'grid',
          gap: 3,
          gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', xl: 'repeat(4, 1fr)' },
        }}
      >
        <AnimatedCard>
          <StatCard
            title="Today's encounters"
            value={String(todaysSchedule.length)}
            change="+ queue aware"
            icon={<AccessTime sx={{ fontSize: 22 }} aria-hidden />}
          />
        </AnimatedCard>
        <AnimatedCard>
          <StatCard
            title="Active queue"
            value={String(patientQueue.length)}
            change="Pending / waiting / confirmed"
            icon={<Groups sx={{ fontSize: 22 }} aria-hidden />}
          />
        </AnimatedCard>
        <AnimatedCard>
          <StatCard
            title="Consultations (10d)"
            value={String(consultations.length)}
            change="Stored in mock ledger"
            icon={<ShowChart sx={{ fontSize: 22 }} aria-hidden />}
          />
        </AnimatedCard>
        <AnimatedCard>
          <StatCard
            title="MTD revenue"
            value={`$${mtdRevenue.toLocaleString()}`}
            change="Invoices tied to your calendar"
            icon={<AttachMoney sx={{ fontSize: 22 }} aria-hidden />}
          />
        </AnimatedCard>
      </Box>

      <Box
        sx={{
          mt: 4,
          display: 'grid',
          gap: 3,
          gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' },
        }}
      >
        <AnimatedCard>
          <LineChartCard
            title="Consultation cadence"
            description="Completed consult documentation per day (mock storage)."
            data={consultTrend}
            dataKey="count"
            xKey="name"
            loading={busy || workspaceLoading}
            height={300}
          />
        </AnimatedCard>
        <AnimatedCard>
          <BarChartCard
            title="Visit modalities"
            description="How patients are engaging with your practice."
            data={modalitySplit}
            dataKey="sessions"
            xKey="name"
            loading={busy || workspaceLoading}
            height={300}
          />
        </AnimatedCard>
      </Box>

      <Box
        sx={{
          mt: 4,
          display: 'grid',
          gap: 3,
          gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, 1fr)' },
        }}
      >
        <AnimatedCard>
          <Card variant="outlined" sx={{ borderColor: 'success.light' }}>
            <CardHeader
              avatar={<Assignment color="primary" />}
              title="Today's schedule"
              subheader="Across clinic and virtual modalities."
              titleTypographyProps={{ variant: 'subtitle1' }}
            />
            <CardContent>
              <Stack spacing={1.5}>
                {todaysSchedule.length === 0 && (
                  <Typography variant="body2" color="text.secondary">
                    No visits today — hydrate seed data or extend hours.
                  </Typography>
                )}
                {todaysSchedule.slice(0, 8).map((a) => (
                  <Box
                    key={a.id}
                    component={RouterLink}
                    to={`/doctor/consultation/${a.id}`}
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      borderRadius: 2,
                      border: 1,
                      borderColor: 'divider',
                      bgcolor: 'action.hover',
                      px: 1.5,
                      py: 1,
                      textDecoration: 'none',
                      color: 'inherit',
                      transition: (theme) => theme.transitions.create(['border-color', 'background-color']),
                      '&:hover': {
                        borderColor: 'primary.light',
                        bgcolor: (theme) => `${theme.palette.primary.main}14`,
                      },
                    }}
                  >
                    <Typography variant="body2" color="success.dark" sx={{ fontWeight: 600 }}>
                      {patientName(a.patientId)}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0.5, mt: 0.25 }}>
                      <Typography variant="caption" color="text.secondary">
                        {format(new Date(a.scheduledAt), 'p')} ·
                      </Typography>
                      <StatusBadge status={a.status} />
                    </Box>
                  </Box>
                ))}
                {todaysSchedule.length > 8 && (
                  <Link component={RouterLink} to="/doctor/appointments" variant="caption" fontWeight={600}>
                    View calendar
                  </Link>
                )}
              </Stack>
            </CardContent>
          </Card>
        </AnimatedCard>

        <AnimatedCard>
          <Card variant="outlined" sx={{ borderColor: 'success.light' }}>
            <CardHeader
              avatar={<Groups color="primary" />}
              title="Patient queue"
              subheader="Patients awaiting acknowledgement or bedside."
              titleTypographyProps={{ variant: 'subtitle1' }}
            />
            <CardContent>
              <Stack spacing={1.5}>
                {patientQueue.length === 0 && (
                  <Typography variant="body2" color="text.secondary">
                    Clear queue · enjoy the calm.
                  </Typography>
                )}
                {patientQueue.slice(0, 8).map((a) => (
                  <Stack
                    key={a.id}
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    sx={{
                      borderRadius: 2,
                      bgcolor: (theme) =>
                        theme.palette.mode === 'dark' ? 'success.dark' : 'success.light',
                      opacity: 0.92,
                      px: 1.5,
                      py: 1,
                    }}
                  >
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {patientName(a.patientId)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {format(new Date(a.scheduledAt), 'MMM d · p')} · Slot {a.queuePosition ?? '—'}
                      </Typography>
                    </Box>
                    <StatusBadge status={a.status} />
                  </Stack>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </AnimatedCard>
      </Box>
    </AnimatedPage>
  )
}
