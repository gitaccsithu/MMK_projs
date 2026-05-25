import { Router } from 'express'
import { z } from 'zod'
import { loadKnowledgeDocuments } from '../rag/loadDocuments.js'
import { buildIndex } from '../rag/vectorStore.js'

const schema = z.object({
  rebuild: z.boolean().optional(),
  documents: z
    .array(
      z.object({
        slug: z.string(),
        title: z.string(),
        content: z.string(),
      }),
    )
    .optional(),
})

export const ingestRouter = Router()

ingestRouter.post('/', async (req, res) => {
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() })
    return
  }
  try {
    const docs = await loadKnowledgeDocuments(parsed.data.documents)
    const { documentCount, chunkCount } = await buildIndex(docs)
    res.json({
      success: true,
      documentCount,
      chunkCount,
      message: `Indexed ${documentCount} documents (${chunkCount} chunks)`,
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      documentCount: 0,
      chunkCount: 0,
      message: err instanceof Error ? err.message : 'Ingest failed',
    })
  }
})
