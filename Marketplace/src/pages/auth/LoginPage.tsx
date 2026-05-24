import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Zap, Mail, Lock, Globe, Code2 } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { DEMO_ACCOUNTS } from '@/data/demoAccounts'
import { getRoleHome } from '@/routes/roleRoutes'
import { AuthLayout } from '@/layouts/AuthLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().optional(),
})

type FormData = z.infer<typeof schema>

export function LoginPage() {
  const navigate = useNavigate()
  const { login, isLoading, error, clearError } = useAuthStore()
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { rememberMe: false },
  })

  const onSubmit = async (data: FormData) => {
    clearError()
    const success = await login(data.email, data.password, data.rememberMe)
    if (success) {
      toast.success('Welcome back!')
      const account = DEMO_ACCOUNTS.find((a) => a.email === data.email)
      navigate(getRoleHome(account?.role ?? 'customer'))
    }
  }

  const quickLogin = async (email: string, password: string) => {
    setValue('email', email)
    setValue('password', password)
    clearError()
    const success = await login(email, password, true)
    if (success) {
      toast.success('Demo login successful!')
      const account = DEMO_ACCOUNTS.find((a) => a.email === email)!
      navigate(getRoleHome(account.role))
    }
  }

  return (
    <AuthLayout>
      <div className="mb-6 flex items-center gap-2 lg:hidden">
        <Zap className="h-7 w-7 text-primary" />
        <span className="text-xl font-bold">ServiceHub</span>
      </div>
      <Card className="border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl">Welcome back</CardTitle>
          <CardDescription>Sign in to your ServiceHub account</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="email" className="pl-9" placeholder="you@example.com" {...register('email')} />
              </div>
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="password" type="password" className="pl-9" placeholder="••••••••" {...register('password')} />
              </div>
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" {...register('rememberMe')} className="rounded" />
                Remember me
              </label>
              <Link to="/forgot-password" className="text-sm text-primary hover:underline">Forgot password?</Link>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Signing in...' : 'Sign in'}
            </Button>
            <div className="relative">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">Or continue with</span></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button type="button" variant="outline" onClick={() => toast.info('Google login is a demo UI only')}>
                <Globe className="mr-2 h-4 w-4" /> Google
              </Button>
              <Button type="button" variant="outline" onClick={() => toast.info('GitHub login is a demo UI only')}>
                <Code2 className="mr-2 h-4 w-4" /> GitHub
              </Button>
            </div>
            <div className="space-y-2">
              <p className="text-xs text-center text-muted-foreground">Quick demo login</p>
              <div className="grid grid-cols-3 gap-2">
                {DEMO_ACCOUNTS.map((acc) => (
                  <Button key={acc.email} type="button" variant="secondary" size="sm" onClick={() => quickLogin(acc.email, acc.password)}>
                    {acc.role}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </form>
        <CardFooter className="justify-center">
          <p className="text-sm text-muted-foreground">
            Don't have an account? <Link to="/register" className="text-primary hover:underline">Sign up</Link>
          </p>
        </CardFooter>
      </Card>
    </AuthLayout>
  )
}
