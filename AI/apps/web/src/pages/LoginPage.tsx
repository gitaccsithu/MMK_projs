import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Zap } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { useAuthStore } from '@/store'

export function LoginPage() {
  const [email, setEmail] = useState('alex@insightflow.example.com')
  const login = useAuthStore((s) => s.login)
  const navigate = useNavigate()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    login(email)
    navigate('/app')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-6">
      <Card className="w-full max-w-md border-zinc-800 bg-zinc-900/80">
        <div className="mb-6 flex items-center gap-2">
          <Zap className="h-6 w-6 text-indigo-400" />
          <span className="font-semibold text-zinc-100">InsightFlow AI</span>
        </div>
        <h1 className="text-xl font-semibold text-zinc-100">Sign in</h1>
        <p className="mt-1 text-sm text-zinc-400">Demo enterprise workspace</p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="text-xs text-zinc-500">Email</label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 border-zinc-700 bg-zinc-800 text-zinc-100" />
          </div>
          <Button type="submit" className="w-full">Continue</Button>
        </form>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => { login('alex@insightflow.example.com'); navigate('/app') }}>
            Member demo
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={() => { login('admin@insightflow.example.com'); navigate('/app') }}>
            Admin demo
          </Button>
        </div>
        <p className="mt-6 text-center text-xs text-zinc-500">
          <Link to="/" className="text-indigo-400 hover:underline">Back to home</Link>
        </p>
      </Card>
    </div>
  )
}
