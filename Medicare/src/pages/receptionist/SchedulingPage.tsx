import { useEffect, useMemo, useState } from 'react'
import { addDays } from 'date-fns'
import BusinessIcon from '@mui/icons-material/Business'
import CheckIcon from '@mui/icons-material/Check'
import VideocamIcon from '@mui/icons-material/Videocam'
import LocalHospitalIcon from '@mui/icons-material/LocalHospital'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select, { type SelectChangeEvent } from '@mui/material/Select'
import Skeleton from '@mui/material/Skeleton'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { alpha, useTheme } from '@mui/material/styles'
import { toast } from 'sonner'
import { AnimatedCard, AnimatedPage } from '@/components/shared/AnimatedPage'
import { PageHeader } from '@/components/shared/PageHeader'
import * as api from '@/services/mockApi'
import type { Appointment, AppointmentMode, Doctor, Patient } from '@/types'

const DAY_LOOKUP: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }

function composeSlotIso(day: string, time: string) {
  const abbrev = day.slice(0, 3) as keyof typeof DAY_LOOKUP
  const dow = DAY_LOOKUP[abbrev]
  const base = new Date()
  const diff = ((dow + 7 - base.getDay()) % 7) + 1
  const slotDate = addDays(base, Number.isFinite(diff) ? diff : 7)
  const [hStr, mStr] = time.split(':')
  slotDate.setHours(Number(hStr ?? '10'), Number(mStr ?? '0'), 0, 0)
  return slotDate.toISOString()
}

async function doctorLabel(doctor: Doctor) {
  const u = await api.getUserById(doctor.userId)
  return u?.name ?? doctor.specialty
}

type VisitUi = Extract<AppointmentMode, 'online' | 'clinic'>

export function SchedulingPage() {
  const theme = useTheme()
  const [patientsLoading, setPatientsLoading] = useState(true)
  const [doctorLoading, setDoctorLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [patientRows, setPatientRows] = useState<{ patient: Patient; name: string }[]>([])
  const [doctorRows, setDoctorRows] = useState<{ doctor: Doctor; label: string }[]>([])
  const [patientId, setPatientId] = useState<string>('')
  const [doctorSel, setDoctorSel] = useState<string>('') /* doctor ids */
  const [reason, setReason] = useState('Walk-in follow-up')
  const [notes, setNotes] = useState('')
  const [slot, setSlot] = useState<{ day: string; time: string } | null>(null)
  const [visitMode, setVisitMode] = useState<VisitUi>('clinic')

  useEffect(() => {
    async function lp() {
      setPatientsLoading(true)
      const patients = await api.getPatients()
      const hydrated = await Promise.all(
        patients.map(async (p) => ({
          patient: p,
          name: (await api.getUserById(p.userId))?.name ?? 'Patient',
        }))
      )
      setPatientRows(hydrated.slice(0, 80))
      setPatientsLoading(false)
    }
    void lp()
  }, [])

  useEffect(() => {
    async function ld() {
      setDoctorLoading(true)
      const docs = await api.searchDoctors({})
      const hydrated = await Promise.all(
        docs.map(async (doctor) => ({ doctor, label: await doctorLabel(doctor) }))
      )
      setDoctorRows(hydrated)
      if (hydrated[0]) setDoctorSel(hydrated[0].doctor.id)
      setDoctorLoading(false)
    }
    void ld()
  }, [])

  const slots = useMemo(() => {
    const d = doctorRows.find((dr) => dr.doctor.id === doctorSel)?.doctor
    if (!d) return []
    const open = (d.availability ?? []).flatMap((a) =>
      (!a.blocked ? a.slots : []).map((time) => ({ day: a.day, time }))
    )
    return open.slice(0, 42)
  }, [doctorRows, doctorSel])

  async function confirmBooking() {
    if (!patientId || !doctorSel || !slot) {
      toast.error('Select patient, clinician, and a slot.')
      return
    }
    setBusy(true)
    const doc = doctorRows.find((d) => d.doctor.id === doctorSel)?.doctor
    const scheduledAt = composeSlotIso(slot.day, slot.time)
    const payload: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'> = {
      patientId,
      doctorId: doctorSel,
      clinicId: doc?.clinicIds?.[0],
      mode: visitMode,
      status: visitMode === 'clinic' ? 'confirmed' : 'pending',
      scheduledAt,
      duration: visitMode === 'online' ? 25 : 30,
      reason,
      notes: notes.trim() ? notes.trim() : undefined,
    }
    const res = await api.createAppointment(payload)
    setBusy(false)
    if (res.error || !res.data) {
      toast.error(res.error ?? 'Unable to book.')
      return
    }
    toast.success('Walk-in routed to clinician calendar.')
    setReason('Walk-in follow-up')
    setNotes('')
    setSlot(null)
  }

  const visitModeSelect = (e: SelectChangeEvent<VisitUi>) => setVisitMode(e.target.value as VisitUi)

  return (
    <AnimatedPage>
      <PageHeader
        title="Walk-in coordination"
        description="Pair patients with clinician blocks, balance telemedicine arrivals, or slide someone into urgent coverage."
      />
      <Box
        sx={{
          display: 'grid',
          gap: 3,
          gridTemplateColumns: { xs: '1fr', xl: 'repeat(12, minmax(0, 1fr))' },
        }}
      >
        <Box sx={{ gridColumn: { xl: 'span 7' } }}>
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
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1 }}>
                    <LocalHospitalIcon sx={{ color: 'primary.main' }} />{' '}
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Match patient & clinician
                    </Typography>
                  </Box>
                }
                subheader={
                  <Typography variant="body2" color="text.secondary">
                    Selections sync with kiosk check-in & queue ETA.
                  </Typography>
                }
              />
              <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Box
                  sx={{
                    display: 'grid',
                    gap: 2,
                    gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
                  }}
                >
                  <FormControl fullWidth>
                    <InputLabel id="patient-roster-label">Patient roster</InputLabel>
                    {patientsLoading ? (
                      <Skeleton variant="rounded" sx={{ height: 56, mt: 1 }} />
                    ) : (
                      <Select
                        labelId="patient-roster-label"
                        label="Patient roster"
                        value={patientId}
                        aria-label="Select patient"
                        onChange={(e) => setPatientId(e.target.value)}
                        MenuProps={{
                          slotProps: { paper: { sx: { maxHeight: 288 } } },
                        }}
                      >
                        {patientRows.map(({ patient, name }) => (
                          <MenuItem key={patient.id} value={patient.id}>
                            {name} · {patient.id.slice(0, 8)}…
                          </MenuItem>
                        ))}
                      </Select>
                    )}
                  </FormControl>
                  <FormControl fullWidth>
                    <InputLabel id="clinician-label">Clinician</InputLabel>
                    {doctorLoading ? (
                      <Skeleton variant="rounded" sx={{ height: 56, mt: 1 }} />
                    ) : (
                      <Select
                        labelId="clinician-label"
                        label="Clinician"
                        value={doctorSel}
                        aria-label="Select clinician"
                        onChange={(e) => setDoctorSel(e.target.value)}
                        MenuProps={{
                          slotProps: { paper: { sx: { maxHeight: 288 } } },
                        }}
                      >
                        {doctorRows.map(({ doctor, label }) => (
                          <MenuItem key={doctor.id} value={doctor.id}>
                            {label} · {doctor.specialty}
                          </MenuItem>
                        ))}
                      </Select>
                    )}
                  </FormControl>
                </Box>
                <FormControl fullWidth>
                  <InputLabel id="modality-label">Visit modality</InputLabel>
                  <Select labelId="modality-label" label="Visit modality" value={visitMode} onChange={visitModeSelect}>
                    <MenuItem value="clinic">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <BusinessIcon fontSize="small" /> On-campus visit
                      </Box>
                    </MenuItem>
                    <MenuItem value="online">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <VideocamIcon fontSize="small" /> MediCare Concierge Studio
                      </Box>
                    </MenuItem>
                  </Select>
                </FormControl>
                <Box
                  sx={{
                    display: 'grid',
                    gap: 2,
                    gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
                  }}
                >
                  <TextField
                    id="rsn"
                    label="Chief complaint / reason"
                    fullWidth
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    sx={{ gridColumn: { md: 'span 1' } }}
                  />
                  <TextField
                    id="notes-intake"
                    label="Desk notes"
                    fullWidth
                    multiline
                    minRows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    sx={{ gridColumn: { xs: '1', md: '1 / -1' } }}
                  />
                </Box>
              </CardContent>
            </Card>
          </AnimatedCard>
        </Box>

        <Box sx={{ gridColumn: { xl: 'span 5' } }}>
          <AnimatedCard>
            <Card
              elevation={2}
              sx={{
                border: '1px solid',
                borderColor: alpha('#006064', 0.28),
                height: '100%',
              }}
            >
              <CardHeader
                title={<Typography sx={{ fontWeight: 600 }}>Open blocks</Typography>}
                subheader={
                  <Typography variant="body2" color="text.secondary">
                    Powered by clinician availability · tap to propose reschedule
                  </Typography>
                }
              />
              <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                {doctorLoading ? (
                  <Skeleton variant="rounded" sx={{ height: 288 }} />
                ) : (
                  <>
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)' },
                        gap: 1,
                        maxHeight: 320,
                        overflow: 'auto',
                      }}
                    >
                      {slots.length === 0 && (
                        <Typography variant="body2" color="text.secondary" sx={{ gridColumn: '1 / -1' }}>
                          Availability hidden — pick another clinician.
                        </Typography>
                      )}
                      {slots.map((s, idx) => {
                        const sel = slot?.day === s.day && slot?.time === s.time
                        return (
                          <Button
                            key={`${s.day}_${s.time}_${idx}`}
                            type="button"
                            onClick={() => setSlot(s)}
                            variant={sel ? 'contained' : 'outlined'}
                            sx={{
                              flexDirection: 'column',
                              borderRadius: 2,
                              py: 1,
                              px: 1,
                              fontSize: 11,
                              fontWeight: 600,
                              borderColor: alpha(theme.palette.divider, sel ? 0 : 1),
                              bgcolor: sel
                                ? alpha(theme.palette.primary.main, 0.12)
                                : alpha(theme.palette.action.hover, 0.35),
                              '&:hover': {
                                bgcolor: sel ? alpha(theme.palette.primary.main, 0.2) : alpha(theme.palette.primary.main, 0.08),
                              },
                            }}
                          >
                            <span>{s.day} · {s.time}</span>
                            {sel && <CheckIcon sx={{ mt: 0.5, fontSize: 18, color: 'primary.main' }} />}
                          </Button>
                        )
                      })}
                    </Box>
                    <Box
                      sx={{
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                        p: 2,
                        bgcolor: (t) => alpha(t.palette.action.hover, 0.4),
                      }}
                    >
                      <Typography variant="body2" gutterBottom component="span">
                        Selected window ·{' '}
                        <Chip
                          label={visitMode}
                          color={visitMode === 'online' ? 'primary' : 'secondary'}
                          size="small"
                          sx={{ verticalAlign: 'middle', ml: 0.5 }}
                        />
                      </Typography>
                      {slot ? (
                        <Typography variant="body2" sx={{ mt: 1.5, fontWeight: 600, color: 'primary.dark' }}>
                          {slot.day}, {slot.time}
                        </Typography>
                      ) : (
                        <Typography variant="body2" sx={{ mt: 1.5 }} color="text.secondary">
                          No slot picked yet.
                        </Typography>
                      )}
                    </Box>
                    <Button
                      variant="contained"
                      fullWidth
                      disabled={busy}
                      onClick={() => void confirmBooking()}
                      sx={{
                        gap: 1,
                        py: 1,
                        boxShadow: (t) => `0 8px 18px ${alpha(t.palette.primary.main, 0.35)}`,
                        background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main}, #26A69A)`,
                      }}
                      startIcon={busy ? <CircularProgress size={18} color="inherit" /> : undefined}
                    >
                      Book / reschedule arrival
                    </Button>
                    <Button
                      type="button"
                      variant="outlined"
                      fullWidth
                      sx={{ borderStyle: 'dashed', borderColor: alpha(theme.palette.primary.main, 0.45) }}
                      onClick={() => {
                        const first = slots[0]
                        if (!first) {
                          toast.error('No clinician slot to reschedule into.')
                          return
                        }
                        setSlot(first)
                        toast.message('Desk pulled next open block', { description: `${first.day} · ${first.time}` })
                      }}
                    >
                      Auto-place next availability
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </AnimatedCard>
        </Box>
      </Box>
    </AnimatedPage>
  )
}
