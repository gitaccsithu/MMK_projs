import { useState } from 'react'
import { motion } from 'framer-motion'
import { Upload, CheckCircle2 } from 'lucide-react'
import { triggerIngest } from '@/services/agentApi'
import { useAppStore } from '@/store'
import { generateId } from '@/utils/cn'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import type { IngestionStep } from '@insightflow/shared'

const STEPS: IngestionStep[] = ['uploading', 'parsing', 'chunking', 'embedding', 'indexing', 'completed']

export function IngestPage() {
  const { ingestionJobs, addJob, updateJob } = useAppStore()
  const [busy, setBusy] = useState(false)

  async function simulatePipeline(fileName: string) {
    const id = generateId('job')
    addJob({ id, fileName, status: 'uploading', progress: 0, logs: [], startedAt: new Date().toISOString() })
    setBusy(true)
    for (let i = 0; i < STEPS.length; i++) {
      const step = STEPS[i]
      await new Promise((r) => setTimeout(r, 600))
      updateJob(id, {
        status: step,
        progress: Math.round(((i + 1) / STEPS.length) * 100),
        logs: [`[${new Date().toLocaleTimeString()}] ${step}…`],
      })
    }
    try {
      const res = await triggerIngest(true)
      updateJob(id, {
        status: 'completed',
        progress: 100,
        chunkCount: res.chunkCount,
        completedAt: new Date().toISOString(),
        logs: [`Indexed ${res.documentCount} docs, ${res.chunkCount} chunks`],
      })
    } catch (e) {
      updateJob(id, { status: 'failed', logs: [String(e)] })
    }
    setBusy(false)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">File Ingestion Pipeline</h1>
      <Card
        className="border-dashed border-2 flex flex-col items-center justify-center py-16 cursor-pointer hover:border-indigo-500/50"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          const f = e.dataTransfer.files[0]
          if (f) simulatePipeline(f.name)
        }}
        onClick={() => !busy && simulatePipeline('uploaded-document.md')}
      >
        <Upload className="h-10 w-10 text-indigo-500 mb-3" />
        <p className="font-medium">Drag & drop or click to ingest</p>
        <p className="text-sm text-zinc-500 mt-1">Rebuilds vector index from knowledge/ + uploads</p>
      </Card>
      <Button onClick={() => simulatePipeline('full-reindex')} disabled={busy}>Rebuild full index</Button>
      <div className="space-y-4">
        {ingestionJobs.map((job) => (
          <Card key={job.id}>
            <div className="flex justify-between">
              <span className="font-medium">{job.fileName}</span>
              <span className="text-sm capitalize">{job.status}</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
              <motion.div className="h-full bg-indigo-500" initial={{ width: 0 }} animate={{ width: `${job.progress}%` }} />
            </div>
            <div className="mt-3 flex gap-2 flex-wrap">
              {STEPS.map((s) => (
                <span key={s} className={`text-xs flex items-center gap-1 ${STEPS.indexOf(s) <= STEPS.indexOf(job.status) ? 'text-indigo-500' : 'text-zinc-400'}`}>
                  {STEPS.indexOf(s) <= STEPS.indexOf(job.status) && <CheckCircle2 className="h-3 w-3" />}
                  {s}
                </span>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
