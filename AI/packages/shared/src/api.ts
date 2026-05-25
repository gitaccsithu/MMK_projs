import type { ChatMessage, Citation, PromptSettings, SearchResult } from './types.js'

export interface ChatRequest {
  message: string
  conversationId?: string
  history?: Array<{ role: 'user' | 'assistant'; content: string }>
  model?: string
  settings?: Partial<PromptSettings>
}

export type ChatStreamEvent =
  | { type: 'token'; content: string }
  | { type: 'citation'; citation: Citation }
  | { type: 'done'; citations: Citation[]; model: string }
  | { type: 'error'; message: string }

export interface SearchRequest {
  query: string
  limit?: number
  department?: string
}

export interface SearchResponse {
  results: SearchResult[]
  query: string
}

export interface IngestRequest {
  rebuild?: boolean
  documents?: Array<{ slug: string; title: string; content: string }>
}

export interface IngestResponse {
  success: boolean
  documentCount: number
  chunkCount: number
  message: string
}

export interface SummarizeRequest {
  slug?: string
  text?: string
}

export interface SummarizeResponse {
  summary: string
  slug?: string
}

export interface HealthResponse {
  status: string
  model: string
  embeddingModel: string
  indexLoaded: boolean
  documentCount: number
  chunkCount: number
}

export interface ModelsResponse {
  models: Array<{ id: string; name: string; provider: string }>
}

export interface IndexStats {
  documentCount: number
  chunkCount: number
  lastIndexedAt?: string
}
