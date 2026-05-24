import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import ButtonGroup from '@mui/material/ButtonGroup'
import type { UserRole } from '@/types'
import * as api from '@/services/mockApi'
import { getRoleHome, paths } from '@/routes/routes'
import { useAuthStore } from '@/store'

export function RegisterPage() {
  const navigate = useNavigate()
  const sessionLogin = useAuthStore((s) => s.login)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState<Extract<UserRole, 'patient' | 'doctor'>>('patient')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(evt: FormEvent) {
    evt.preventDefault()
    setBusy(true)
    const res = await api.register({
      email: email.trim(),
      password,
      name: name.trim(),
      phone,
      role,
    })
    setBusy(false)
    if (res.error || !res.data) {
      toast.error(res.error ?? 'Registration failed.')
      return
    }
    const authenticated = await sessionLogin(email.trim(), password, false)
    if (!authenticated) {
      toast.error('Registered but sign-in failed.')
      return
    }
    toast.success('Account created successfully.')
    navigate(getRoleHome(role), { replace: true })
  }

  return (
    <Box>
      <Typography variant="h5" fontWeight={500} textAlign="center" gutterBottom>
        Create Account
      </Typography>
      <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mb: 3 }}>
        Register as a patient or doctor
      </Typography>

      <Box component="form" onSubmit={(e) => void handleSubmit(e)}>
        <Typography variant="body2" sx={{ mb: 1 }}>Account Type</Typography>
        <ButtonGroup fullWidth sx={{ mb: 2 }}>
          {(['patient', 'doctor'] as const).map((r) => (
            <Button
              key={r}
              variant={role === r ? 'contained' : 'outlined'}
              onClick={() => setRole(r)}
              type="button"
            >
              {r === 'doctor' ? 'Doctor' : 'Patient'}
            </Button>
          ))}
        </ButtonGroup>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
          Admin and receptionist roles require executive provisioning.
        </Typography>

        <TextField fullWidth label="Full Name" required value={name} onChange={(e) => setName(e.target.value)} sx={{ mb: 2 }} />
        <TextField fullWidth label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} sx={{ mb: 2 }} />
        <TextField fullWidth label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} sx={{ mb: 2 }} />
        <TextField fullWidth label="Password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} sx={{ mb: 3 }} />

        <Button type="submit" fullWidth variant="contained" size="large" disabled={busy}>
          {busy ? 'Creating account…' : 'Register'}
        </Button>
      </Box>

      <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mt: 2 }}>
        Already have an account? <Link to={paths.login} style={{ color: '#00796B' }}>Sign in</Link>
      </Typography>
    </Box>
  )
}
