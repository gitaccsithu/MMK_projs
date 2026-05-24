import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { addDays } from 'date-fns'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import BusinessIcon from '@mui/icons-material/Business'
import CheckIcon from '@mui/icons-material/Check'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import MedicalServicesIcon from '@mui/icons-material/MedicalServices'
import SearchIcon from '@mui/icons-material/Search'
import VideocamIcon from '@mui/icons-material/Videocam'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Chip from '@mui/material/Chip'
import FormControl from '@mui/material/FormControl'
import Grid from '@mui/material/Grid'
import InputAdornment from '@mui/material/InputAdornment'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import Skeleton from '@mui/material/Skeleton'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { toast } from 'sonner'
import { z } from 'zod'
import { AnimatedCard, AnimatedPage } from '@/components/shared/AnimatedPage'
import { PageHeader } from '@/components/shared/PageHeader'
import * as api from '@/services/mockApi'
import type { AppointmentMode, Doctor, DoctorSpecialty } from '@/types'
import { SPECIALTIES } from '@/types'
import { useAuthStore } from '@/store'

const bookingSchema = z.object({
  reason: z.string().trim().min(3, 'Add a brief reason.'),
  notes: z.string().optional(),
})

type BookingForm = z.infer<typeof bookingSchema>

type VisitModeUi = Extract<AppointmentMode, 'online' | 'clinic'>

async function doctorWithName(doctor: Doctor) {
  const u = await api.getUserById(doctor.userId)
  return { doctor, label: u?.name ?? doctor.specialty }
}

const DAY_LOOKUP: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }

function composeSlotIso(day: string, time: string) {
  const abbrev = day.slice(0, 3) as keyof typeof DAY_LOOKUP
  const dow = DAY_LOOKUP[abbrev]
  const base = new Date()
  const diff = ((dow + 7 - base.getDay()) % 7) + 1
  const slotDate = addDays(base, Number.isFinite(diff) ? diff : 7)
  const [hStr, mStr] = time.split(':')
  const hours = Number(hStr ?? '10')
  const minutes = Number(mStr ?? '0')
  slotDate.setHours(hours, minutes, 0, 0)
  return slotDate.toISOString()
}

export function BookAppointmentPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [enriched, setEnriched] = useState<{ doctor: Doctor; label: string }[]>([])
  const [specialty, setSpecialty] = useState<string>('any')
  const [query, setQuery] = useState('')
  const [visitMode, setVisitMode] = useState<VisitModeUi>('clinic')
  const [chosen, setChosen] = useState<Doctor | null>(null)
  const [patientId, setPatientId] = useState<string | null>(null)
  const [slot, setSlot] = useState<{ day: string; time: string } | null>(null)

  useEffect(() => {
    async function fetchDocs() {
      setLoading(true)
      const docs = await api.searchDoctors({})
      const rows = await Promise.all(docs.map((d) => doctorWithName(d)))
      setEnriched(rows)
      setLoading(false)
    }
    void fetchDocs()
  }, [])

  useEffect(() => {
    if (!user?.id) return
    void api.getPatientByUserId(user.id).then((p) => setPatientId(p?.id ?? null))
  }, [user?.id])

  const filtered = useMemo(() => {
    let list = enriched
    if (specialty !== 'any') list = list.filter((r) => r.doctor.specialty === specialty)
    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter((r) => `${r.label} ${r.doctor.specialty} ${r.doctor.bio}`.toLowerCase().includes(q))
    }
    if (visitMode === 'online') list = [...list].sort((a, b) => (b.doctor.totalConsultations || 0) - (a.doctor.totalConsultations || 0))
    return list
  }, [enriched, query, specialty, visitMode])

  const slotGrid = chosen?.availability ?? []

  const form = useForm<BookingForm>({
    resolver: zodResolver(bookingSchema),
    defaultValues: { reason: '', notes: '' },
  })

  const onSubmit = form.handleSubmit(async (values) => {
    if (!user?.id || !patientId || !chosen || !slot) {
      toast.error('Complete each step before confirming.')
      return
    }
    const mode: AppointmentMode = visitMode === 'online' ? 'online' : 'clinic'
    const scheduledIso = composeSlotIso(slot.day, slot.time)
    const res = await api.createAppointment({
      patientId,
      doctorId: chosen.id,
      clinicId: chosen.clinicIds[0],
      mode,
      status: 'confirmed',
      scheduledAt: scheduledIso,
      duration: 30,
      reason: values.reason,
      notes: values.notes,
    })
    if (res.error) {
      toast.error(res.error)
      return
    }
    toast.success('Appointment booked', { description: 'You will receive a confirmation notice.' })
    navigate('/patient/appointments')
  })

  const steps = ['Browse', 'Slot', 'Confirm']
  const clinicianLabel = chosen ? enriched.find((e) => e.doctor.id === chosen.id)?.label : ''

  return (
    <AnimatedPage>
      <Stack spacing={3}>
        <PageHeader title="Book a visit" description="Choose a clinician, modality, then lock a time slot.">
          <Button variant="outlined" component={Link} to="/patient/dashboard">
            Dashboard
          </Button>
        </PageHeader>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1, mb: 2 }}>
          {steps.map((label, idx) => (
            <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: 32,
                  height: 32,
                  px: 1,
                  borderRadius: '999px',
                  fontSize: 12,
                  fontWeight: 700,
                  typography: 'overline',
                  bgcolor: idx === step ? 'primary.main' : 'action.hover',
                  color: idx === step ? 'primary.contrastText' : 'text.secondary',
                }}
              >
                {idx + 1}
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: 1, fontWeight: 700 }}>
                {label}
              </Typography>
              {idx < steps.length - 1 && <ChevronRightIcon sx={{ fontSize: 18, opacity: 0.55 }} />}
            </Box>
          ))}
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} lg={5}>
            <AnimatedCard>
              <Card variant="outlined" sx={{ borderColor: 'rgba(6, 78, 59, 0.15)' }}>
                <CardHeader
                  title={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <MedicalServicesIcon color="success" />
                      <Typography variant="h6" component="span">
                        Find your clinician
                      </Typography>
                    </Box>
                  }
                  subheader="Telehealth-ready doctors are prioritized for video visits."
                />
                <CardContent>
                  <Stack spacing={3}>
                    <Stack direction="row" sx={{ p: 0.5, borderRadius: 2, bgcolor: 'action.hover', border: 1, borderColor: 'divider' }}>
                      <Button
                        type="button"
                        fullWidth
                        variant={visitMode === 'clinic' ? 'contained' : 'text'}
                        onClick={() => setVisitMode('clinic')}
                        startIcon={<BusinessIcon />}
                        sx={{ boxShadow: visitMode === 'clinic' ? 1 : 0 }}
                      >
                        Clinic
                      </Button>
                      <Button
                        type="button"
                        fullWidth
                        variant={visitMode === 'online' ? 'contained' : 'text'}
                        onClick={() => setVisitMode('online')}
                        startIcon={<VideocamIcon />}
                        sx={{ boxShadow: visitMode === 'online' ? 1 : 0 }}
                      >
                        Online
                      </Button>
                    </Stack>

                    <FormControl fullWidth>
                      <InputLabel id="spec-label">Specialty</InputLabel>
                      <Select labelId="spec-label" label="Specialty" value={specialty} onChange={(e) => setSpecialty(String(e.target.value))}>
                        <MenuItem value="any">Any specialty</MenuItem>
                        {(SPECIALTIES as DoctorSpecialty[]).map((s) => (
                          <MenuItem key={s} value={s}>
                            {s}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <TextField
                      fullWidth
                      id="q"
                      label="Keyword"
                      placeholder="Heart, rash, migraine…"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      slotProps={{
                        input: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <SearchIcon sx={{ color: 'text.secondary' }} />
                            </InputAdornment>
                          ),
                        },
                      }}
                    />

                    <Box sx={{ borderRadius: 2, bgcolor: 'success.light', color: 'success.dark', p: 2, typography: 'caption' }}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                        <AutoAwesomeIcon sx={{ fontSize: 18, mt: '2px', flexShrink: 0 }} />
                        <Typography variant="caption" sx={{ color: 'inherit', fontWeight: 600 }}>
                          Green lane · average wait {(6 + enriched.length % 8) % 13} min for {visitMode}.
                        </Typography>
                      </Box>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </AnimatedCard>
          </Grid>

          <Grid item xs={12} lg={7}>
            <AnimatedCard>
              <Card variant="outlined" sx={{ minHeight: '28rem', borderColor: 'rgba(6, 78, 59, 0.15)' }}>
                <CardHeader title="Directory" subheader={`${filtered.length} matches · tap to reserve a slot.`} />
                <CardContent>
                  <Box sx={{ height: '22rem', overflow: 'auto', pr: 1 }}>
                    {loading && [...Array(5)].map((_, i) => <Skeleton key={i} variant="rectangular" height={112} sx={{ mb: 2, borderRadius: 2 }} />)}
                    {!loading &&
                      filtered.map(({ doctor, label }) => {
                        const sel = chosen?.id === doctor.id
                        return (
                          <Button
                            key={doctor.id}
                            fullWidth
                            onClick={() => {
                              setChosen(doctor)
                              setSlot(null)
                              setStep(1)
                            }}
                            sx={{
                              mb: 2,
                              p: 2,
                              justifyContent: 'flex-start',
                              alignItems: 'flex-start',
                              textAlign: 'left',
                              textTransform: 'none',
                              borderRadius: 3,
                              border: 2,
                              borderColor: sel ? 'primary.main' : 'divider',
                              bgcolor: sel ? 'action.selected' : 'transparent',
                              '&:hover': { bgcolor: 'action.hover' },
                            }}
                            variant="outlined"
                          >
                            <Box sx={{ width: '100%' }}>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1 }}>
                                <Typography sx={{ fontWeight: 600 }}>{label}</Typography>
                                <Chip label={`$${doctor.consultationFee}`} size="small" />
                                <Chip label={doctor.specialty} size="small" variant="outlined" />
                              </Box>
                              <Typography variant="body2" color="text.secondary" sx={{ mt: 1, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                                {doctor.bio}
                              </Typography>
                            </Box>
                          </Button>
                        )
                      })}
                    {!loading && filtered.length === 0 && (
                      <Typography variant="body2" color="text.secondary">
                        Nothing matched — loosen filters slightly.
                      </Typography>
                    )}
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                    <Button variant="text" disabled={step === 0} onClick={() => setStep(Math.max(0, step - 1))} startIcon={<ChevronLeftIcon />}>
                      Back
                    </Button>
                    <Button type="button" onClick={() => setStep(Math.min(2, step + 1))} disabled={!chosen} endIcon={<ChevronRightIcon />}>
                      Continue
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </AnimatedCard>
          </Grid>
        </Grid>

        {step >= 1 && chosen && (
          <AnimatedCard>
            <Card variant="outlined" sx={{ borderColor: 'rgba(6, 78, 59, 0.15)' }}>
              <CardHeader
                title="Pick availability"
                subheader={`Showing weekly blocks · next slot aligns to ${slot ? new Date(composeSlotIso(slot.day, slot.time)).toLocaleString() : clinicalPreview(chosen.availability)}`}
              />
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Stack spacing={2}>
                      {slotGrid.map((blk) => (
                        <Card key={blk.day} variant="outlined" sx={{ p: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                            <Typography sx={{ fontWeight: 600 }}>{blk.day}</Typography>
                            <Chip label={`${blk.slots.length} slots`} size="small" variant="outlined" />
                          </Box>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {blk.slots.map((t) => (
                              <Button
                                key={`${blk.day}-${t}`}
                                type="button"
                                size="small"
                                variant={slot?.day === blk.day && slot?.time === t ? 'contained' : 'outlined'}
                                onClick={() => {
                                  setSlot({ day: blk.day, time: t })
                                  setStep(2)
                                }}
                              >
                                {t}
                              </Button>
                            ))}
                          </Box>
                        </Card>
                      ))}
                    </Stack>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Card
                      variant="outlined"
                      sx={{
                        height: '100%',
                        background: (t) =>
                          t.palette.mode === 'dark' ? 'linear-gradient(135deg, rgba(16,185,129,0.12), transparent)' : 'linear-gradient(135deg, rgba(236,253,245,1), #fff)',
                        p: 3,
                        display: 'flex',
                        flexDirection: 'column',
                      }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.dark' }}>
                        Selections
                      </Typography>
                      <Stack component="dl" spacing={1} sx={{ mt: 2, typography: 'body2' }}>
                        <Typography variant="caption" component="dt" color="text.secondary">
                          Clinician
                        </Typography>
                        <Typography component="dd" sx={{ m: 0 }}>
                          {clinicianLabel}
                        </Typography>
                        <Typography variant="caption" component="dt" color="text.secondary">
                          Modality
                        </Typography>
                        <Typography component="dd" sx={{ m: 0, textTransform: 'capitalize' }}>
                          {visitMode}
                        </Typography>
                        <Typography variant="caption" component="dt" color="text.secondary">
                          Slot
                        </Typography>
                        <Typography component="dd" sx={{ m: 0 }}>
                          {slot ? `${slot.day} · ${slot.time}` : 'Not chosen'}
                        </Typography>
                      </Stack>
                      {slot && (
                        <Button sx={{ mt: 3 }} endIcon={<ChevronRightIcon />} type="button" onClick={() => setStep(2)}>
                          Move to confirmation
                        </Button>
                      )}
                    </Card>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </AnimatedCard>
        )}

        {step >= 2 && slot && chosen && (
          <AnimatedCard>
            <Card variant="outlined" sx={{ borderColor: 'rgba(6, 78, 59, 0.15)' }}>
              <CardHeader title="Confirmation" subheader="Finalize visit reason · we coordinate insurance asynchronously." />
              <CardContent>
                <Stack component="form" spacing={3} onSubmit={(e) => void onSubmit(e)}>
                  <TextField fullWidth id="reason" label="Reason" placeholder="Brief chief complaint or follow-up intent" {...form.register('reason')} error={Boolean(form.formState.errors.reason)} helperText={form.formState.errors.reason?.message} />
                  <TextField fullWidth id="notes" label="Notes (optional)" placeholder="Bring prior labs / imaging refs" {...form.register('notes')} />

                  <Box
                    sx={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      gap: 2,
                      p: 2,
                      borderRadius: 2,
                      bgcolor: 'action.hover',
                      border: 1,
                      borderColor: 'divider',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'success.dark' }}>
                      <CheckIcon />
                      <Typography sx={{ fontWeight: 600 }}>
                        {visitMode === 'online' ? 'Encrypted video room queued' : 'Clinic kiosk pre-check queued'}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {slot.day} · {slot.time}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 2 }}>
                    <Button type="button" onClick={() => setStep(1)} startIcon={<ChevronLeftIcon />}>
                      Slots
                    </Button>
                    <Button type="submit" variant="contained" disabled={!patientId}>
                      Confirm booking
                    </Button>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </AnimatedCard>
        )}
      </Stack>
    </AnimatedPage>
  )
}

function clinicalPreview(av: Doctor['availability']) {
  const [first] = av
  if (!first?.slots.length) return 'Updated weekly'
  return `${first.day} · ${first.slots[0]} onwards`
}
