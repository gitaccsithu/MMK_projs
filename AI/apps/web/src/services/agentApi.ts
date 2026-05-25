import type { ChatStreamEvent, HealthResponse, IngestResponse, ModelsResponse, SearchResponse, SummarizeResponse } from '@insightflow/shared'

const BASE = ''

export async function fetchHealth(): Promise<HealthResponse> {
  const res = await fetch(`${BASE}/health`)
  if (!res.ok) throw new Error('Agent unavailable')
  return res.json()
}

export async function fetchModels(): Promise<ModelsResponse> {
  const res = await fetch(`${BASE}/api/models`)
  return res.json()
}

export async function triggerIngest(rebuild = true): Promise<IngestResponse> {
  const res = await fetch(`${BASE}/api/ingest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rebuild }),
  })
  return res.json()
}

export async function searchKnowledge(query: string, limit = 8): Promise<SearchResponse> {
  const res = await fetch(`${BASE}/api/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, limit }),
  })
  if (!res.ok) throw new Error('Search failed')
  return res.json()
}

export async function summarizeDoc(slug: string, model?: string): Promise<SummarizeResponse> {
  const res = await fetch(`${BASE}/api/summarize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slug, model }),
  })
  if (!res.ok) throw new Error('Summarize failed')
  return res.json()
}

export async function* streamChat(body: {
  message: string
  conversationId?: string
  history?: Array<{ role: 'user' | 'assistant'; content: string }>
  model?: string
  settings?: { systemPrompt?: string; temperature?: number; maxTokens?: number }
}): AsyncGenerator<ChatStreamEvent> {
  const res = await fetch(`${BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok || !res.body) {
    yield { type: 'error', message: 'Chat request failed' }
    return
  }
  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const payload = line.slice(6).trim()
      if (payload === '[DONE]') return
      try {
        yield JSON.parse(payload) as ChatStreamEvent
      } catch {
        /* skip */
      }
    }
  }
}
