import { AnimatedPage } from '@/components/shared/AnimatedPage'
import { EmptyState } from '@/components/shared/EmptyState'
import { PageHeader } from '@/components/shared/PageHeader'
import type { Appointment, Medicine, Patient, Prescription, User } from '@/types'
import { MEDICINE_CATEGORIES } from '@/types'
import * as api from '@/services/mockApi'
import { useAuthStore } from '@/store/index'
import { generateId } from '@/utils/cn'
import { format } from 'date-fns'
import { useDoctorWorkspace } from '@/pages/doctor/useDoctorWorkspace'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import LocalPharmacyIcon from '@mui/icons-material/LocalPharmacy'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Chip from '@mui/material/Chip'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import FormControl from '@mui/material/FormControl'
import IconButton from '@mui/material/IconButton'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

function emptyMedicineRow(): Medicine {
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

function mockInteractionAlerts(names: string[]): string[] {
  const lowered = names.map((n) => n.toLowerCase()).filter(Boolean)
  const warns: string[] = []
  if (lowered.some((n) => n.includes('warfarin')) && lowered.some((n) => n.includes('aspirin'))) {
    warns.push(
      'Anticoagulant overlap: concurrent warfarin and aspirin increases bleeding risk — confirm with pharmacy (mock CDS).'
    )
  }
  if (lowered.some((n) => n.includes('metformin')) && lowered.some((n) => n.includes('contrast'))) {
    warns.push('Iodinated contrast: consider renal-safe metformin management per facility policy (mock).')
  }
  return warns
}

function AlertsBlock({ messages }: { messages: string[] }) {
  if (!messages.length) return null
  return (
    <Stack spacing={1} sx={{ mt: 1 }}>
      {messages.map((m) => (
        <Alert key={m} severity="warning" icon={<WarningAmberIcon fontSize="inherit" />} sx={{ py: 0.5 }}>
          <Typography variant="caption">{m}</Typography>
        </Alert>
      ))}
    </Stack>
  )
}

/** Rx CRUD plus deterministic drug-interaction mocks. */
export function DoctorPrescriptionsPage() {
  const userId = useAuthStore((s) => s.session?.userId)
  const { doctor, loading: wsLoad, reload } = useDoctorWorkspace(userId)
  const [busy, setBusy] = useState(false)
  const [rows, setRows] = useState<Prescription[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [editor, setEditor] = useState<Prescription | 'new' | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Prescription | null>(null)
  const [medicinesDraft, setMedicinesDraft] = useState<Medicine[]>([emptyMedicineRow()])
  const [patientIdDraft, setPatientIdDraft] = useState('')
  const [dxDraft, setDxDraft] = useState('')
  const [statusDraft, setStatusDraft] = useState<Prescription['status']>('active')
  const [interactionNotes, setInteractionNotes] = useState<string[]>([])

  const load = useCallback(async () => {
    if (!doctor) return
    setBusy(true)
    try {
      const [scripts, appt, patts, usr] = await Promise.all([
        api.getPrescriptions(undefined, doctor.id),
        userId ? api.getAppointments(userId, 'doctor') : [],
        api.getPatients(),
        api.getUsers(),
      ])
      scripts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      setRows(scripts)
      setAppointments(appt as Appointment[])
      setPatients(patts)
      setUsers(usr)
    } finally {
      setBusy(false)
    }
  }, [doctor, userId])

  useEffect(() => {
    void load()
  }, [load])

  const selectablePatients = useMemo(() => {
    const ids = new Set<string>()
    appointments.forEach((a) => ids.add(a.patientId))
    rows.forEach((r) => ids.add(r.patientId))
    return [...ids]
      .map((id) => {
        const p = patients.find((x) => x.id === id)
        const u = users.find((x) => x.id === p?.userId)
        return p ? { patient: p, label: u?.name ?? id } : null
      })
      .filter(Boolean) as { patient: Patient; label: string }[]
  }, [appointments, patients, rows, users])

  function openEditor(row: Prescription | 'new') {
    setEditor(row)
    setInteractionNotes([])
    if (row === 'new') {
      setPatientIdDraft(selectablePatients[0]?.patient.id ?? '')
      setDxDraft('')
      setStatusDraft('active')
      setMedicinesDraft([emptyMedicineRow()])
      return
    }
    setPatientIdDraft(row.patientId)
    setDxDraft(row.diagnosis ?? '')
    setStatusDraft(row.status)
    setMedicinesDraft(row.medicines.length ? row.medicines.map((m) => ({ ...m })) : [emptyMedicineRow()])
    const warns = mockInteractionAlerts(row.medicines.map((m) => m.name))
    if (warns.length) setInteractionNotes(warns)
  }

  async function persist() {
    if (!doctor) return
    const meds = medicinesDraft.filter((m) => m.name.trim())
    const warns = mockInteractionAlerts(meds.map((m) => m.name))
    setInteractionNotes(warns)
    if (warns.length) {
      const ok = confirm(`${warns.length} interaction cue(s). Continue documenting?`)
      if (!ok) return
    }

    setBusy(true)
    if (editor === 'new') {
      const mappedMeds = meds.map((m) => ({ ...m, id: m.id || generateId('med') }))
      const res = await api.createPrescription({
        patientId: patientIdDraft,
        doctorId: doctor.id,
        appointmentId: appointments.find((a) => a.patientId === patientIdDraft)?.id,
        medicines: mappedMeds,
        diagnosis: dxDraft || undefined,
        status: statusDraft,
      })
      setBusy(false)
      if (res.error) toast.error(res.error)
      else toast.success('Prescription created.')
    } else if (editor) {
      const mappedMeds = meds.map((m) => ({ ...m, id: m.id || generateId('med') }))
      const result = await api.updatePrescription(editor.id, {
        medicines: mappedMeds,
        diagnosis: dxDraft || undefined,
        status: statusDraft,
      })
      setBusy(false)
      if (result.error) toast.error(result.error)
      else toast.success('Prescription updated.')
    }
    setEditor(null)
    await load()
    await reload()
  }

  async function removeRx() {
    if (!deleteTarget) return
    setBusy(true)
    const res = await api.deletePrescription(deleteTarget.id)
    setBusy(false)
    if (!res.error) {
      toast.success('Prescription retracted.')
      setDeleteTarget(null)
      await load()
      await reload()
    }
  }

  function labelForPatient(id: string) {
    const p = patients.find((x) => x.id === id)
    const u = users.find((x) => x.id === p?.userId)
    return u?.name ?? id.slice(0, 8)
  }

  if (!wsLoad && doctor === null) {
    return (
      <AnimatedPage>
        <EmptyState title="Prescription shelf unavailable" description="Associate a clinician first." />
      </AnimatedPage>
    )
  }

  return (
    <AnimatedPage>
      <PageHeader title="Prescriptions" description="Create and maintain scripts with mock drug–drug interaction cues." />

      <Alert severity="warning" icon={<WarningAmberIcon />} sx={{ mb: 3, borderRadius: 2 }}>
        <Typography sx={{ fontWeight: 700 }}>Clinical decision support (mock)</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Pairings like warfarin + aspirin or metformin + contrast produce advisory copy only; wire to MediSpan / FDB in production.
        </Typography>
      </Alert>

      <Card variant="outlined" sx={{ borderColor: 'success.light' }}>
        <CardHeader
          title={`${rows.length} prescriptions`}
          titleTypographyProps={{ variant: 'h6' }}
          action={
            <Button variant="contained" startIcon={<LocalPharmacyIcon />} disabled={busy} onClick={() => openEditor('new')}>
              New Rx
            </Button>
          }
        />
        <CardContent sx={{ p: 0 }}>
          <TableContainer sx={{ maxHeight: 'min(70vh, 740px)' }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: 2, bgcolor: 'success.light' }}>
                    Patient
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: 2, bgcolor: 'success.light' }}>
                    Medicines
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: 2, bgcolor: 'success.light' }}>
                    Status
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: 2, bgcolor: 'success.light' }}>
                    Issued
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: 2, bgcolor: 'success.light' }}>
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((rx) => {
                  const alerts = mockInteractionAlerts(rx.medicines.map((m) => m.name))
                  return (
                    <TableRow key={rx.id} hover>
                      <TableCell sx={{ verticalAlign: 'top' }}>{labelForPatient(rx.patientId)}</TableCell>
                      <TableCell sx={{ maxWidth: 480, verticalAlign: 'top' }}>
                        <Stack direction="row" spacing={0.5} useFlexGap sx={{ flexWrap: 'wrap' }}>
                          {rx.medicines.map((m) => (
                            <Chip
                              key={m.id}
                              size="small"
                              label={`${m.name || 'Untitled'}${m.dosage ? ` · ${m.dosage}` : ''}`}
                              color={alerts.length ? 'warning' : 'default'}
                              variant={alerts.length ? 'filled' : 'outlined'}
                            />
                          ))}
                        </Stack>
                        <AlertsBlock messages={alerts} />
                      </TableCell>
                      <TableCell sx={{ verticalAlign: 'top' }}>
                        <Chip label={rx.status} size="small" />
                      </TableCell>
                      <TableCell sx={{ verticalAlign: 'top', color: 'text.secondary' }}>{format(new Date(rx.createdAt), 'MMM d yyyy')}</TableCell>
                      <TableCell align="right" sx={{ verticalAlign: 'top' }}>
                        <IconButton size="small" onClick={() => openEditor(rx)} aria-label="Edit prescription">
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => setDeleteTarget(rx)} aria-label="Delete prescription">
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Dialog open={!!editor} onClose={() => setEditor(null)} maxWidth="sm" fullWidth scroll="paper" slotProps={{ paper: { sx: { maxHeight: '90vh' } } }}>
        <DialogTitle>{editor === 'new' ? 'Draft prescription' : 'Edit prescription'}</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Mock ledger — dosing must be clinically verified offline.
          </Typography>

          <Stack spacing={2}>
            <AlertsBlock messages={interactionNotes} />

            <FormControl fullWidth>
              <InputLabel id="patient-label">Patient</InputLabel>
              <Select labelId="patient-label" label="Patient" value={patientIdDraft} onChange={(e) => setPatientIdDraft(e.target.value)} disabled={editor !== 'new'}>
                {selectablePatients.map(({ patient: pat, label }) => (
                  <MenuItem key={pat.id} value={pat.id}>
                    {label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel id="rx-status-label">Status</InputLabel>
              <Select
                labelId="rx-status-label"
                label="Status"
                value={statusDraft}
                onChange={(e) => setStatusDraft(e.target.value as Prescription['status'])}
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </Select>
            </FormControl>

            <TextField label="Diagnosis" value={dxDraft} onChange={(e) => setDxDraft(e.target.value)} fullWidth placeholder="Brief diagnosis summary" />

            <Box>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="subtitle2">Medicines</Typography>
                <Button size="small" variant="outlined" onClick={() => setMedicinesDraft((m) => [...m, emptyMedicineRow()])}>
                  Add medicine
                </Button>
              </Stack>
              <Stack spacing={2}>
                {medicinesDraft.map((med, idx) => (
                  <Box key={med.id ?? `row-${idx}`} sx={{ border: 1, borderColor: 'divider', borderRadius: 2, px: 2, py: 2 }}>
                    <Stack spacing={1.5}>
                      <TextField
                        label="Name"
                        value={med.name}
                        onChange={(e) =>
                          setMedicinesDraft((prev) =>
                            prev.map((row, i) => (i === idx ? { ...row, name: e.target.value } : row))
                          )
                        }
                        fullWidth
                      />
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                        <FormControl fullWidth>
                          <InputLabel id={`ed-cat-${idx}`}>Category</InputLabel>
                          <Select
                            labelId={`ed-cat-${idx}`}
                            label="Category"
                            value={med.category}
                            onChange={(e) =>
                              setMedicinesDraft((prev) =>
                                prev.map((row, i) => (i === idx ? { ...row, category: String(e.target.value) } : row))
                              )
                            }
                          >
                            {MEDICINE_CATEGORIES.map((c) => (
                              <MenuItem key={c} value={c}>
                                {c}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                        <TextField
                          label="Dosage"
                          value={med.dosage}
                          onChange={(e) =>
                            setMedicinesDraft((prev) =>
                              prev.map((row, i) => (i === idx ? { ...row, dosage: e.target.value } : row))
                            )
                          }
                          fullWidth
                        />
                      </Stack>
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                        <TextField
                          label="Frequency"
                          value={med.frequency}
                          onChange={(e) =>
                            setMedicinesDraft((prev) =>
                              prev.map((row, i) => (i === idx ? { ...row, frequency: e.target.value } : row))
                            )
                          }
                          fullWidth
                        />
                        <TextField
                          label="Duration"
                          value={med.duration}
                          onChange={(e) =>
                            setMedicinesDraft((prev) =>
                              prev.map((row, i) => (i === idx ? { ...row, duration: e.target.value } : row))
                            )
                          }
                          fullWidth
                        />
                      </Stack>
                      <Button
                        variant="text"
                        color="error"
                        size="small"
                        disabled={medicinesDraft.length === 1}
                        onClick={() => setMedicinesDraft((prev) => prev.filter((_, i) => i !== idx))}
                      >
                        Remove line
                      </Button>
                    </Stack>
                  </Box>
                ))}
              </Stack>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditor(null)}>Cancel</Button>
          <Button variant="contained" onClick={() => void persist()} disabled={busy || !patientIdDraft}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>Retract prescription?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Removes the script from mock storage immediately.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button variant="outlined" onClick={() => setDeleteTarget(null)}>
            Cancel
          </Button>
          <Button variant="contained" color="error" disabled={busy} onClick={() => void removeRx()}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </AnimatedPage>
  )
}
