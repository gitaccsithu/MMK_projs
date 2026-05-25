import { Link } from 'react-router-dom'
import { useChatStore } from '@/store'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export function HistoryPage() {
  const { conversations, deleteConversation, renameConversation } = useChatStore()

  function exportConv(id: string) {
    const msgs = useChatStore.getState().messages[id]
    const blob = new Blob([JSON.stringify(msgs, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `insightflow-${id}.json`
    a.click()
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Conversation History</h1>
      <div className="space-y-3">
        {conversations.map((c) => (
          <Card key={c.id} className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <Link to={`/app/chat`} onClick={() => useChatStore.getState().setActive(c.id)} className="font-semibold hover:text-indigo-500">
                {c.title}
              </Link>
              <p className="text-xs text-zinc-500">{c.messageCount} messages · {new Date(c.updatedAt).toLocaleString()}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => exportConv(c.id)}>Export</Button>
              <Button variant="ghost" size="sm" onClick={() => renameConversation(c.id, prompt('Rename chat', c.title) || c.title)}>Rename</Button>
              <Button variant="ghost" size="sm" onClick={() => deleteConversation(c.id)}>Delete</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
