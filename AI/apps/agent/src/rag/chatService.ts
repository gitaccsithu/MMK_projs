import { Document } from '@langchain/core/documents'
import { HumanMessage, SystemMessage, AIMessage } from '@langchain/core/messages'
import type { Citation } from '@insightflow/shared'
import { createChatModel, defaultChatModel } from '../config/llm.js'
import { buildPromptWithContext, DEFAULT_SYSTEM_PROMPT } from '../config/systemPrompt.js'
import { ragTopK } from '../config/rag.js'
import { getVectorStore } from './vectorStore.js'

function formatContext(docs: Array<{ pageContent: string; metadata: Record<string, unknown> }>): string {
  return docs
    .map((doc, i) => {
      const slug = String(doc.metadata.slug ?? 'unknown')
      const title = String(doc.metadata.title ?? slug)
      return `### [${i + 1}] doc:${slug} — ${title}\n${doc.pageContent}`
    })
    .join('\n\n')
}

function docsToCitations(
  docs: Array<{ pageContent: string; metadata: Record<string, unknown> }>,
): Citation[] {
  const seen = new Set<string>()
  const citations: Citation[] = []
  for (const doc of docs) {
    const slug = String(doc.metadata.slug ?? 'unknown')
    if (seen.has(slug)) continue
    seen.add(slug)
    citations.push({
      docSlug: slug,
      docTitle: String(doc.metadata.title ?? slug),
      excerpt: doc.pageContent.slice(0, 280) + (doc.pageContent.length > 280 ? '…' : ''),
    })
  }
  return citations
}

export async function* streamRagChat(options: {
  message: string
  history?: Array<{ role: 'user' | 'assistant'; content: string }>
  model?: string
  temperature?: number
  maxTokens?: number
  systemPrompt?: string
}): AsyncGenerator<
  | { type: 'token'; content: string }
  | { type: 'citation'; citation: Citation }
  | { type: 'done'; citations: Citation[]; model: string }
  | { type: 'error'; message: string }
> {
  const store = getVectorStore()
  if (!store) {
    yield { type: 'error', message: 'Knowledge index is not loaded. Run ingestion first.' }
    return
  }

  const modelId = options.model ?? defaultChatModel()
  let retrieved: Array<{ pageContent: string; metadata: Record<string, unknown> }> = []

  try {
    const results = await store.similaritySearch(options.message, ragTopK())
    retrieved = results.map((d: Document) => ({
      pageContent: d.pageContent,
      metadata: d.metadata as Record<string, unknown>,
    }))
  } catch (err) {
    yield { type: 'error', message: err instanceof Error ? err.message : 'Retrieval failed' }
    return
  }

  const citations = docsToCitations(retrieved)
  for (const c of citations) {
    yield { type: 'citation', citation: c }
  }

  const historyBlock = (options.history ?? [])
    .slice(-6)
    .map((m) => `${m.role}: ${m.content}`)
    .join('\n')

  const systemContent = buildPromptWithContext(
    options.systemPrompt ?? DEFAULT_SYSTEM_PROMPT,
    formatContext(retrieved),
    historyBlock,
  )

  const messages = [
    new SystemMessage(systemContent),
    ...(options.history ?? []).slice(-6).map((m) =>
      m.role === 'user' ? new HumanMessage(m.content) : new AIMessage(m.content),
    ),
    new HumanMessage(options.message),
  ]

  try {
    const model = createChatModel({
      model: modelId,
      temperature: options.temperature,
      maxTokens: options.maxTokens,
    })
    const stream = await model.stream(messages)
    for await (const chunk of stream) {
      const text = typeof chunk.content === 'string' ? chunk.content : ''
      if (text) yield { type: 'token', content: text }
    }
    yield { type: 'done', citations, model: modelId }
  } catch (err) {
    yield { type: 'error', message: err instanceof Error ? err.message : 'Chat failed' }
  }
}

export async function semanticSearch(query: string, limit = 8) {
  const store = getVectorStore()
  if (!store) return []
  const results = await store.similaritySearch(query, limit)
  return results.map((doc: Document, i: number) => ({
    docSlug: String(doc.metadata.slug ?? ''),
    docTitle: String(doc.metadata.title ?? ''),
    excerpt: doc.pageContent.slice(0, 200),
    score: Math.max(0.5, 1 - i * 0.08),
    category: String(doc.metadata.department ?? 'General'),
  }))
}

export async function summarizeText(text: string, model?: string): Promise<string> {
  const modelInstance = createChatModel({ model, temperature: 0.2, maxTokens: 600 })
  const res = await modelInstance.invoke([
    new SystemMessage(
      'Summarize the following internal company document concisely in 3-5 bullet points. Use markdown.',
    ),
    new HumanMessage(text.slice(0, 12000)),
  ])
  return typeof res.content === 'string' ? res.content : String(res.content)
}
