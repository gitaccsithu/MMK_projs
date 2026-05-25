import { useSettingsStore, useAuthStore } from '@/store'
import { fetchHealth } from '@/services/agentApi'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export function SettingsPage() {
  const user = useAuthStore((s) => s.user)
  const { theme, toggleTheme, promptSettings, setAgentOnline } = useSettingsStore()

  async function checkAgent() {
    try {
      await fetchHealth()
      setAgentOnline(true)
      alert('Agent is online')
    } catch {
      setAgentOnline(false)
      alert('Agent offline — run npm run dev from AI/ root')
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold">Settings</h1>
      <Card>
        <h3 className="font-semibold">Profile</h3>
        <p className="mt-2 text-sm">{user?.name} · {user?.email}</p>
        <p className="text-sm text-zinc-500 capitalize">{user?.role} · {user?.department}</p>
      </Card>
      <Card>
        <h3 className="font-semibold">Appearance</h3>
        <Button variant="outline" className="mt-2" onClick={toggleTheme}>Theme: {theme}</Button>
      </Card>
      <Card>
        <h3 className="font-semibold">AI connection</h3>
        <Button className="mt-2" onClick={checkAgent}>Test agent health</Button>
        <p className="mt-2 text-xs text-zinc-500">Model: {promptSettings.model}</p>
      </Card>
      <Card>
        <h3 className="font-semibold">Clear local data</h3>
        <Button variant="outline" className="mt-2" onClick={() => { localStorage.clear(); location.reload() }}>Reset LocalStorage</Button>
      </Card>
    </div>
  )
}
