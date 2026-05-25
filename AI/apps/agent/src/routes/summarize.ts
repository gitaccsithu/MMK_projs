import { Router } from 'express'
import { z } from 'zod'
import fs from 'node:fs/promises'
import path from 'node:path'
import { KNOWLEDGE_DIR } from '../rag/loadDocuments.js'
import { summarizeText } from '../rag/chatService.js'

const schema = z.object({
  slug: z.string().optional(),
  text: z.string().optional(),
  model: z.string().optional(),
})

export const summarizeRouter = Router()

summarizeRouter.post('/', async (req, res) => {
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() })
    return
  }
  let text = parsed.data.text ?? ''
  if (parsed.data.slug) {
    const filePath = path.join(KNOWLEDGE_DIR, `${parsed.data.slug}.md`)
    text = await fs.readFile(filePath, 'utf-8')
  }
  if (!text.trim()) {
    res.status(400).json({ error: 'Provide slug or text' })
    return
  }
  try {
    const summary = await summarizeText(text, parsed.data.model)
    res.json({ summary, slug: parsed.data.slug })
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Summarize failed' })
  }
})
