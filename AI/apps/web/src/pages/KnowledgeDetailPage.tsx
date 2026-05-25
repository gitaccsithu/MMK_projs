import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import { summarizeDoc } from '@/services/agentApi'
import { useKnowledgeStore } from '@/store'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'

export function KnowledgeDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const doc = useKnowledgeStore((s) => s.documents.find((d) => d.slug === slug))
  const [content, setContent] = useState('')
  const [summary, setSummary] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!slug) return
    fetch(`/api/documents/${slug}`)
      .then((r) => r.json())
      .then((data) => setContent(data.content ?? ''))
      .catch(() => setContent('# Document\n\nContent unavailable. Ensure the agent server is running.'))
      .finally(() => setLoading(false))
  }, [slug])

  async function handleSummarize() {
    if (!slug) return
    setSummary('Generating…')
    try {
      const res = await summarizeDoc(slug)
      setSummary(res.summary)
    } catch {
      setSummary('Summarization requires a running agent with OPENROUTER_API_KEY.')
    }
  }

  if (!doc) return <p>Document not found.</p>

  return (
    <div className="space-y-6">
      <Link to="/app/knowledge" className="text-sm text-indigo-500">← Knowledge base</Link>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{doc.title}</h1>
          <p className="text-zinc-500">{doc.department} · {doc.category}</p>
        </div>
        <Button onClick={handleSummarize}>AI Summarize</Button>
      </div>
      {summary && (
        <Card>
          <h3 className="text-sm font-semibold text-indigo-500">AI Summary</h3>
          <div className="prose prose-sm dark:prose-invert mt-2"><ReactMarkdown>{summary}</ReactMarkdown></div>
        </Card>
      )}
      <Card>
        {loading ? <Skeleton className="h-64 w-full" /> : (
          <article className="prose prose-zinc max-w-none dark:prose-invert">
            <ReactMarkdown>{content || '_Loading…_'}</ReactMarkdown>
          </article>
        )}
      </Card>
    </div>
  )
}
