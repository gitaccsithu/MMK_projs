import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Document } from '@langchain/core/documents'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const KNOWLEDGE_DIR = path.resolve(__dirname, '../../../../knowledge')

function slugFromFilename(filename: string): string {
  return filename.replace(/\.md$/i, '')
}

function titleFromContent(content: string, fallback: string): string {
  const match = content.match(/^#\s+(.+)$/m)
  return match?.[1]?.trim() ?? fallback
}

function parseMetadata(content: string): Record<string, string> {
  const meta: Record<string, string> = {}
  const dept = content.match(/\*\*Department:\*\*\s*(.+)/i)
  const tags = content.match(/\*\*Tags:\*\*\s*(.+)/i)
  if (dept) meta.department = dept[1].trim()
  if (tags) meta.tags = tags[1].trim()
  return meta
}

export async function loadKnowledgeDocuments(
  extraDocs?: Array<{ slug: string; title: string; content: string }>,
): Promise<Document[]> {
  const documents: Document[] = []

  try {
    const files = await fs.readdir(KNOWLEDGE_DIR)
    for (const file of files) {
      if (!file.endsWith('.md')) continue
      const fullPath = path.join(KNOWLEDGE_DIR, file)
      const content = await fs.readFile(fullPath, 'utf-8')
      const slug = slugFromFilename(file)
      const meta = parseMetadata(content)
      documents.push(
        new Document({
          pageContent: content,
          metadata: {
            slug,
            title: titleFromContent(content, slug),
            source: file,
            department: meta.department ?? 'General',
            tags: meta.tags ?? '',
          },
        }),
      )
    }
  } catch (err) {
    console.warn('[RAG] Knowledge directory read failed:', err)
  }

  for (const doc of extraDocs ?? []) {
    documents.push(
      new Document({
        pageContent: doc.content,
        metadata: {
          slug: doc.slug,
          title: doc.title,
          source: 'upload',
          department: 'Uploads',
          tags: 'uploaded',
        },
      }),
    )
  }

  return documents
}
