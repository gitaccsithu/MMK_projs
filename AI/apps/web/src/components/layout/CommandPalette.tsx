import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SUGGESTED_PROMPTS } from '@/services/mockData'

const pages = [
  { label: 'Dashboard', path: '/app' },
  { label: 'AI Chat', path: '/app/chat' },
  { label: 'Knowledge Base', path: '/app/knowledge' },
  { label: 'Search', path: '/app/search' },
  { label: 'Ingestion', path: '/app/ingest' },
  { label: 'Analytics', path: '/app/analytics' },
  { label: 'Settings', path: '/app/settings' },
]

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState('')
  const navigate = useNavigate()

  if (!open) return null

  const items = [
    ...pages.filter((p) => p.label.toLowerCase().includes(q.toLowerCase())),
    ...SUGGESTED_PROMPTS.filter((p) => p.toLowerCase().includes(q.toLowerCase())).map((p) => ({
      label: p,
      path: `/app/chat?q=${encodeURIComponent(p)}`,
      prompt: true,
    })),
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 pt-[15vh] p-4" onClick={onClose}>
      <div className="glass w-full max-w-lg rounded-xl shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search pages or ask a question..."
          className="w-full border-b border-zinc-200 bg-transparent px-4 py-3 text-sm outline-none dark:border-zinc-800"
        />
        <ul className="max-h-72 overflow-y-auto p-2">
          {items.map((item) => (
            <li key={item.label}>
              <button
                type="button"
                className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
                onClick={() => {
                  navigate(item.path)
                  onClose()
                }}
              >
                {'prompt' in item && item.prompt ? '💬 ' : ''}{item.label}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
