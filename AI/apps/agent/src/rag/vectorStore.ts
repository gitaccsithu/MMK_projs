import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Document } from '@langchain/core/documents'
import { OpenAIEmbeddings } from '@langchain/openai'
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters'
import { defaultEmbeddingModel, openRouterBaseUrl } from '../config/llm.js'
import { ragChunkOverlap, ragChunkSize } from '../config/rag.js'
import { InMemoryVectorStore } from './memoryVectorStore.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const INDEX_PATH = path.resolve(__dirname, '../../storage/vector-index.json')

interface StoredChunk {
  pageContent: string
  metadata: Record<string, unknown>
  embedding: number[]
}

interface StoredIndex {
  chunks: StoredChunk[]
  documentCount: number
  indexedAt: string
}

let vectorStore: InMemoryVectorStore | null = null
let indexStats = { documentCount: 0, chunkCount: 0, lastIndexedAt: undefined as string | undefined }

export function getIndexStats() {
  return { ...indexStats }
}

export function getVectorStore(): InMemoryVectorStore | null {
  return vectorStore
}

export function createEmbeddings(): OpenAIEmbeddings {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) throw new Error('OPENROUTER_API_KEY is not set')
  return new OpenAIEmbeddings({
    apiKey,
    model: defaultEmbeddingModel(),
    configuration: { baseURL: openRouterBaseUrl() },
  })
}

async function saveIndex(chunks: StoredChunk[], documentCount: number) {
  await fs.mkdir(path.dirname(INDEX_PATH), { recursive: true })
  const payload: StoredIndex = {
    chunks,
    documentCount,
    indexedAt: new Date().toISOString(),
  }
  await fs.writeFile(INDEX_PATH, JSON.stringify(payload), 'utf-8')
  indexStats = {
    documentCount,
    chunkCount: chunks.length,
    lastIndexedAt: payload.indexedAt,
  }
}

async function loadIndexFromDisk(): Promise<boolean> {
  try {
    const raw = await fs.readFile(INDEX_PATH, 'utf-8')
    const data = JSON.parse(raw) as StoredIndex
    if (!data.chunks?.length) return false

    const embeddings = createEmbeddings()
    const docs = data.chunks.map(
      (c) =>
        new Document({
          pageContent: c.pageContent,
          metadata: c.metadata,
        }),
    )
    vectorStore = new InMemoryVectorStore(embeddings)
    await vectorStore.addDocuments(docs, { embeddings: data.chunks.map((c) => c.embedding) })
    indexStats = {
      documentCount: data.documentCount,
      chunkCount: data.chunks.length,
      lastIndexedAt: data.indexedAt,
    }
    console.log(`[RAG] Loaded index: ${data.chunks.length} chunks from ${data.documentCount} documents`)
    return true
  } catch (err) {
    console.warn(
      '[RAG] Failed to load index from disk:',
      err instanceof Error ? err.message : err,
    )
    return false
  }
}

export async function buildIndex(documents: Document[]): Promise<{ documentCount: number; chunkCount: number }> {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: ragChunkSize(),
    chunkOverlap: ragChunkOverlap(),
  })
  const splits = await splitter.splitDocuments(documents)
  const embeddings = createEmbeddings()
  const vectors = await embeddings.embedDocuments(splits.map((d) => d.pageContent))

  vectorStore = new InMemoryVectorStore(embeddings)
  await vectorStore.addDocuments(splits, { embeddings: vectors })

  const stored: StoredChunk[] = splits.map((doc, i) => ({
    pageContent: doc.pageContent,
    metadata: doc.metadata as Record<string, unknown>,
    embedding: vectors[i],
  }))

  const uniqueSlugs = new Set(splits.map((d) => String(d.metadata.slug ?? '')))
  await saveIndex(stored, uniqueSlugs.size)

  return { documentCount: uniqueSlugs.size, chunkCount: splits.length }
}

export async function ensureIndexLoaded(
  loader: () => Promise<Document[]>,
): Promise<void> {
  if (vectorStore) return
  const loaded = await loadIndexFromDisk()
  if (!loaded) {
    console.log('[RAG] No index on disk — building from knowledge/')
    const docs = await loader()
    if (docs.length > 0) {
      await buildIndex(docs)
    }
  }
}
