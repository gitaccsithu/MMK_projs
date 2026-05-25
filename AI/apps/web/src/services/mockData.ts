import { faker } from '@faker-js/faker'
import type { AiLogEntry, AnalyticsSnapshot } from '@insightflow/shared'

export function buildAnalytics(): AnalyticsSnapshot {
  return {
    totalDocuments: 8,
    totalQueries: 1247,
    dailyQueries: 89,
    avgResponseMs: 1240,
    tokenUsageToday: 45200,
    popularTopics: [
      { topic: 'Remote work', count: 142 },
      { topic: 'Leave / PTO', count: 98 },
      { topic: 'Security policy', count: 76 },
      { topic: 'Deployment', count: 54 },
      { topic: 'Onboarding', count: 41 },
    ],
  }
}

export function buildUsageTrend() {
  return Array.from({ length: 14 }, (_, i) => ({
    day: faker.date.recent({ days: 14 - i }).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    queries: faker.number.int({ min: 40, max: 120 }),
    tokens: faker.number.int({ min: 8000, max: 25000 }),
  }))
}

export function buildAiLogs(): AiLogEntry[] {
  return Array.from({ length: 20 }, () => ({
    id: faker.string.uuid(),
    type: faker.helpers.arrayElement(['query', 'ingest', 'search', 'error'] as const),
    message: faker.lorem.sentence(),
    model: 'openai/gpt-4o-mini',
    latencyMs: faker.number.int({ min: 400, max: 3200 }),
    createdAt: faker.date.recent({ days: 3 }).toISOString(),
    status: faker.helpers.arrayElement(['success', 'error'] as const),
  }))
}

export const SUGGESTED_PROMPTS = [
  'What is our remote work policy?',
  'How do I request annual leave?',
  'Explain the security policy for MFA.',
  'What are the engineering deployment steps?',
  'Summarize the onboarding guide.',
]
