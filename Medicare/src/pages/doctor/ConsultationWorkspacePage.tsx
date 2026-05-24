import { AnimatedPage } from '@/components/shared/AnimatedPage'
import { EmptyState } from '@/components/shared/EmptyState'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import type { Appointment, Medicine, Patient, User } from '@/types'
import { MEDICINE_CATEGORIES } from '@/types'
import * as api from '@/services/mockApi'
import { useAuthStore } from '@/store/index'
import { generateId } from '@/utils/cn'
import { format } from 'date-fns'
import { useDoctorWorkspace } from '@/pages/doctor/useDoctorWorkspace'
import AddIcon from '@mui/icons-material/Add'
import ArticleIcon from '@mui/icons-material/Article'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import LocalPharmacyIcon from '@mui/icons-material/LocalPharmacy'
import MedicalServicesIcon from '@mui/icons-material/MedicalServices'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Chip from '@mui/material/Chip'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'

function emptyMedicine(): Medicine {
  return {
    id: generateId('med'),
    name: '',
    category: MEDICINE_CATEGORIES[0],
    dosage: '',
    frequency: '',
    duration: '7 days',
    instructions: '',
  }
}

/** Consultation desk with patient rail, diagnosis capture, and Rx helper. */
export function ConsultationWorkspacePage() {
  const { appointmentId } = useParams<{ appointmentId?: string }>()
  const navigate = useNavigate()
  const userId = useAuthStore((s) => s.session?.userId)
  const { doctor, loading: wsLoad } = useDoctorWorkspace(userId)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(appointmentId ?? null)

  const [symptoms, setSymptoms] = useState('')
  const [diagnosis, setDiagnosis] = useState('')
  const [clinicalNotes, setClinicalNotes] = useState('')
  const [summary, setSummary] = useState('')
  const [medicines, setMedicines] = useState<Medicine[]>([emptyMedicine()])
  const [saving, setSaving] = useState(false)

  const loadEverything = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    try {
      const [appt, patt, usr] = await Promise.all([
        api.getAppointments(userId, 'doctor'),
        api.getPatients(),
        api.getUsers(),
      ])
      const focus = [...appt].sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
      setAppointments(focus)
      setPatients(patt)
      setUsers(usr)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    void loadEverything()
  }, [loadEverything, doctor])

  useEffect(() => {
    if (appointmentId) setSelectedId(appointmentId)
  }, [appointmentId])

  useEffect(() => {
    async function hydrateForm() {
      if (!selectedId) {
        setSymptoms('')
        setDiagnosis('')
        setClinicalNotes('')
        setSummary('')
        setMedicines([emptyMedicine()])
        return
      }
      const prior = await api.getConsultations(selectedId)
      const last = prior[0]
      if (last && doctor && last.doctorId === doctor.id) {
        setSymptoms(last.symptoms)
        setDiagnosis(last.diagnosis)
        setClinicalNotes(last.notes)
        setSummary(last.summary)
      } else {
        setSymptoms('')
        setDiagnosis('')
        setClinicalNotes('')
        setSummary('')
        setMedicines([emptyMedicine()])
      }
    }
    void hydrateForm()
  }, [doctor, selectedId])

  const selected = appointments.find((a) => a.id === selectedId) ?? null

  const patientLookup = useMemo(() => {
    const map = new Map<string, { patient: Patient; user?: User }>()
    patients.forEach((p) => {
      map.set(p.id, { patient: p, user: users.find((u) => u.id === p.userId) })
    })
    return map
  }, [patients, users])

  const saveConsultation = async () => {
    if (!doctor || !selected) {
      toast.error('Select an appointment first.')
      return
    }
    setSaving(true)
    const payload = await api.createConsultation({
      appointmentId: selected.id,
      patientId: selected.patientId,
      doctorId: doctor.id,
      symptoms,
      diagnosis,
      notes: clinicalNotes,
      summary,
      duration: selected.duration,
    })
    setSaving(false)
    if (payload.error) toast.error(payload.error)
    else {
      toast.success('Consultation note saved to mock ledger.')
      await api.updateAppointmentStatus(selected.id, 'completed')
      await loadEverything()
    }
  }

  const generatePrescription = async () => {
    if (!doctor || !selected) return
    const cleaned = medicines.filter((m) => m.name.trim().length > 0)
    if (cleaned.length === 0) {
      toast.error('Add at least one medication line.')
      return
    }
    setSaving(true)
    const res = await api.createPrescription({
      patientId: selected.patientId,
      doctorId: doctor.id,
      appointmentId: selected.id,
      medicines: cleaned,
      diagnosis,
      status: 'active',
    })
    setSaving(false)
    if (res.error) toast.error(res.error)
    else toast.success('Prescription drafted and stored.')
  }

  if (!wsLoad && doctor === null) {
    return (
      <AnimatedPage>
        <EmptyState title="Workspace unavailable" description="No doctor profile for this account." />
      </AnimatedPage>
    )
  }

  return (
    <AnimatedPage>
      <PageHeader title="Consultation workspace" description="Capture the clinical story, close the loop, and generate scripts without leaving the chart." />
      <Box
        sx={{
          display: 'grid',
          gap: 3,
          gridTemplateColumns: { xs: '1fr', lg: '280px 1fr' },
        }}
      >
        <Card variant="outlined" sx={{ borderColor: 'success.light' }}>
          <CardHeader title="Patient queue" avatar={<MedicalServicesIcon color="primary" />} titleTypographyProps={{ variant: 'subtitle1' }} />
          <CardContent sx={{ p: 0 }}>
            <Box sx={{ maxHeight: 'min(65vh, 640px)', overflow: 'auto', p: 1.5 }}>
              <Stack spacing={1}>
                {loading && (
                  <Typography variant="body2" color="text.secondary" sx={{ px: 1 }}>
                    Loading appointments…
                  </Typography>
                )}
                {!loading && appointments.length === 0 && (
                  <Typography variant="body2" color="text.secondary" sx={{ px: 1 }}>
                    No visits on file for this clinician.
                  </Typography>
                )}
                {appointments.map((a) => {
                  const row = patientLookup.get(a.patientId)
                  const name = row?.user?.name ?? 'Patient'
                  const active = selectedId === a.id
                  return (
                    <Button
                      key={a.id}
                      type="button"
                      onClick={() => {
                        setSelectedId(a.id)
                        navigate(`/doctor/consultation/${a.id}`, { replace: true })
                      }}
                      fullWidth
                      sx={{
                        justifyContent: 'flex-start',
                        textAlign: 'left',
                        textTransform: 'none',
                        borderRadius: 2,
                        border: 1,
                        borderColor: active ? 'primary.main' : 'divider',
                        bgcolor: active ? (theme) => `${theme.palette.primary.main}18` : 'action.hover',
                        py: 1.25,
                        px: 1.5,
                      }}
                    >
                      <Stack spacing={1} sx={{ width: '100%' }}>
                        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', width: '100%' }}>
                          <Avatar src={row?.user?.avatar ?? undefined} sx={{ width: 32, height: 32, border: 1, borderColor: 'primary.light' }}>
                            {name.slice(0, 2)}
                          </Avatar>
                          <Box sx={{ minWidth: 0, flex: 1 }}>
                            <Typography variant="body2" noWrap sx={{ fontWeight: 700 }}>
                              {name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {format(new Date(a.scheduledAt), 'MMM d · p')}
                            </Typography>
                          </Box>
                        </Stack>
                        <Stack direction="row" spacing={0.5} useFlexGap sx={{ flexWrap: 'wrap' }}>
                          <StatusBadge status={a.status} />
                          <Chip label={a.mode} size="small" variant="outlined" />
                        </Stack>
                      </Stack>
                    </Button>
                  )
                })}
              </Stack>
            </Box>
          </CardContent>
        </Card>

        <Stack spacing={2.5}>
          <Card variant="outlined" sx={{ borderColor: 'success.light' }}>
            <CardHeader title="Presentation & assessment" titleTypographyProps={{ variant: 'subtitle1' }} />
            <CardContent>
              <Stack spacing={2}>
                <TextField
                  id="symptoms"
                  label="Chief complaint & symptoms"
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  multiline
                  minRows={4}
                  fullWidth
                  placeholder="History of present illness, vitals, relevant negatives…"
                />
                <TextField
                  id="diagnosis"
                  label="Working diagnosis"
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  fullWidth
                  placeholder="ICD-10 optional in production"
                />
                <TextField
                  id="notes"
                  label="Clinical notes"
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                  multiline
                  minRows={3}
                  fullWidth
                />
              </Stack>
            </CardContent>
          </Card>

          <Card variant="outlined" sx={{ borderColor: 'success.light' }}>
            <CardHeader
              title="Prescription generator"
              avatar={<LocalPharmacyIcon color="primary" />}
              titleTypographyProps={{ variant: 'subtitle1' }}
              action={
                <Button size="small" variant="contained" color="secondary" startIcon={<AddIcon />} onClick={() => setMedicines((m) => [...m, emptyMedicine()])}>
                  Add medication
                </Button>
              }
            />
            <CardContent>
              <Stack spacing={2}>
                {medicines.map((med, idx) => (
                  <Box
                    key={med.id}
                    sx={{
                      borderRadius: 2,
                      border: 1,
                      borderColor: 'success.light',
                      bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'success.dark' : 'success.light'),
                      opacity: 0.95,
                      p: 2,
                    }}
                  >
                    <Stack spacing={1.5}>
                      <TextField
                        label="Name"
                        value={med.name}
                        onChange={(e) =>
                          setMedicines((prev) =>
                            prev.map((row, i) => (i === idx ? { ...row, name: e.target.value } : row))
                          )
                        }
                        fullWidth
                        placeholder="e.g. Lisinopril"
                      />
                      <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
                        <FormControl fullWidth>
                          <InputLabel id={`cat-${med.id}`}>Category</InputLabel>
                          <Select
                            labelId={`cat-${med.id}`}
                            label="Category"
                            value={med.category}
                            onChange={(e) =>
                              setMedicines((prev) =>
                                prev.map((row, i) => (i === idx ? { ...row, category: String(e.target.value) } : row))
                              )
                            }
                          >
                            {MEDICINE_CATEGORIES.map((cat) => (
                              <MenuItem key={cat} value={cat}>
                                {cat}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                        <TextField
                          label="Dosage"
                          value={med.dosage}
                          onChange={(e) =>
                            setMedicines((prev) =>
                              prev.map((row, i) => (i === idx ? { ...row, dosage: e.target.value } : row))
                            )
                          }
                          fullWidth
                          placeholder="10 mg"
                        />
                        <TextField
                          label="Frequency"
                          value={med.frequency}
                          onChange={(e) =>
                            setMedicines((prev) =>
                              prev.map((row, i) => (i === idx ? { ...row, frequency: e.target.value } : row))
                            )
                          }
                          fullWidth
                          placeholder="Daily"
                        />
                        <TextField
                          label="Duration"
                          value={med.duration}
                          onChange={(e) =>
                            setMedicines((prev) =>
                              prev.map((row, i) => (i === idx ? { ...row, duration: e.target.value } : row))
                            )
                          }
                          fullWidth
                        />
                      </Box>
                      <TextField
                        label="Patient instructions"
                        value={med.instructions ?? ''}
                        onChange={(e) =>
                          setMedicines((prev) =>
                            prev.map((row, i) => (i === idx ? { ...row, instructions: e.target.value } : row))
                          )
                        }
                        fullWidth
                        placeholder="Take with food"
                      />
                    </Stack>
                  </Box>
                ))}
                <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
                  <Button variant="contained" color="secondary" startIcon={<AutoAwesomeIcon />} onClick={() => void generatePrescription()} disabled={saving}>
                    Generate prescription
                  </Button>
                  <Button variant="outlined" onClick={() => setMedicines([emptyMedicine()])}>
                    Clear builder
                  </Button>
                </Stack>
              </Stack>
            </CardContent>
          </Card>

          <Card variant="outlined" sx={{ borderColor: 'success.light' }}>
            <CardHeader title="After-visit summary" avatar={<ArticleIcon color="primary" />} titleTypographyProps={{ variant: 'subtitle1' }} />
            <CardContent>
              <Stack spacing={1.5}>
                <TextField
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  multiline
                  minRows={5}
                  fullWidth
                  placeholder="Key counseling points, follow-up timing, red flags…"
                />
                <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap', alignItems: 'center' }}>
                  <Button variant="contained" onClick={() => void saveConsultation()} disabled={saving || !selected}>
                    Save consultation
                  </Button>
                  {!selected && (
                    <Typography variant="body2" color="text.secondary">
                      Select a patient visit to enable documentation.
                    </Typography>
                  )}
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      </Box>
    </AnimatedPage>
  )
}
