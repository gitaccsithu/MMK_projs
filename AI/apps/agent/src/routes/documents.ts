import { Router } from 'express'
import fs from 'node:fs/promises'
import path from 'node:path'
import { KNOWLEDGE_DIR } from '../rag/loadDocuments.js'

export const documentsRouter = Router()

documentsRouter.get('/:slug', async (req, res) => {
  const slug = req.params.slug.replace(/[^a-z0-9-]/gi, '')
  const filePath = path.join(KNOWLEDGE_DIR, `${slug}.md`)
  try {
    const content = await fs.readFile(filePath, 'utf-8')
    res.json({ slug, content })
  } catch {
    res.status(404).json({ error: 'Document not found' })
  }
})

documentsRouter.get('/', async (_req, res) => {
  try {
    const files = await fs.readdir(KNOWLEDGE_DIR)
    const slugs = files.filter((f) => f.endsWith('.md')).map((f) => f.replace(/\.md$/, ''))
    res.json({ documents: slugs })
  } catch {
    res.status(500).json({ error: 'Failed to list documents' })
  }
})
