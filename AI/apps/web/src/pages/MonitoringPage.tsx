import { buildAiLogs } from '@/services/mockData'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

export function MonitoringPage() {
  const logs = buildAiLogs()

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">AI Monitoring</h1>
      <div className="grid gap-4 sm:grid-cols-3">
        <Card><p className="text-sm text-zinc-500">API calls (24h)</p><p className="text-2xl font-bold">1,247</p></Card>
        <Card><p className="text-sm text-zinc-500">Error rate</p><p className="text-2xl font-bold text-emerald-500">0.8%</p></Card>
        <Card><p className="text-sm text-zinc-500">P95 latency</p><p className="text-2xl font-bold">2.1s</p></Card>
      </div>
      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-left dark:border-zinc-800">
              <th className="pb-2">Time</th>
              <th>Type</th>
              <th>Message</th>
              <th>Model</th>
              <th>Latency</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-b border-zinc-100 dark:border-zinc-800/50">
                <td className="py-2 text-zinc-500">{new Date(log.createdAt).toLocaleString()}</td>
                <td><Badge>{log.type}</Badge></td>
                <td className="max-w-md truncate">{log.message}</td>
                <td>{log.model}</td>
                <td>{log.latencyMs}ms</td>
                <td className={log.status === 'error' ? 'text-red-500' : 'text-emerald-500'}>{log.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
