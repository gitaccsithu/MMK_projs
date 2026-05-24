import { useEffect, useState, type ReactNode } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import UploadIcon from '@mui/icons-material/Upload'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Chip from '@mui/material/Chip'
import FormLabel from '@mui/material/FormLabel'
import Grid from '@mui/material/Grid'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import * as api from '@/services/mockApi'
import { useAuthStore } from '@/store'
import type { Patient } from '@/types'
import { generateId } from '@/utils/cn'
import { AnimatedCard, AnimatedPage } from '@/components/shared/AnimatedPage'
import { PageHeader } from '@/components/shared/PageHeader'

const profileSchema = z.object({
  name: z.string().trim().min(2, 'Name required.'),
  phone: z.string().trim().min(5, 'Provide a reachable phone.'),
  dob: z.string().optional(),
  gender: z.string().optional(),
  bloodType: z.string().optional(),
  medicalNotes: z.string().optional(),
  allergies: z.string().optional(),
  insuranceProvider: z.string().optional(),
  policyNumber: z.string().optional(),
  emergencyName: z.string().trim().optional(),
  emergencyRelationship: z.string().optional(),
  emergencyPhone: z.string().optional(),
})

type ProfileValues = z.infer<typeof profileSchema>

export function PatientProfilePage() {
  const user = useAuthStore((s) => s.user)
  const [patient, setPatient] = useState<Patient | null>(null)
  const [loadingPatient, setLoadingPatient] = useState(true)

  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: '', phone: '', medicalNotes: '', allergies: '', emergencyRelationship: 'Spouse' },
  })

  useEffect(() => {
    async function load() {
      if (!user?.id) {
        setLoadingPatient(false)
        return
      }
      const p = await api.getPatientByUserId(user.id)
      const u = await api.getUserById(user.id)
      setPatient(p ?? null)
      form.reset({
        name: u?.name ?? '',
        phone: u?.phone ?? '',
        dob: u?.dateOfBirth ?? '',
        gender: u?.gender ?? '',
        bloodType: p?.bloodType ?? '',
        medicalNotes: p?.medicalHistory.join(', ') ?? '',
        allergies: p?.allergies.join(', ') ?? '',
        insuranceProvider: p?.insurance?.provider ?? '',
        policyNumber: p?.insurance?.policyNumber ?? '',
        emergencyName: p?.emergencyContacts[0]?.name ?? '',
        emergencyRelationship: p?.emergencyContacts[0]?.relationship ?? 'Care partner',
        emergencyPhone: p?.emergencyContacts[0]?.phone ?? '',
      })
      setLoadingPatient(false)
    }
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- hydrate form once auth user settles
  }, [user?.id])

  const onSubmit = form.handleSubmit(async (values) => {
    if (!user?.id || !patient?.id) {
      toast.error('Profile missing identifiers')
      return
    }

    await api.updateUser(user.id, {
      name: values.name,
      phone: values.phone,
      dateOfBirth: values.dob,
      gender: values.gender,
    })

    const emergency =
      values.emergencyName && values.emergencyPhone
        ? [
            {
              id: patient.emergencyContacts[0]?.id ?? generateId('ec'),
              name: values.emergencyName,
              relationship: values.emergencyRelationship || 'Emergency',
              phone: values.emergencyPhone,
            },
          ]
        : patient.emergencyContacts

    const allergyList = splitList(values.allergies)
    const histList = splitList(values.medicalNotes)

    await api.updatePatient(patient.id, {
      bloodType: values.bloodType,
      allergies: allergyList.length ? allergyList : patient.allergies,
      medicalHistory: histList.length ? histList : patient.medicalHistory,
      insurance:
        values.insuranceProvider || values.policyNumber
          ? {
              provider: values.insuranceProvider ?? patient.insurance?.provider ?? '',
              policyNumber: values.policyNumber ?? patient.insurance?.policyNumber ?? '',
              groupNumber: patient.insurance?.groupNumber,
            }
          : patient.insurance,
      emergencyContacts: emergency,
    })

    toast.success('Profile synced')
    const refreshed = await api.getPatientByUserId(user.id)
    setPatient(refreshed ?? null)
  })

  const handleDocs = async (files: FileList | null) => {
    if (!patient?.id || !user?.id || !files?.length) return
    const file = files[0]!
    const reader = new FileReader()
    reader.onloadend = async () => {
      const base64 = String(reader.result)
      const snapshot = await api.getPatientByUserId(user.id)
      const pid = snapshot?.id ?? patient.id
      await api.updatePatient(pid, {
        documents: [
          ...(snapshot?.documents ?? []),
          {
            id: generateId('doc'),
            name: file.name || 'clinical-upload.pdf',
            type: file.type || 'application/pdf',
            url: base64,
            uploadedAt: new Date().toISOString(),
          },
        ],
      })
      toast.success(`Stored ${Math.round(base64.length / 1024)} KB (base64) locally`)
      const next = await api.getPatientByUserId(user.id!)
      setPatient(next ?? null)
    }
    reader.readAsDataURL(file)
  }

  return (
    <AnimatedPage>
      <Stack spacing={3}>
        <PageHeader title="Patient profile" description="Unified chart data, payer info, uploads, allergy watchlist." />
        {!user && (
          <Typography variant="body2" color="text.secondary">
            Authenticate to personalize your dossier.
          </Typography>
        )}
        {!loadingPatient && user && patient && (
          <>
            <AnimatedCard>
              <Card variant="outlined" sx={{ borderColor: 'rgba(6, 78, 59, 0.15)' }}>
                <CardHeader title="Demographics & coverage" subheader="Backed by MediCare+ secure mock vault." />
                <CardContent>
                  <Box component="form" onSubmit={(e) => void onSubmit(e)}>
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                        <Field label="Legal name">
                          <TextField fullWidth {...form.register('name')} placeholder="Jane Patient" error={Boolean(form.formState.errors.name)} helperText={form.formState.errors.name?.message} />
                        </Field>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Field label="Mobile">
                          <TextField fullWidth {...form.register('phone')} placeholder="+1 ••• ••• ••••" error={Boolean(form.formState.errors.phone)} helperText={form.formState.errors.phone?.message} />
                        </Field>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Field label="Birthday">
                          <TextField fullWidth type="date" {...form.register('dob')} />
                        </Field>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Field label="Gender">
                          <TextField fullWidth {...form.register('gender')} placeholder="How you chart" />
                        </Field>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Field label="Blood type">
                          <TextField fullWidth {...form.register('bloodType')} placeholder="O+" />
                        </Field>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Field label="Insurance payer">
                          <TextField fullWidth {...form.register('insuranceProvider')} placeholder="HealthyHorizon" />
                        </Field>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Field label="Member ID">
                          <TextField fullWidth {...form.register('policyNumber')} />
                        </Field>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Field label="Medical history cues" hint="comma separated episodic bullets">
                          <TextField fullWidth multiline rows={5} {...form.register('medicalNotes')} placeholder="Asthma controlled, appendix removed 2019" />
                        </Field>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Field label="Allergies">
                          <TextField fullWidth multiline rows={4} {...form.register('allergies')} placeholder="Penicillin, iodine contrast" />
                        </Field>
                      </Grid>
                    </Grid>

                    <Box sx={{ mt: 4, borderRadius: 3, border: 1, borderColor: 'divider', bgcolor: (t) => (t.palette.mode === 'dark' ? 'rgba(16,185,129,0.08)' : 'rgba(236,253,245,0.75)'), p: 2 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.dark' }}>
                        Emergency contact
                      </Typography>
                      <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12} md={4}>
                          <Field label="Full name">
                            <TextField fullWidth {...form.register('emergencyName')} placeholder="Taylor Lee" />
                          </Field>
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <Field label="Relationship">
                            <TextField fullWidth {...form.register('emergencyRelationship')} />
                          </Field>
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <Field label="Phone">
                            <TextField fullWidth {...form.register('emergencyPhone')} />
                          </Field>
                        </Grid>
                      </Grid>
                    </Box>

                    <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 2, mt: 3, p: 2, borderRadius: 3, border: 1, borderStyle: 'dashed', borderColor: 'divider' }}>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          Clinical document intake
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Base64 data URL persists to local mock storage · no cloud egress.
                        </Typography>
                      </Box>
                      <Button component="label" variant="contained" size="small" startIcon={<UploadIcon />}>
                        Upload imaging / referral PDF
                        <input type="file" hidden accept="application/pdf,image/*" onChange={(e) => void handleDocs(e.target.files)} />
                      </Button>
                    </Box>

                    <Box sx={{ mt: 2, maxHeight: 192, overflow: 'auto', borderRadius: 3, border: 1, borderColor: 'divider' }}>
                      <Box component="ul" sx={{ m: 0, p: 0, px: 2 }}>
                        {(patient.documents ?? []).length === 0 && (
                          <Typography component="li" variant="caption" color="text.secondary" sx={{ listStyle: 'none', py: 4, display: 'block', textAlign: 'center' }}>
                            Awaiting uploads
                          </Typography>
                        )}
                        {(patient.documents ?? []).map((doc, idx) => (
                          <Box
                            key={doc.id}
                            component="li"
                            sx={{
                              display: 'flex',
                              flexWrap: 'wrap',
                              justifyContent: 'space-between',
                              gap: 1,
                              py: 1.5,
                              listStyle: 'none',
                              borderTop: idx > 0 ? 1 : 0,
                              borderColor: 'divider',
                              typography: 'caption',
                            }}
                          >
                            <Typography sx={{ fontWeight: 600 }}>{doc.name}</Typography>
                            <Typography color="text.secondary">{new Date(doc.uploadedAt).toLocaleString()}</Typography>
                          </Box>
                        ))}
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mt: 3 }}>
                      <Button type="submit" variant="contained">
                        Save profile · mock sync
                      </Button>
                      <Chip label="HIPAA-aligned posture (sandbox)" size="small" variant="filled" />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </AnimatedCard>
          </>
        )}
      </Stack>
    </AnimatedPage>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <Stack spacing={1}>
      <FormLabel sx={{ typography: 'caption', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {label}
      </FormLabel>
      {children}
      {hint && (
        <Typography variant="caption" color="text.secondary">
          {hint}
        </Typography>
      )}
    </Stack>
  )
}

function splitList(value?: string) {
  return (value ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}
