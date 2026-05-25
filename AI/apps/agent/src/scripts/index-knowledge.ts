import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') })

const { loadKnowledgeDocuments } = await import('../rag/loadDocuments.js')
const { buildIndex } = await import('../rag/vectorStore.js')

const docs = await loadKnowledgeDocuments()
console.log(`Indexing ${docs.length} documents...`)
const result = await buildIndex(docs)
console.log('Done:', result)
