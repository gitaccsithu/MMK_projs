import { useCallback, useEffect, useState } from 'react'
import { format, parseISO } from 'date-fns'
import BiotechIcon from '@mui/icons-material/Biotech'
import DescriptionIcon from '@mui/icons-material/Description'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Grid from '@mui/material/Grid'
import Stack from '@mui/material/Stack'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import Typography from '@mui/material/Typography'
import * as api from '@/services/mockApi'
import type { Consultation, Patient } from '@/types'
import { useAuthStore } from '@/store'
import { AnimatedCard, AnimatedPage } from '@/components/shared/AnimatedPage'
import { PageHeader } from '@/components/shared/PageHeader'

const vaccinations = [
  { name: 'Influenza (quad)', date: '2025-09-12', clinic: 'MediCare+ Hub' },
  { name: 'Tdap booster', date: '2024-06-03', clinic: 'Downtown Vaccine Loft' },
  { name: 'COVID-19 mRNA XBB', date: '2025-02-02', clinic: 'Wellness Corridor' },
]

type TabKey = 'labs' | 'scans' | 'vaccines' | 'notes'

export function MedicalRecordsPage() {
  const user = useAuthStore((s) => s.user)
  const [patient, setPatient] = useState<Patient | null>(null)
  const [consultations, setConsultations] = useState<Consultation[]>([])
  const [doctorNames, setDoctorNames] = useState<Record<string, string>>({})
  const [tab, setTab] = useState<TabKey>('labs')

  const load = useCallback(async () => {
    if (!user?.id) return
    const p = await api.getPatientByUserId(user.id)
    setPatient(p ?? null)
    if (!p) return
    const cs = await api.getConsultations()
    const filtered = cs
      .filter((c) => c.patientId === p.id)
      .sort((a, b) => parseISO(b.createdAt).getTime() - parseISO(a.createdAt).getTime())
    setConsultations(filtered)
    const uniq = [...new Set(filtered.map((c) => c.doctorId))]
    const names: Record<string, string> = {}
    await Promise.all(
      uniq.map(async (id) => {
        const d = await api.getDoctorById(id)
        const u = d ? await api.getUserById(d.userId) : undefined
        names[id] = u?.name ?? 'Clinician'
      })
    )
    setDoctorNames(names)
  }, [user?.id])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <AnimatedPage>
      <Stack spacing={3}>
        <PageHeader title="Medical records" description="Structured intelligence across labs, imaging, vaccinations, visits." />

        <Box sx={{ maxWidth: 900 }}>
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v as TabKey)}
            variant="fullWidth"
            sx={{
              mb: 1,
              '& .MuiTab-root': { typography: 'body2', fontWeight: 600 },
              bgcolor: (t) => (t.palette.mode === 'dark' ? 'rgba(16,185,129,0.08)' : 'rgba(236,253,245,1)'),
              borderRadius: 1,
            }}
          >
            <Tab label="Labs" value="labs" />
            <Tab label="Scans" value="scans" />
            <Tab label="Vaccines" value="vaccines" />
            <Tab label="Consult notes" value="notes" />
          </Tabs>
        </Box>

        {tab === 'labs' && (
          <AnimatedCard>
            <Card variant="outlined" sx={{ borderColor: 'rgba(6, 78, 59, 0.15)' }}>
              <CardContent sx={{ py: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 600, color: 'success.dark', mb: 2 }}>
                  <BiotechIcon />
                  <Typography sx={{ fontWeight: 600, color: 'success.dark' }}>Latest panels</Typography>
                </Box>
                <Stack spacing={2}>
                  {patient?.vitals.map((v) => (
                    <Box
                      key={v.id}
                      sx={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 2,
                        borderRadius: 4,
                        border: 1,
                        borderColor: 'divider',
                        bgcolor: 'action.hover',
                        px: 2,
                        py: 1.5,
                      }}
                    >
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>
                          Synthetic lab proxy · {String(v.type).replace(/_/g, ' ')}
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 700, color: 'success.dark' }}>
                          {v.value}{' '}
                          <Typography component="span" variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                            {v.unit}
                          </Typography>
                        </Typography>
                      </Box>
                      <Chip label={format(parseISO(v.recordedAt), 'MMM d, yyyy · p')} size="small" variant="outlined" />
                    </Box>
                  ))}
                  {!patient?.vitals.length && (
                    <Typography variant="body2" color="text.secondary">
                      Labs sync after your next biometric upload.
                    </Typography>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </AnimatedCard>
        )}

        {tab === 'scans' && (
          <AnimatedCard>
            <Card variant="outlined" sx={{ borderColor: 'rgba(6, 78, 59, 0.15)' }}>
              <CardContent sx={{ py: 3 }}>
                <Grid container spacing={2}>
                  {['Chest CT · low dose', 'Knee MRI · sports injury', 'DEXA lumbar'].map((label) => (
                    <Grid item key={label} xs={12} md={6}>
                      <Box
                        sx={{
                          borderRadius: 3,
                          border: 1,
                          borderColor: 'divider',
                          p: 2,
                          background: (t) =>
                            t.palette.mode === 'dark' ? 'linear-gradient(135deg, rgba(16,185,129,0.12), transparent)' : 'linear-gradient(135deg, rgba(236,253,245,1), transparent)',
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
                          <Box>
                            <Typography sx={{ fontWeight: 600 }}>{label}</Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                              Synthetic DICOM thumbnails stored off-device (demo).
                            </Typography>
                          </Box>
                          <Chip label="Mock" size="small" sx={{ flexShrink: 0 }} />
                        </Box>
                        <Button fullWidth sx={{ mt: 2 }} variant="outlined" size="small" color="success">
                          Request reader summary
                        </Button>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </AnimatedCard>
        )}

        {tab === 'vaccines' && (
          <AnimatedCard>
            <Card variant="outlined" sx={{ borderColor: 'rgba(6, 78, 59, 0.15)' }}>
              <CardContent sx={{ py: 0, px: 3 }}>
                {vaccinations.map((v, i) => (
                  <Box
                    key={v.name}
                    sx={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 2,
                      py: 2,
                      borderBottom: i < vaccinations.length - 1 ? 1 : 0,
                      borderColor: 'divider',
                    }}
                  >
                    <Box>
                      <Typography sx={{ fontWeight: 600 }}>{v.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {v.clinic}
                      </Typography>
                    </Box>
                    <Chip label={v.date} size="small" variant="filled" />
                  </Box>
                ))}
              </CardContent>
            </Card>
          </AnimatedCard>
        )}

        {tab === 'notes' && (
          <AnimatedCard>
            <Card variant="outlined" sx={{ borderColor: 'rgba(6, 78, 59, 0.15)' }}>
              <CardContent sx={{ py: 3 }}>
                <Stack spacing={2}>
                  {consultations.map((c) => (
                    <Box key={c.id} sx={{ borderRadius: 4, border: 1, borderColor: 'divider', bgcolor: 'action.hover', p: 2 }}>
                      <Box
                        sx={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 1,
                          borderBottom: 1,
                          borderColor: 'divider',
                          pb: 2,
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <DescriptionIcon color="success" />
                          <Box>
                            <Typography sx={{ fontWeight: 600 }}>{c.diagnosis}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {doctorNames[c.doctorId] ?? 'Clinician'}
                            </Typography>
                          </Box>
                        </Box>
                        <Chip label={format(parseISO(c.createdAt), 'MMM d, yyyy · p')} size="small" variant="outlined" />
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                        {c.symptoms}
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 2 }}>
                        {c.summary}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', fontStyle: 'italic' }}>
                        Notes locked after sign-off • ID {c.id}
                      </Typography>
                    </Box>
                  ))}
                  {!consultations.length && (
                    <Typography variant="body2" color="text.secondary">
                      No signed notes yet.
                    </Typography>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </AnimatedCard>
        )}
      </Stack>
    </AnimatedPage>
  )
}
