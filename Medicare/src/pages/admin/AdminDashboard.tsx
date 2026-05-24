import { useEffect, useMemo, useState } from 'react'
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart'
import PeopleIcon from '@mui/icons-material/People'
import AssignmentIcon from '@mui/icons-material/Assignment'
import EventAvailableIcon from '@mui/icons-material/EventAvailable'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Skeleton from '@mui/material/Skeleton'
import Typography from '@mui/material/Typography'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis } from 'recharts'
import { AnimatedCard, AnimatedPage } from '@/components/shared/AnimatedPage'
import { PageHeader } from '@/components/shared/PageHeader'
import { PieChartCard, StatCard } from '@/components/charts/ChartCards'
import * as api from '@/services/mockApi'
import { formatRelativeTime } from '@/utils/cn'

export function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [counts, setCounts] = useState({ doctors: 0, patients: 0, consultations: 0, appointmentsToday: 0 })
  const [activity, setActivity] = useState<Awaited<ReturnType<typeof api.getActivityLogs>>>([])
  const [distribution, setDistribution] = useState<{ name: string; value: number }[]>([])

  useEffect(() => {
    async function boot() {
      setLoading(true)
      const users = await api.getUsers()
      const patients = await api.getPatients()
      const docs = await api.getDoctors()
      const consults = await api.getConsultations()
      const appts = await api.getAppointments()
      const today = appts.filter((a) =>
        new Date(a.scheduledAt).toDateString() === new Date().toDateString()
      ).length
      const byRole = users.reduce(
        (acc, u) => {
          acc[u.role] = (acc[u.role] ?? 0) + 1
          return acc
        },
        {} as Record<string, number>
      )
      setCounts({
        doctors: docs.filter((d) => d.verificationStatus === 'approved').length,
        patients: patients.length,
        consultations: consults.length,
        appointmentsToday: today,
      })
      const pie = ['patient', 'doctor', 'receptionist', 'admin']
        .map((role) => ({ name: role, value: byRole[role] ?? 0 }))
        .filter((x) => x.value > 0)
      setDistribution(pie.length ? pie : [{ name: 'patients', value: patients.length }])
      const logs = await api.getActivityLogs()
      setActivity(logs.slice(0, 12))
      setLoading(false)
    }
    void boot()
  }, [])

  const series = useMemo(
    () => [
      { name: 'w1', triage: 12, billed: 8 },
      { name: 'w2', triage: 18, billed: 10 },
      { name: 'w3', triage: 15, billed: 12 },
      { name: 'w4', triage: 22, billed: 16 },
      { name: 'w5', triage: 25, billed: 20 },
      { name: 'w6', triage: 28, billed: 24 },
    ],
    []
  )

  const gridStroke = 'rgba(0, 0, 0, 0.12)'

  return (
    <AnimatedPage>
      <PageHeader
        title="System control tower"
        description="Population health KPIs seeded from MediCare synthetic feeds — refreshed on mount."
      />
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', lg: 'repeat(4, minmax(0, 1fr))' } }}>
        {loading ? (
          [...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent sx={{ p: 3 }}>
                <Skeleton variant="rectangular" sx={{ height: 96 }} />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <StatCard icon={<MonitorHeartIcon />} title="Active patients" value={counts.patients.toString()} change="+3.8% QoQ" />
            <StatCard icon={<PeopleIcon />} title="Verified clinicians" value={counts.doctors.toString()} change="92% credentialed" />
            <StatCard icon={<AssignmentIcon />} title="Consult summaries" value={counts.consultations.toString()} change="Rolling 180d" />
            <StatCard icon={<EventAvailableIcon />} title="Arrivals today" value={`${counts.appointmentsToday}`} change="Operational desk" />
          </>
        )}
      </Box>

      <Box sx={{ mt: 4, display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', xl: '2fr 1fr' }, alignItems: 'stretch' }}>
        <AnimatedCard>
          <Card variant="outlined" sx={(theme) => ({ borderColor: `${theme.palette.primary.dark}26` })}>
            <CardHeader title="Volumes · triage vs billing" subheader="Demonstration KPI curve emulating revenue cycle overlays" />
            <CardContent sx={{ height: 320, pt: 0 }}>
              {loading ? (
                <Skeleton variant="rectangular" sx={{ height: '100%', width: '100%' }} />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={series}>
                    <CartesianGrid strokeDasharray="3 6" stroke={gridStroke} />
                    <XAxis dataKey="name" />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 12,
                        border: '1px solid rgba(0,0,0,0.08)',
                        background: 'rgba(255,255,255,0.96)',
                      }}
                    />
                    <Area type="monotone" dataKey="triage" stroke="#059669" fill="#bbf7d0" fillOpacity={0.85} />
                    <Area type="monotone" dataKey="billed" stroke="#047857" fill="#ecfccb" fillOpacity={0.5} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </AnimatedCard>
        <AnimatedCard>
          {loading ? (
            <Skeleton variant="rectangular" sx={{ height: 320, width: '100%' }} />
          ) : (
            <PieChartCard
              title="User mix"
              description="Accounts by MediCare persona"
              data={distribution}
              dataKey="value"
              nameKey="name"
              height={320}
              loading={false}
            />
          )}
        </AnimatedCard>
      </Box>

      <Box sx={{ mt: 4 }}>
      <AnimatedCard>
        <Card variant="outlined">
          <CardHeader title="Operational activity" subheader="Administrative deltas pulled from seeded audit rails" />
          <CardContent>
            <Box
              sx={{
                maxHeight: 'min(45vh, 480px)',
                overflow: 'auto',
                pr: 2,
              }}
            >
              <Box component="ul" sx={{ m: 0, p: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 2 }}>
                {(loading ? [] : activity).map((evt) => (
                  <Box
                    component="li"
                    key={evt.id}
                    sx={{
                      display: 'flex',
                      flexDirection: { xs: 'column', lg: 'row' },
                      alignItems: { lg: 'flex-start' },
                      justifyContent: { lg: 'space-between' },
                      gap: 1,
                      borderRadius: 2,
                      border: 1,
                      borderColor: 'divider',
                      px: 2,
                      py: 1.5,
                      typography: 'body2',
                    }}
                  >
                    <Box>
                      <Typography fontWeight={600} sx={{ textTransform: 'capitalize' }}>
                        {evt.action.replace(/_/g, ' ')}
                      </Typography>
                      <Typography variant="caption" display="block" color="text.secondary">
                        Entity · {evt.entity} ({evt.entityId})
                      </Typography>
                      <Typography variant="caption" display="block" color="text.secondary">
                        {evt.details}
                      </Typography>
                    </Box>
                    <Typography component="time" variant="caption" sx={{ textTransform: 'uppercase', letterSpacing: '0.06em', color: 'success.main' }}>
                      {formatRelativeTime(evt.createdAt)}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </CardContent>
        </Card>
      </AnimatedCard>
      </Box>
    </AnimatedPage>
  )
}
