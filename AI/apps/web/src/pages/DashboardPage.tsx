import { Link } from 'react-router-dom'
import { MessageSquare, BookOpen, Upload, BarChart3, FileText, Zap } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { useAppStore, useSettingsStore } from '@/store'
import { motion } from 'framer-motion'

export function DashboardPage() {
  const analytics = useAppStore((s) => s.analytics)
  const agentOnline = useSettingsStore((s) => s.agentOnline)

  const cards = [
    { label: 'Documents', value: analytics.totalDocuments, icon: FileText },
    { label: 'Total queries', value: analytics.totalQueries.toLocaleString(), icon: Zap },
    { label: 'Today', value: analytics.dailyQueries, icon: MessageSquare },
    { label: 'Avg response', value: `${analytics.avgResponseMs}ms`, icon: BarChart3 },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-zinc-500">Enterprise AI knowledge workspace {agentOnline ? '· Agent connected' : '· Agent offline'}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c, i) => (
          <motion.div key={c.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card>
              <c.icon className="mb-2 h-5 w-5 text-indigo-500" />
              <p className="text-2xl font-bold">{c.value}</p>
              <p className="text-sm text-zinc-500">{c.label}</p>
            </Card>
          </motion.div>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Link to="/app/chat"><Card className="hover:border-indigo-500/50 transition-colors"><MessageSquare className="mb-2 h-6 w-6 text-indigo-500" /><h3 className="font-semibold">AI Chat</h3><p className="text-sm text-zinc-500">RAG-powered Q&A</p></Card></Link>
        <Link to="/app/knowledge"><Card className="hover:border-indigo-500/50"><BookOpen className="mb-2 h-6 w-6 text-indigo-500" /><h3 className="font-semibold">Knowledge</h3><p className="text-sm text-zinc-500">Browse internal docs</p></Card></Link>
        <Link to="/app/ingest"><Card className="hover:border-indigo-500/50"><Upload className="mb-2 h-6 w-6 text-indigo-500" /><h3 className="font-semibold">Ingestion</h3><p className="text-sm text-zinc-500">Upload & index</p></Card></Link>
      </div>
      <Card>
        <h3 className="font-semibold">Popular topics</h3>
        <ul className="mt-3 space-y-2">
          {analytics.popularTopics.map((t) => (
            <li key={t.topic} className="flex justify-between text-sm">
              <span>{t.topic}</span>
              <span className="text-zinc-500">{t.count} queries</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
