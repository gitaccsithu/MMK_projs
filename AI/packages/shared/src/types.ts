export type UserRole = 'member' | 'admin'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  department: string
  avatar?: string
}

export type MessageRole = 'user' | 'assistant' | 'system'

export interface ChatMessage {
  id: string
  role: MessageRole
  content: string
  createdAt: string
  citations?: Citation[]
  model?: string
  feedback?: 'up' | 'down'
}

export interface Citation {
  docSlug: string
  docTitle: string
  excerpt: string
  chunkId?: string
  score?: number
}

export interface Conversation {
  id: string
  title: string
  createdAt: string
  updatedAt: string
  pinned?: boolean
  favorite?: boolean
  model?: string
  messageCount: number
}

export interface DocumentMeta {
  id: string
  slug: string
  title: string
  category: string
  department: string
  tags: string[]
  type: 'markdown' | 'pdf' | 'txt' | 'json'
  sizeBytes: number
  updatedAt: string
  summary?: string
  favorite?: boolean
}

export type IngestionStep =
  | 'uploading'
  | 'parsing'
  | 'chunking'
  | 'embedding'
  | 'indexing'
  | 'completed'
  | 'failed'

export interface IngestionJob {
  id: string
  fileName: string
  status: IngestionStep
  progress: number
  logs: string[]
  startedAt: string
  completedAt?: string
  chunkCount?: number
}

export interface PromptSettings {
  systemPrompt: string
  temperature: number
  maxTokens: number
  topK: number
  model: string
}

export interface AnalyticsSnapshot {
  totalDocuments: number
  totalQueries: number
  dailyQueries: number
  avgResponseMs: number
  tokenUsageToday: number
  popularTopics: { topic: string; count: number }[]
}

export interface SearchResult {
  docSlug: string
  docTitle: string
  excerpt: string
  score: number
  category: string
}

export interface AiLogEntry {
  id: string
  type: 'query' | 'ingest' | 'error' | 'search'
  message: string
  model?: string
  latencyMs?: number
  createdAt: string
  status: 'success' | 'error'
}
