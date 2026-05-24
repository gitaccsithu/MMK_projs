import { AnimatedPage } from '@/components/shared/AnimatedPage'
import { EmptyState } from '@/components/shared/EmptyState'
import { PageHeader } from '@/components/shared/PageHeader'
import { AreaChartCard, BarChartCard, LineChartCard, PieChartCard, StatCard } from '@/components/charts/ChartCards'
import type { Appointment, Consultation, Invoice, Patient, User } from '@/types'
import * as api from '@/services/mockApi'
import { useAuthStore } from '@/store/index'
import { differenceInYears } from 'date-fns'
import { useDoctorWorkspace } from '@/pages/doctor/useDoctorWorkspace'
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet'
import BarChartIcon from '@mui/icons-material/BarChart'
import LayersIcon from '@mui/icons-material/Layers'
import Box from '@mui/material/Box'
import { useEffect, useMemo, useState } from 'react'

/** Population & revenue intelligence for clinician leadership rounds. */
export function DoctorAnalyticsPage() {
  const userId = useAuthStore((s) => s.session?.userId)
  const { doctor, loading: wsLoad } = useDoctorWorkspace(userId)
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
        const [appt, invoicesDoc, patt, usr, cs] = await Promise.all([
          api.getAppointments(userId, 'doctor'),
          api.getInvoicesForDoctor(doctor.id),
          api.getPatients(),
          api.getUsers(),
          api.getConsultations(),
        ])
        if (!active) return
        setAppointments(appt)
        setInvoices(invoicesDoc)
        setPatients(patt)
        setUsers(usr)
        setConsultations(cs.filter((c) => c.doctorId === doctor.id))
      } finally {
        if (active) setBusy(false)
      }
    })()
    return () => {
      active = false
    }
  }, [userId, doctor])

  const patientIds = useMemo(() => [...new Set(appointments.map((a) => a.patientId))], [appointments])

  const ageBuckets = useMemo(() => {
    const buckets: Record<string, number> = {
      Under30: 0,
      '31-45': 0,
      '46-65': 0,
      Seniors: 0,
      Unknown: 0,
    }
    patientIds.forEach((pid) => {
      const patient = patients.find((p) => p.id === pid)
      const user = users.find((u) => u.id === patient?.userId)
      if (!user?.dateOfBirth) {
        buckets.Unknown += 1
        return
      }
      const yrs = differenceInYears(new Date(), new Date(user.dateOfBirth))
      if (yrs < 30) buckets.Under30 += 1
      else if (yrs <= 45) buckets['31-45'] += 1
      else if (yrs <= 65) buckets['46-65'] += 1
      else buckets.Seniors += 1
    })
    return Object.entries(buckets).map(([name, value]) => ({ name, visits: value }))
  }, [patientIds, patients, users])

  const diagnoses = useMemo(() => {
    const tallies: Record<string, number> = {}
    consultations.forEach((c) => {
      const src = (c.diagnosis ?? '').trim()
      if (!src) return
      src
        .split(/[,;/]/)
        .map((s) => s.trim())
        .filter(Boolean)
        .forEach((token) => {
          tallies[token] = (tallies[token] ?? 0) + 1
        })
    })
    const top = Object.entries(tallies).sort((a, b) => b[1] - a[1]).slice(0, 8)
    return top.map(([name, count]) => ({ name, occurrences: count }))
  }, [consultations])

  const invoiceTrend = useMemo(() => {
    const tally: Record<string, number> = {}
    invoices.forEach((inv) => {
      const stamp = `${new Date(inv.createdAt).toLocaleString('default', { month: 'short' })} '${String(new Date(inv.createdAt).getFullYear()).slice(2)}`
      tally[stamp] = (tally[stamp] ?? 0) + inv.amount
    })
    return Object.entries(tally)
      .map(([name, amount]) => ({ name, revenue: Number(amount.toFixed(0)) }))
      .slice(-6)
  }, [invoices])

  const modalityMix = useMemo(() => {
    const acc: Record<string, number> = {}
    appointments.forEach((a) => {
      acc[a.mode] = (acc[a.mode] ?? 0) + 1
    })
    return Object.entries(acc).map(([name, value]) => ({ name, share: value }))
  }, [appointments])

  if (!wsLoad && doctor === null) {
    return (
      <AnimatedPage>
        <EmptyState title="Analytics unavailable" description="No clinician context." />
      </AnimatedPage>
    )
  }

  const mtd = invoices.reduce((sum, inv) => sum + inv.amount, 0)

  return (
    <AnimatedPage>
      <PageHeader title="Analytics studio" description="Consultation velocity, payer mix metaphors, and population pyramids stitched from mocked encounters." />

      <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' } }}>
        <StatCard title="Unique patients tracked" value={String(patientIds.length)} icon={<LayersIcon sx={{ fontSize: 26 }} />} />
        <StatCard title="Documented consultations" value={String(consultations.length)} icon={<BarChartIcon sx={{ fontSize: 26 }} />} />
        <StatCard title="Gross invoiced charges" value={`$${mtd.toLocaleString()}`} icon={<AccountBalanceWalletIcon sx={{ fontSize: 26 }} />} />
      </Box>

      <Box sx={{ mt: 4, display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', xl: '2fr 1fr' } }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <LineChartCard
            title="Revenue glide path"
            description="Charges captured on invoices tied to your visits."
            data={invoiceTrend}
            dataKey="revenue"
            xKey="name"
            loading={busy}
            height={290}
          />
          <AreaChartCard
            title="Visit modality load"
            description="Channel segmentation for staffing telehealth anchors."
            data={modalityMix}
            dataKey="share"
            xKey="name"
            loading={busy}
            height={290}
          />
        </Box>
        <PieChartCard
          title="Panel age bands"
          description="Derived from synced patient profiles."
          data={ageBuckets}
          dataKey="visits"
          nameKey="name"
          loading={busy}
          height={320}
        />
      </Box>

      <Box sx={{ mt: 4, display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, 1fr)' } }}>
        <BarChartCard
          title="Top diagnostic tokens"
          description="Parses delimiter-separated diagnosis phrases on saved consults."
          data={diagnoses}
          dataKey="occurrences"
          xKey="name"
          loading={busy}
          height={320}
        />
        <PieChartCard
          title="Modality donut"
          description="Operational planning for exam rooms vs virtual bays."
          data={modalityMix.map((row) => ({ name: row.name, value: row.share }))}
          dataKey="value"
          nameKey="name"
          loading={busy}
          height={320}
        />
      </Box>
    </AnimatedPage>
  )
}
