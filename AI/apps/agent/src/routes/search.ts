import { Router } from 'express'
import { z } from 'zod'
import { semanticSearch } from '../rag/chatService.js'

const schema = z.object({
  query: z.string().min(1),
  limit: z.number().int().positive().max(20).optional(),
})

export const searchRouter = Router()

searchRouter.post('/', async (req, res) => {
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() })
    return
  }
  try {
    const results = await semanticSearch(parsed.data.query, parsed.data.limit ?? 8)
    res.json({ results, query: parsed.data.query })
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Search failed' })
  }
})
