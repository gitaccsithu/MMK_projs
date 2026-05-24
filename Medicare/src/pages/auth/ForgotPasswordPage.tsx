import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import { paths } from '@/routes/routes'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')

  function handle(evt: FormEvent) {
    evt.preventDefault()
    toast.success(`Password reset link sent to ${email || 'your email'}`)
    setEmail('')
  }

  return (
    <Box>
      <Typography variant="h5" fontWeight={500} textAlign="center" gutterBottom>
        Forgot Password
      </Typography>
      <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mb: 3 }}>
        Enter your email to receive a reset link
      </Typography>

      <Box component="form" onSubmit={handle}>
        <TextField
          fullWidth
          label="Email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          sx={{ mb: 3 }}
        />
        <Button type="submit" fullWidth variant="contained" size="large">
          Send Reset Link
        </Button>
      </Box>

      <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mt: 2 }}>
        <Link to={paths.login} style={{ color: '#00796B' }}>Back to sign in</Link>
      </Typography>
    </Box>
  )
}
