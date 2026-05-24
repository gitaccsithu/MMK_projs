import { useCallback, useEffect, useState } from 'react'
import { format, parseISO } from 'date-fns'
import AlarmIcon from '@mui/icons-material/Alarm'
import DownloadIcon from '@mui/icons-material/Download'
import ScienceIcon from '@mui/icons-material/Science'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Chip from '@mui/material/Chip'
import Skeleton from '@mui/material/Skeleton'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { toast } from 'sonner'
import * as api from '@/services/mockApi'
import type { Prescription } from '@/types'
import { useAuthStore } from '@/store'
import { AnimatedCard, AnimatedPage } from '@/components/shared/AnimatedPage'
import { EmptyState } from '@/components/shared/EmptyState'
import { PageHeader } from '@/components/shared/PageHeader'

export function PrescriptionsPage() {
  const user = useAuthStore((s) => s.user)
  const [patientId, setPatientId] = useState<string | null>(null)
  const [list, setList] = useState<Prescription[]>([])
  const [doctorNames, setDoctorNames] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!user?.id) {
      setList([])
      setLoading(false)
      return
    }
    setLoading(true)
    const p = await api.getPatientByUserId(user.id)
    setPatientId(p?.id ?? null)
    const rx = p ? await api.getPrescriptions(p.id) : []
    setList(rx)
    await Promise.all(
      [...new Set(rx.map((r) => r.doctorId))].map(async (id) => {
        const doc = await api.getDoctorById(id)
        const name = doc ? await api.getUserById(doc.userId) : undefined
        setDoctorNames((prev) => ({ ...prev, [id]: name?.name ?? 'Clinician' }))
      })
    )
    setLoading(false)
  }, [user?.id])

  useEffect(() => {
    void load()
  }, [load])

  const downloadMockPdf = async (rx: Prescription) => {
    const text = [
      'MediCare+ Prescription Summary (Demo PDF)',
      `Rx #: ${rx.id}`,
      `Diagnosis: ${rx.diagnosis ?? '—'}`,
      ...rx.medicines.map((m) => `- ${m.name} ${m.dosage} (${m.frequency}) · ${m.duration}`),
      `Issued ${format(parseISO(rx.createdAt), 'PP pp')}`,
    ].join('\n')
    const blob = new Blob([text], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${rx.id}-medicare-prescription.pdf`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('PDF saved', { description: 'Mock MIME type for prototyping.' })
  }

  return (
    <AnimatedPage>
      <Stack spacing={3}>
        <PageHeader title="Prescriptions" description="Active therapy plans synced from clinician visits." />

        {loading &&
          [...Array(4)].map((_, i) => (
            <AnimatedCard key={i}>
              <Skeleton variant="rectangular" height={176} sx={{ borderRadius: 2 }} />
            </AnimatedCard>
          ))}

        {!loading && patientId && list.length === 0 && (
          <AnimatedCard>
            <EmptyState title="No prescriptions on file" description="Your care team publishes them after visits." />
          </AnimatedCard>
        )}

        {!loading &&
          list.map((rx) => (
            <AnimatedCard key={rx.id}>
              <Card variant="outlined" sx={{ borderColor: 'rgba(6, 78, 59, 0.15)' }}>
                <CardHeader
                  title={<Typography variant="h6">{rx.diagnosis ?? 'Care plan bundle'}</Typography>}
                  subheader={doctorNames[rx.doctorId] ?? 'Medication review'}
                  action={
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      <Chip label={rx.status} size="small" color={rx.status === 'active' ? 'success' : 'default'} />
                      {rx.refillReminder && (
                        <Chip
                          size="small"
                          variant="outlined"
                          icon={<AlarmIcon sx={{ fontSize: '18px !important' }} />}
                          label={`refill ${formatDistanceShort(rx.refillReminder)}`}
                        />
                      )}
                    </Box>
                  }
                />
                <CardContent>
                  <Stack component="ul" spacing={2} sx={{ m: 0, p: 0, listStyle: 'none' }}>
                    {rx.medicines.map((m) => (
                      <Box
                        component="li"
                        key={m.id}
                        sx={{ borderRadius: 3, border: 1, borderColor: 'divider', bgcolor: 'action.hover', px: 2, py: 1.5 }}
                      >
                        <Typography sx={{ fontWeight: 600, color: 'success.dark' }}>
                          {m.name}{' '}
                          <Typography component="span" variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>
                            {m.dosage}
                          </Typography>
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {m.frequency} · {m.duration} · {m.category}
                        </Typography>
                        <Typography variant="caption" sx={{ mt: 0.5, display: 'block' }}>
                          {m.instructions}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
                    <Button type="button" variant="outlined" size="small" startIcon={<DownloadIcon />} onClick={() => void downloadMockPdf(rx)}>
                      PDF (mock blob)
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </AnimatedCard>
          ))}

        <AnimatedCard>
          <Card variant="outlined" sx={{ borderStyle: 'dashed', bgcolor: (t) => (t.palette.mode === 'dark' ? 'rgba(16,185,129,0.12)' : 'rgba(236,253,245,0.8)') }}>
            <CardContent>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2, py: 2, typography: 'body2', color: 'success.dark' }}>
                <ScienceIcon sx={{ fontSize: 48, color: 'success.main', flexShrink: 0 }} />
                <Box>
                  <Typography sx={{ fontWeight: 600 }}>Refill concierge</Typography>
                  <Typography variant="body2" color="text.secondary">
                    We simulated pharmacy SMS windows—production would route to Curexa / PillPack mocks.
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </AnimatedCard>
      </Stack>
    </AnimatedPage>
  )
}

function formatDistanceShort(iso: string) {
  return format(parseISO(iso), 'MMM d · p')
}
