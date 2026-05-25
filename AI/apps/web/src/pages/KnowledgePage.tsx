import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Star, Search } from 'lucide-react'
import { useKnowledgeStore } from '@/store'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'

export function KnowledgePage() {
  const { documents, favorites, toggleFavorite } = useKnowledgeStore()
  const [q, setQ] = useState('')
  const [dept, setDept] = useState('all')

  const filtered = documents.filter((d) => {
    const matchQ = !q || d.title.toLowerCase().includes(q.toLowerCase()) || d.tags.some((t) => t.includes(q.toLowerCase()))
    const matchDept = dept === 'all' || d.department === dept
    return matchQ && matchDept
  })

  const departments = ['all', ...new Set(documents.map((d) => d.department))]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Knowledge Base</h1>
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" placeholder="Search documents…" />
        </div>
        <select value={dept} onChange={(e) => setDept(e.target.value)} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900">
          {departments.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((doc) => (
          <Card key={doc.id} className="relative">
            <button type="button" className="absolute right-3 top-3" onClick={() => toggleFavorite(doc.slug)}>
              <Star className={`h-4 w-4 ${favorites.includes(doc.slug) ? 'fill-amber-400 text-amber-400' : 'text-zinc-400'}`} />
            </button>
            <Badge>{doc.department}</Badge>
            <Link to={`/app/knowledge/${doc.slug}`} className="mt-2 block font-semibold hover:text-indigo-500">{doc.title}</Link>
            <p className="mt-1 text-xs text-zinc-500">{doc.tags.join(' · ')}</p>
            <p className="mt-2 text-xs text-zinc-400">Updated {doc.updatedAt}</p>
          </Card>
        ))}
      </div>
    </div>
  )
}
