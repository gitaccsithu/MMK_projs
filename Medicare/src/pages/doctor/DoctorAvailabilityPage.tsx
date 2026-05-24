import { AnimatedPage } from '@/components/shared/AnimatedPage'
import { EmptyState } from '@/components/shared/EmptyState'
import { PageHeader } from '@/components/shared/PageHeader'
import type { Doctor, DoctorAvailability } from '@/types'
import * as api from '@/services/mockApi'
import { useAuthStore } from '@/store/index'
import { useDoctorWorkspace } from '@/pages/doctor/useDoctorWorkspace'
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment'
import PauseCircleOutlinedIcon from '@mui/icons-material/PauseCircleOutlined'
import TodayIcon from '@mui/icons-material/Today'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Chip from '@mui/material/Chip'
import FormControlLabel from '@mui/material/FormControlLabel'
import Stack from '@mui/material/Stack'
import Switch from '@mui/material/Switch'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

/** Configure weekly grids, blackout days, and emergency coverage. */
export function DoctorAvailabilityPage() {
  const userId = useAuthStore((s) => s.session?.userId)
  const { doctor, loading: wsLoad, reload } = useDoctorWorkspace(userId)
  const [busy, setBusy] = useState(false)
  const [local, setLocal] = useState<Doctor | null>(null)
  const [holidayInput, setHolidayInput] = useState('')

  useEffect(() => {
    setLocal(doctor)
  }, [doctor])

  const save = async (updates: Partial<Doctor>) => {
    if (!local) return
    setBusy(true)
    const res = await api.updateDoctor(local.id, updates)
    setBusy(false)
    if (res.error) toast.error(res.error)
    else {
      toast.success('Availability saved.')
      await reload()
      if (res.data) setLocal(res.data)
    }
  }

  const toggleDayBlocked = async (day: string) => {
    if (!local) return
    const nextAvail: DoctorAvailability[] = local.availability.map((row) =>
      row.day === day ? { ...row, blocked: !row.blocked } : row
    )
    setLocal({ ...local, availability: nextAvail })
    await save({ availability: nextAvail })
  }

  const toggleEmergency = async (value: boolean) => {
    if (!local) return
    setLocal({ ...local, emergencyAvailable: value })
    await save({ emergencyAvailable: value })
  }

  const pushHoliday = async () => {
    if (!local || !holidayInput.trim()) return
    const clean = holidayInput.trim()
    const merged = [...(local.blockedDates ?? []), clean]
    const uniq = [...new Set(merged)]
    setHolidayInput('')
    setLocal({ ...local, blockedDates: uniq })
    await save({ blockedDates: uniq })
  }

  const removeHoliday = useCallback(
    async (dateIso: string) => {
      if (!local?.blockedDates) return
      const next = local.blockedDates.filter((d) => d !== dateIso)
      setLocal({ ...local, blockedDates: next })
      await save({ blockedDates: next })
    },
    [local]
  )

  if (!wsLoad && doctor === null) {
    return (
      <AnimatedPage>
        <EmptyState title="Scheduling unavailable" description="No clinician record found." />
      </AnimatedPage>
    )
  }

  if (!local) return null

  return (
    <AnimatedPage>
      <PageHeader title="Availability" description="Guardrails for weekly templates, blackout dates, and after-hours escalation." />

      <Box
        sx={{
          display: 'grid',
          gap: 3,
          gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' },
        }}
      >
        <Card variant="outlined" sx={{ borderColor: 'success.light' }}>
          <CardHeader
            title={
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <TodayIcon color="primary" />
                <span>Weekly blueprint</span>
              </Stack>
            }
            subheader="Toggle days you are fully blocked for MediCare bookings."
            titleTypographyProps={{ variant: 'h6' }}
            action={<Chip label={`${local.availability.length} rows`} size="small" />}
          />
          <CardContent>
            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' } }}>
              {local.availability.map((row) => (
                <Box
                  key={row.day}
                  sx={{
                    borderRadius: 3,
                    border: 1,
                    borderColor: 'success.light',
                    bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'success.dark' : 'success.light'),
                    opacity: 0.95,
                    p: 2,
                  }}
                >
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: 3 }}>
                        {row.day}
                      </Typography>
                      <Typography variant="body2" color="success.dark" sx={{ fontWeight: 700 }}>
                        {row.blocked ? 'Closed for visits' : 'Accepting bookings'}
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', borderRadius: 99, bgcolor: 'background.paper', px: 1, py: 0.5 }}>
                      <PauseCircleOutlinedIcon sx={{ fontSize: 14 }} aria-hidden />
                      <Switch checked={Boolean(row.blocked)} onChange={() => void toggleDayBlocked(row.day)} disabled={busy} />
                    </Stack>
                  </Stack>
                  <Stack direction="row" spacing={0.75} useFlexGap sx={{ flexWrap: 'wrap', mt: 2 }}>
                    {row.slots.map((slot) => (
                      <Chip key={`${row.day}-${slot}`} label={slot} size="small" variant="outlined" />
                    ))}
                    {row.slots.length === 0 && (
                      <Typography variant="caption" color="text.secondary">
                        No templated visits — adjust seed or expand slots offline.
                      </Typography>
                    )}
                  </Stack>
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>

        <Stack spacing={3}>
          <Card variant="outlined" sx={{ borderColor: 'success.light' }}>
            <CardHeader
              title={
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                  <LocalFireDepartmentIcon color="primary" />
                  <span>Emergency flag</span>
                </Stack>
              }
              subheader="Signal availability for escalation queue (mock)."
              titleTypographyProps={{ variant: 'subtitle1' }}
            />
            <CardContent sx={{ pt: 0 }}>
              <FormControlLabel
                control={<Switch checked={local.emergencyAvailable} onChange={(_, v) => void toggleEmergency(v)} disabled={busy} />}
                label="Emergency coverage"
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                When enabled the operations console can prioritize emergent directs to your cell — wire to alerting in Phase 2.
              </Typography>
            </CardContent>
          </Card>

          <Card variant="outlined" sx={{ borderColor: 'success.light' }}>
            <CardHeader title="Holiday & blackout ledger" subheader="Add ISO yyyy-mm-dd values to forbid online booking." />
            <CardContent sx={{ pt: 0 }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mb: 2 }}>
                <TextField
                  type="date"
                  value={holidayInput}
                  onChange={(e) => setHolidayInput(e.target.value)}
                  fullWidth
                  slotProps={{ inputLabel: { shrink: true } }}
                  label="Date"
                />
                <Button variant="contained" sx={{ alignSelf: { sm: 'center' }, flexShrink: 0 }} onClick={() => void pushHoliday()} disabled={busy || !holidayInput.trim()}>
                  Block date
                </Button>
              </Stack>
              <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
                {(local.blockedDates ?? []).length === 0 && (
                  <Typography variant="caption" color="text.secondary">
                    No holidays recorded.
                  </Typography>
                )}
                {(local.blockedDates ?? []).map((d) => (
                  <Button key={d} size="small" variant="contained" color="secondary" disabled={busy} onClick={() => void removeHoliday(d)}>
                    {d} ×
                  </Button>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      </Box>
    </AnimatedPage>
  )
}
