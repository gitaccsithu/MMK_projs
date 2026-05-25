import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'
import { useAppStore } from '@/store'
import { buildUsageTrend } from '@/services/mockData'
import { Card } from '@/components/ui/Card'

const COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe']

export function AnalyticsPage() {
  const analytics = useAppStore((s) => s.analytics)
  const trend = buildUsageTrend()

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Analytics</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><p className="text-sm text-zinc-500">Token usage today</p><p className="text-2xl font-bold">{analytics.tokenUsageToday.toLocaleString()}</p></Card>
        <Card><p className="text-sm text-zinc-500">Queries today</p><p className="text-2xl font-bold">{analytics.dailyQueries}</p></Card>
        <Card><p className="text-sm text-zinc-500">Avg latency</p><p className="text-2xl font-bold">{analytics.avgResponseMs}ms</p></Card>
        <Card><p className="text-sm text-zinc-500">Documents</p><p className="text-2xl font-bold">{analytics.totalDocuments}</p></Card>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h3 className="font-semibold mb-4">Usage trend</h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={trend}>
              <XAxis dataKey="day" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="queries" stroke="#6366f1" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <h3 className="font-semibold mb-4">Popular topics</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={analytics.popularTopics} dataKey="count" nameKey="topic" cx="50%" cy="50%" outerRadius={80} label>
                {analytics.popularTopics.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
        <Card className="lg:col-span-2">
          <h3 className="font-semibold mb-4">Daily tokens</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={trend}>
              <XAxis dataKey="day" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="tokens" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  )
}
