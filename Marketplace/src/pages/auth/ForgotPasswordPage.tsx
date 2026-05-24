import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useState } from 'react'
import { AuthLayout } from '@/layouts/AuthLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { delay } from '@/utils/cn'

const schema = z.object({ email: z.string().email('Invalid email') })

export function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) })

  const onSubmit = async (data: z.infer<typeof schema>) => {
    setLoading(true)
    await delay(800)
    setLoading(false)
    setSent(true)
    toast.success(`Reset link sent to ${data.email}`)
  }

  return (
    <AuthLayout>
      <Card className="border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl">Forgot password?</CardTitle>
          <CardDescription>
            {sent ? 'Check your email for reset instructions' : 'Enter your email to receive a reset link'}
          </CardDescription>
        </CardHeader>
        {!sent ? (
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" placeholder="you@example.com" {...register('email')} />
                {errors.email && <p className="text-xs text-destructive">{String(errors.email.message)}</p>}
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Sending...' : 'Send reset link'}
              </Button>
            </CardContent>
          </form>
        ) : (
          <CardContent>
            <div className="rounded-lg bg-green-50 dark:bg-green-900/20 p-4 text-center text-sm">
              We've sent password reset instructions to your email. This is a demo — no email was actually sent.
            </div>
            <Button className="w-full mt-4" asChild>
              <Link to="/login">Back to login</Link>
            </Button>
          </CardContent>
        )}
        {!sent && (
          <div className="px-6 pb-6 text-center">
            <Link to="/login" className="text-sm text-primary hover:underline">Back to login</Link>
          </div>
        )}
      </Card>
    </AuthLayout>
  )
}
