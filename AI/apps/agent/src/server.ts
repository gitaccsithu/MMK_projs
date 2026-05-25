import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'
import cors from 'cors'
import express from 'express'
import { defaultChatModel, defaultEmbeddingModel } from './config/llm.js'
import { optionalServiceKey } from './middleware/auth.js'
import { chatRouter } from './routes/chat.js'
import { searchRouter } from './routes/search.js'
import { ingestRouter } from './routes/ingest.js'
import { summarizeRouter } from './routes/summarize.js'
import { documentsRouter } from './routes/documents.js'
import { loadKnowledgeDocuments } from './rag/loadDocuments.js'
import { ensureIndexLoaded, getIndexStats } from './rag/vectorStore.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const envPaths = [
  path.resolve(__dirname, '../../../.env'),
  path.resolve(process.cwd(), '../../.env'),
  path.resolve(process.cwd(), '.env'),
]
for (const envPath of envPaths) {
  dotenv.config({ path: envPath })
}

const app = express()
const port = Number(process.env.AGENT_PORT ?? 8790)
const corsOrigin = process.env.AGENT_CORS_ORIGIN ?? 'http://localhost:5173'

app.use(cors({ origin: corsOrigin, credentials: true }))
app.use(express.json({ limit: '2mb' }))

app.get('/health', async (_req, res) => {
  let stats = getIndexStats()
  if (stats.chunkCount === 0) {
    try {
      await ensureIndexLoaded(() => loadKnowledgeDocuments())
      stats = getIndexStats()
    } catch (err) {
      console.warn('[Health] Index reload failed:', err instanceof Error ? err.message : err)
    }
  }
  res.json({
    status: 'ok',
    model: defaultChatModel(),
    embeddingModel: defaultEmbeddingModel(),
    indexLoaded: stats.chunkCount > 0,
    documentCount: stats.documentCount,
    chunkCount: stats.chunkCount,
    lastIndexedAt: stats.lastIndexedAt,
    apiKeyConfigured: Boolean(process.env.OPENROUTER_API_KEY?.trim()),
  })
})

app.get('/api/models', (_req, res) => {
  res.json({
    models: [
      { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenAI' },
      { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'Anthropic' },
      { id: 'meta-llama/llama-3.1-70b-instruct', name: 'Llama 3.1 70B', provider: 'Meta' },
      { id: 'google/gemini-2.0-flash-001', name: 'Gemini 2.0 Flash', provider: 'Google' },
    ],
  })
})

app.use('/api', optionalServiceKey)
app.use('/api/chat', chatRouter)
app.use('/api/search', searchRouter)
app.use('/api/ingest', ingestRouter)
app.use('/api/summarize', summarizeRouter)
app.use('/api/documents', documentsRouter)

async function start() {
  try {
    await ensureIndexLoaded(() => loadKnowledgeDocuments())
  } catch (err) {
    console.warn('[Agent] Index bootstrap skipped:', err instanceof Error ? err.message : err)
  }

  app.listen(port, () => {
    console.log(`[InsightFlow Agent] http://localhost:${port}`)
    console.log(`[InsightFlow Agent] Chat model: ${defaultChatModel()}`)
    const stats = getIndexStats()
    console.log(`[InsightFlow Agent] Index: ${stats.chunkCount} chunks, ${stats.documentCount} docs`)
  })
}

start()
