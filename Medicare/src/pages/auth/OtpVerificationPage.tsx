import { type KeyboardEvent, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import { paths } from '@/routes/routes'

const LENGTH = 6

export function OtpVerificationPage() {
  const navigate = useNavigate()
  const [digits, setDigits] = useState<string[]>(() => Array.from({ length: LENGTH }, () => ''))
  const refs = useRef<Array<HTMLInputElement | null>>([])

  function update(idx: number, value: string) {
    if (!/^\d?$/.test(value)) return
    const next = [...digits]
    next[idx] = value
    setDigits(next)
    if (value && idx < LENGTH - 1) refs.current[idx + 1]?.focus()
  }

  function onKeyDown(idx: number, evt: KeyboardEvent<HTMLInputElement>) {
    if (evt.key === 'Backspace' && !digits[idx] && idx > 0) {
      refs.current[idx - 1]?.focus()
    }
  }

  function verify() {
    const code = digits.join('')
    if (code.length < LENGTH) {
      toast.error('Please enter the full verification code.')
      return
    }
    toast.success(`Code ${code} verified`)
    navigate(paths.resetPassword, { replace: true })
  }

  return (
    <Box>
      <Typography variant="h5" fontWeight={500} textAlign="center" gutterBottom>
        Verify Code
      </Typography>
      <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mb: 3 }}>
        Enter the 6-digit code sent to your email
      </Typography>

      <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
        {digits.map((value, idx) => (
          <TextField
            key={idx}
            inputRef={(node) => { refs.current[idx] = node }}
            value={value}
            onChange={(e) => update(idx, e.target.value.slice(-1))}
            onKeyDown={(e) => onKeyDown(idx, e as KeyboardEvent<HTMLInputElement>)}
            inputProps={{ maxLength: 1, style: { textAlign: 'center', fontSize: 20 }, inputMode: 'numeric' }}
            sx={{ flex: 1 }}
          />
        ))}
      </Box>

      <Button fullWidth variant="contained" size="large" onClick={verify}>
        Verify
      </Button>

      <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mt: 2 }}>
        <Link to={paths.login} style={{ color: '#00796B' }}>Back to sign in</Link>
      </Typography>
    </Box>
  )
}
