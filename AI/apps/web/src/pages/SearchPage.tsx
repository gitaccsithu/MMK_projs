import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Search } from 'lucide-react'
import { searchKnowledge } from '@/services/agentApi'
import { useKnowledgeStore } from '@/store'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import type { SearchResult } from '@insightflow/shared'

export function SearchPage() {
  const [q, setQ] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const addSearch = useKnowledgeStore((s) => s.addSearch)
  const recent = useKnowledgeStore((s) => s.recentSearches)

  async function runSearch() {
    if (!q.trim()) return
    setLoading(true)
    addSearch(q)
    try {
      const res = await searchKnowledge(q)
      setResults(res.results)
    } catch {
      setResults([])
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold">Enterprise Search</h1>
      <div className="flex gap-2">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search knowledge…" onKeyDown={(e) => e.key === 'Enter' && runSearch()} />
        <Button onClick={runSearch} disabled={loading}><Search className="h-4 w-4" /></Button>
      </div>
      {recent.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {recent.map((s) => (
            <button key={s} type="button" onClick={() => { setQ(s); }} className="text-xs text-zinc-500 hover:text-indigo-500">{s}</button>
          ))}
        </div>
      )}
      <div className="space-y-3">
        {results.map((r) => (
          <Card key={r.docSlug}>
            <Link to={`/app/knowledge/${r.docSlug}`} className="font-semibold text-indigo-500 hover:underline">{r.docTitle}</Link>
            <p className="mt-1 text-sm text-zinc-500">{r.category} · score {(r.score * 100).toFixed(0)}%</p>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{r.excerpt}</p>
          </Card>
        ))}
      </div>
    </div>
  )
}
