import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'
import { toast } from 'sonner'
import { AuthLayout } from '@/layouts/AuthLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

export function OtpVerificationPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const email = (location.state as { email?: string })?.email ?? 'your email'
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [timer, setTimer] = useState(60)
  const inputs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (timer <= 0) return
    const t = setTimeout(() => setTimer((v) => v - 1), 1000)
    return () => clearTimeout(t)
  }, [timer])

  const handleChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return
    const next = [...otp]
    next[index] = value
    setOtp(next)
    if (value && index < 5) inputs.current[index + 1]?.focus()
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus()
    }
  }

  const verify = () => {
    if (otp.some((d) => !d)) {
      toast.error('Please enter the complete OTP')
      return
    }
    toast.success('Email verified successfully!')
    navigate('/login')
  }

  return (
    <AuthLayout>
      <Card className="border-0 shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Verify your email</CardTitle>
          <CardDescription>We sent a 6-digit code to {email}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-center gap-2">
            {otp.map((digit, i) => (
              <Input
                key={i}
                ref={(el) => { inputs.current[i] = el }}
                className="h-12 w-12 text-center text-lg font-bold"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
              />
            ))}
          </div>
          <Button className="w-full" onClick={verify}>Verify Email</Button>
          <p className="text-center text-sm text-muted-foreground">
            {timer > 0 ? (
              <>Resend code in {timer}s</>
            ) : (
              <button className="text-primary hover:underline" onClick={() => { setTimer(60); toast.info('OTP resent (demo)') }}>
                Resend code
              </button>
            )}
          </p>
          <div className="text-center">
            <Link to="/login" className="text-sm text-primary hover:underline">Back to login</Link>
          </div>
        </CardContent>
      </Card>
    </AuthLayout>
  )
}
