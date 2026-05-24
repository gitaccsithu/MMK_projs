import { AnimatedPage } from '@/components/shared/AnimatedPage'
import { EmptyState } from '@/components/shared/EmptyState'
import { PageHeader } from '@/components/shared/PageHeader'
import { SPECIALTIES } from '@/types'
import type { DoctorSpecialty } from '@/types'
import * as api from '@/services/mockApi'
import { useAuthStore } from '@/store/index'
import { useDoctorWorkspace } from '@/pages/doctor/useDoctorWorkspace'
import ShieldIcon from '@mui/icons-material/Shield'
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
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

/** Profile + MediCare roster metadata syncing for doctors. */
export function DoctorSettingsPage() {
  const userId = useAuthStore((s) => s.session?.userId)
  const authUser = useAuthStore((s) => s.user)
  const { doctor, loading: wsLoad, reload } = useDoctorWorkspace(userId)

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [specialty, setSpecialty] = useState<DoctorSpecialty>(SPECIALTIES[0])
  const [license, setLicense] = useState('')
  const [fee, setFee] = useState(75)
  const [bio, setBio] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!authUser) return
    setName(authUser.name)
    setPhone(authUser.phone)
  }, [authUser])

  useEffect(() => {
    if (!doctor) return
    setSpecialty(doctor.specialty)
    setLicense(doctor.licenseNumber)
    setFee(doctor.consultationFee)
    setBio(doctor.bio)
  }, [doctor])

  const persist = async () => {
    if (!authUser?.id || !doctor) return
    setBusy(true)
    try {
      const userRes = await api.updateUser(authUser.id, { name: name.trim(), phone: phone.trim() })
      if (userRes.error) {
        toast.error(userRes.error)
        return
      }
      const docRes = await api.updateDoctor(doctor.id, {
        specialty,
        licenseNumber: license,
        bio,
        consultationFee: Number(fee) || doctor.consultationFee,
      })
      if (docRes.error) toast.error(docRes.error)
      else {
        toast.success('Profile synced locally.')
        useAuthStore.setState({ user: userRes.data })
        await reload()
      }
    } finally {
      setBusy(false)
    }
  }

  if (!wsLoad && doctor === null) {
    return (
      <AnimatedPage>
        <EmptyState title="Profile unavailable" description="No clinician record found." />
      </AnimatedPage>
    )
  }

  return (
    <AnimatedPage>
      <PageHeader title="Clinician settings" description="Update how MediCare renders your persona to patients & operations." />

      <Stack spacing={3}>
        <Card variant="outlined" sx={{ borderColor: 'success.light' }}>
          <CardHeader
            title={
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <ShieldIcon color="primary" />
                <span>Verification snapshot</span>
              </Stack>
            }
            subheader="Mock onboarding — production would hydrate state from payer enrollment."
            titleTypographyProps={{ variant: 'h6' }}
            action={doctor?.verificationStatus && <Chip label={doctor.verificationStatus} size="small" />}
          />
        </Card>

        <Stack direction={{ xs: 'column', lg: 'row' }} spacing={3}>
          <Card variant="outlined" sx={{ borderColor: 'success.light', flex: 1 }}>
            <CardHeader title="Identity" subheader="Synced with MediCare SSO record." />
            <CardContent sx={{ pt: 0 }}>
              <Stack spacing={2}>
                <TextField id="doc-name" label="Display name" value={name} onChange={(e) => setName(e.target.value)} fullWidth />
                <TextField id="doc-phone" label="Mobile / pager" value={phone} onChange={(e) => setPhone(e.target.value)} fullWidth />
              </Stack>
            </CardContent>
          </Card>

          <Card variant="outlined" sx={{ borderColor: 'success.light', flex: 1 }}>
            <CardHeader title="Roster economics" subheader="Feeds patient-facing estimator widgets." />
            <CardContent sx={{ pt: 0 }}>
              <Stack spacing={2}>
                <FormControl fullWidth>
                  <InputLabel id="spec-label">Specialty</InputLabel>
                  <Select labelId="spec-label" label="Specialty" value={specialty} onChange={(e) => setSpecialty(e.target.value as DoctorSpecialty)}>
                    {SPECIALTIES.map((s) => (
                      <MenuItem key={s} value={s}>
                        {s}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField id="doc-license" label="Medical license ID" value={license} onChange={(e) => setLicense(e.target.value)} fullWidth />
                <TextField
                  id="doc-fee"
                  label="Consultation fee (USD)"
                  type="number"
                  value={fee}
                  slotProps={{ input: { inputProps: { min: 25, step: 5 } } }}
                  onChange={(e) => setFee(Number(e.target.value))}
                  fullWidth
                />
              </Stack>
            </CardContent>
          </Card>
        </Stack>

        <Card variant="outlined" sx={{ borderColor: 'success.light' }}>
          <CardHeader title="Practice narrative" />
          <CardContent sx={{ pt: 0 }}>
            <Stack spacing={2}>
              <TextField
                id="doc-bio"
                label="Patient-facing biography"
                multiline
                minRows={6}
                fullWidth
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Short clinical philosophy, procedural focus, scheduling expectations…"
              />
              <Button variant="contained" onClick={() => void persist()} disabled={busy}>
                {busy ? 'Saving…' : 'Save profile'}
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </AnimatedPage>
  )
}
