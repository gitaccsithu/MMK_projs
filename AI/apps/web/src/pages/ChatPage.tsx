import { useEffect, useRef, useState } from 'react'
import { useSearchParams, useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Send, Plus, Pin, Trash2, ThumbsUp, ThumbsDown, Loader2 } from 'lucide-react'
import { useChatStore, useSettingsStore } from '@/store'
import { streamChat } from '@/services/agentApi'
import { generateId } from '@/utils/cn'
import { Button } from '@/components/ui/Button'
import { MarkdownMessage } from '@/components/chat/MarkdownMessage'
import { SUGGESTED_PROMPTS } from '@/services/mockData'
import type { Citation } from '@insightflow/shared'

export function ChatPage() {
  const { id: routeConvId } = useParams()
  const [params] = useSearchParams()
  const [input, setInput] = useState(params.get('q') ?? '')
  const [streaming, setStreaming] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const {
    conversations, messages, activeId, createConversation, setActive,
    addMessage, updateMessage, renameConversation, deleteConversation, togglePin, hydrate,
  } = useChatStore()
  const { promptSettings, agentOnline } = useSettingsStore()

  useEffect(() => { hydrate() }, [hydrate])
  useEffect(() => {
    if (routeConvId && routeConvId !== activeId) setActive(routeConvId)
  }, [routeConvId, activeId, setActive])
  useEffect(() => {
    if (routeConvId) return
    if (!activeId && conversations.length === 0) createConversation('Welcome chat')
    else if (!activeId && conversations[0]) setActive(conversations[0].id)
  }, [routeConvId, activeId, conversations, createConversation, setActive])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, activeId, streaming])

  async function sendMessage(text: string) {
    const trimmed = text.trim()
    if (!trimmed || streaming) return
    let convId = activeId
    if (!convId) convId = createConversation(trimmed.slice(0, 40))
    const userMsg = { id: generateId('msg'), role: 'user' as const, content: trimmed, createdAt: new Date().toISOString() }
    addMessage(convId, userMsg)
    setInput('')
    setStreaming(true)
    const assistantId = generateId('msg')
    addMessage(convId, { id: assistantId, role: 'assistant', content: '', createdAt: new Date().toISOString() })
    const history = (messages[convId] ?? []).filter((m) => m.id !== assistantId).map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }))
    const citations: Citation[] = []
    try {
      for await (const event of streamChat({
        message: trimmed,
        conversationId: convId,
        history,
        model: promptSettings.model,
        settings: {
          systemPrompt: promptSettings.systemPrompt,
          temperature: promptSettings.temperature,
          maxTokens: promptSettings.maxTokens,
        },
      })) {
        if (event.type === 'token') {
          const current = useChatStore.getState().messages[convId]?.find((m) => m.id === assistantId)
          updateMessage(convId, assistantId, { content: (current?.content ?? '') + event.content })
        }
        if (event.type === 'citation') citations.push(event.citation)
        if (event.type === 'error') {
          updateMessage(convId, assistantId, { content: `Error: ${event.message}` })
        }
        if (event.type === 'done') {
          updateMessage(convId, assistantId, { citations: event.citations, model: event.model })
        }
      }
      if (citations.length) updateMessage(convId, assistantId, { citations })
    } catch (err) {
      updateMessage(convId, assistantId, {
        content: agentOnline
          ? `Failed to reach agent: ${err instanceof Error ? err.message : 'unknown'}`
          : 'AI agent is offline. Start it with `npm run dev` from the AI monorepo root and set OPENROUTER_API_KEY.',
      })
    }
    setStreaming(false)
    if (conversations.find((c) => c.id === convId)?.title === 'New chat' || conversations.find((c) => c.id === convId)?.title === 'Welcome chat') {
      renameConversation(convId, trimmed.slice(0, 48))
    }
  }

  const activeMessages = activeId ? messages[activeId] ?? [] : []

  return (
    <div className="flex h-[calc(100vh-7rem)] gap-4">
      <aside className="hidden w-64 shrink-0 flex-col rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 md:flex">
        <div className="flex items-center justify-between border-b border-zinc-200 p-3 dark:border-zinc-800">
          <span className="text-sm font-medium">Chats</span>
          <Button variant="ghost" size="sm" onClick={() => createConversation()}><Plus className="h-4 w-4" /></Button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {[...conversations].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0)).map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setActive(c.id)}
              className={`group flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm ${activeId === c.id ? 'bg-indigo-500/10 text-indigo-600' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
            >
              <span className="flex-1 truncate">{c.title}</span>
              <button type="button" className="opacity-0 group-hover:opacity-100" title="Pin" onClick={(e) => { e.stopPropagation(); togglePin(c.id) }}>
                <Pin className={`h-3 w-3 ${c.pinned ? 'text-indigo-500 opacity-100' : ''}`} />
              </button>
              <button type="button" className="opacity-0 group-hover:opacity-100" onClick={(e) => { e.stopPropagation(); deleteConversation(c.id) }}>
                <Trash2 className="h-3 w-3" />
              </button>
            </button>
          ))}
        </div>
      </aside>

      <div className="flex flex-1 flex-col rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {activeMessages.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-zinc-500">Ask anything about company policies and docs.</p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {SUGGESTED_PROMPTS.slice(0, 4).map((p) => (
                  <button key={p} type="button" onClick={() => sendMessage(p)} className="rounded-full border border-zinc-200 px-3 py-1 text-xs hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800">
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}
          {activeMessages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${m.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-zinc-100 dark:bg-zinc-800'}`}>
                {m.role === 'assistant' ? <MarkdownMessage content={m.content || (streaming ? '…' : '')} /> : <p className="text-sm whitespace-pre-wrap">{m.content}</p>}
                {m.citations && m.citations.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {m.citations.map((c) => (
                      <Link key={c.docSlug} to={`/app/knowledge/${c.docSlug}`} className="rounded bg-indigo-500/20 px-2 py-0.5 text-xs text-indigo-300">
                        {c.docTitle}
                      </Link>
                    ))}
                  </div>
                )}
                {m.role === 'assistant' && m.content && (
                  <div className="mt-2 flex gap-1">
                    <button type="button" onClick={() => updateMessage(activeId!, m.id, { feedback: 'up' })}><ThumbsUp className="h-3 w-3 opacity-50" /></button>
                    <button type="button" onClick={() => updateMessage(activeId!, m.id, { feedback: 'down' })}><ThumbsDown className="h-3 w-3 opacity-50" /></button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
          {streaming && <div className="flex items-center gap-2 text-sm text-zinc-500"><Loader2 className="h-4 w-4 animate-spin" /> Thinking…</div>}
          <div ref={bottomRef} />
        </div>
        <form
          onSubmit={(e) => { e.preventDefault(); sendMessage(input) }}
          className="border-t border-zinc-200 p-4 dark:border-zinc-800"
        >
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask InsightFlow…"
              className="flex-1 rounded-xl border border-zinc-300 bg-transparent px-4 py-3 text-sm outline-none focus:border-indigo-500 dark:border-zinc-700"
              disabled={streaming}
            />
            <Button type="submit" disabled={streaming || !input.trim()}><Send className="h-4 w-4" /></Button>
          </div>
        </form>
      </div>
    </div>
  )
}
