import { ChatOpenRouter } from '@langchain/openrouter'

export function openRouterBaseUrl(): string {
  return process.env.OPENROUTER_BASE_URL?.trim() || 'https://openrouter.ai/api/v1'
}

export function defaultChatModel(): string {
  return process.env.OPENROUTER_CHAT_MODEL?.trim() || 'openai/gpt-4o-mini'
}

export function defaultEmbeddingModel(): string {
  return process.env.OPENROUTER_EMBEDDING_MODEL?.trim() || 'openai/text-embedding-3-small'
}

export function createChatModel(options?: {
  model?: string
  temperature?: number
  maxTokens?: number
}): ChatOpenRouter {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not set')
  }
  return new ChatOpenRouter({
    apiKey,
    model: options?.model ?? defaultChatModel(),
    temperature: options?.temperature ?? 0.3,
    maxTokens: options?.maxTokens ?? 2000,
    baseURL: openRouterBaseUrl(),
  })
}
