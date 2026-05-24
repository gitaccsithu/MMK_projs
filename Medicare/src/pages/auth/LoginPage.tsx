import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'
import Grid from '@mui/material/Grid'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import { DEMO_ACCOUNTS } from '@/data/demoAccounts'
import { getRoleHome, paths } from '@/routes/routes'
import { useAuthStore } from '@/store'
import type { DemoAccount } from '@/data/demoAccounts'

export function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const login = useAuthStore((s) => s.login)
  const clearError = useAuthStore((s) => s.clearError)
  const [busyAccount, setBusyAccount] = useState<string | null>(null)

  function touchRememberReminder(userId: string) {
    if (remember) sessionStorage.setItem('medicare-reminder', userId)
    else sessionStorage.removeItem('medicare-reminder')
  }

  async function handleClassicLogin(evt: FormEvent) {
    evt.preventDefault()
    clearError()
    setBusyAccount('manual')
    const ok = await login(email.trim(), password, remember)
    const snapshot = useAuthStore.getState().session
    if (!ok || !snapshot) {
      setBusyAccount(null)
      alert(useAuthStore.getState().error ?? 'Unable to authenticate')
      return
    }
    touchRememberReminder(snapshot.userId)
    navigate(getRoleHome(snapshot.role), { replace: true })
    setBusyAccount(null)
  }

  async function quickLogin(account: DemoAccount) {
    clearError()
    setBusyAccount(account.email)
    const ok = await login(account.email, account.password, remember)
    const snapshot = useAuthStore.getState().session
    if (!ok || !snapshot) {
      setBusyAccount(null)
      alert(useAuthStore.getState().error ?? 'Demo login unavailable')
      return
    }
    touchRememberReminder(snapshot.userId)
    navigate(getRoleHome(account.role), { replace: true })
    setBusyAccount(null)
  }

  async function oauthSim(provider: string) {
    alert(`${provider} SSO mock — wiring happens in MediCare federation phase.`)
  }

  return (
    <Box>
      <Typography variant="h5" fontWeight={500} textAlign="center" gutterBottom>
        Sign In
      </Typography>
      <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mb: 3 }}>
        Use demo accounts or enter credentials manually
      </Typography>

      <Typography variant="overline" color="text.secondary" display="block" sx={{ mb: 1 }}>
        Quick Demo Login
      </Typography>
      <Grid container spacing={1} sx={{ mb: 3 }}>
        {DEMO_ACCOUNTS.map((account) => (
          <Grid item key={account.email} xs={6}>
            <Button
              fullWidth
              variant={account.role === 'admin' ? 'contained' : 'outlined'}
              disabled={Boolean(busyAccount)}
              onClick={() => void quickLogin(account)}
              sx={{ py: 1.5, flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left' }}
            >
              <Box sx={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" fontWeight={600} sx={{ textTransform: 'capitalize' }}>
                  {account.role}
                </Typography>
                {busyAccount === account.email && <CircularProgress size={16} />}
              </Box>
              <Typography variant="caption" display="block">{account.name}</Typography>
              <Typography variant="caption" color="text.secondary" noWrap>{account.email}</Typography>
            </Button>
          </Grid>
        ))}
      </Grid>

      <Divider sx={{ my: 2 }}>or</Divider>

      <Box component="form" onSubmit={(e) => void handleClassicLogin(e)}>
        <TextField
          fullWidth
          label="Email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          sx={{ mb: 2 }}
        />
        <TextField
          fullWidth
          label="Password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          sx={{ mb: 2 }}
        />
        <FormControlLabel
          control={<Checkbox checked={remember} onChange={(e) => setRemember(e.target.checked)} />}
          label="Remember me"
          sx={{ mb: 2 }}
        />
        <Button
          type="submit"
          fullWidth
          variant="contained"
          size="large"
          disabled={Boolean(busyAccount)}
          startIcon={busyAccount === 'manual' ? <CircularProgress size={18} color="inherit" /> : undefined}
        >
          Sign In
        </Button>
      </Box>

      <Grid container spacing={1} sx={{ mt: 2 }}>
        {['Google', 'Okta', 'Microsoft'].map((provider) => (
          <Grid item key={provider} xs={4}>
            <Button fullWidth variant="outlined" size="small" onClick={() => void oauthSim(provider)}>
              {provider}
            </Button>
          </Grid>
        ))}
      </Grid>

      <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mt: 3 }}>
        <Link to={paths.forgotPassword} style={{ color: '#00796B' }}>Forgot password?</Link>
        {' · '}
        <Link to={paths.register} style={{ color: '#00796B' }}>Create account</Link>
      </Typography>
    </Box>
  )
}
