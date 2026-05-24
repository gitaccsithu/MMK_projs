import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import { paths } from '@/routes/routes'

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')

  function handle(evt: FormEvent) {
    evt.preventDefault()
    if (password !== confirm) {
      toast.error('Passwords do not match.')
      return
    }
    if (password.length < 10) {
      toast.error('Use at least 10 characters.')
      return
    }
    toast.success('Password updated successfully')
    navigate(paths.login, { replace: true })
  }

  return (
    <Box>
      <Typography variant="h5" fontWeight={500} textAlign="center" gutterBottom>
        Reset Password
      </Typography>
      <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mb: 3 }}>
        Enter your new password
      </Typography>

      <Box component="form" onSubmit={handle}>
        <TextField
          fullWidth
          label="New Password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          sx={{ mb: 2 }}
        />
        <TextField
          fullWidth
          label="Confirm Password"
          type="password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          sx={{ mb: 3 }}
        />
        <Button type="submit" fullWidth variant="contained" size="large">
          Update Password
        </Button>
      </Box>

      <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mt: 2 }}>
        <Link to={paths.login} style={{ color: '#00796B' }}>Back to sign in</Link>
      </Typography>
    </Box>
  )
}
