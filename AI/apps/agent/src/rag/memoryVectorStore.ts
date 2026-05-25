import { Document } from '@langchain/core/documents'
import type { EmbeddingsInterface } from '@langchain/core/embeddings'

interface StoredEntry {
  document: Document
  embedding: number[]
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0
  let normA = 0
  let normB = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB)
  return denom === 0 ? 0 : dot / denom
}

/** Lightweight in-memory vector store with cosine similarity search. */
export class InMemoryVectorStore {
  private entries: StoredEntry[] = []

  constructor(private embeddings: EmbeddingsInterface) {}

  async addDocuments(
    documents: Document[],
    options?: { embeddings?: number[][] },
  ): Promise<void> {
    const vectors =
      options?.embeddings ??
      (await this.embeddings.embedDocuments(documents.map((d) => d.pageContent)))
    for (let i = 0; i < documents.length; i++) {
      this.entries.push({ document: documents[i], embedding: vectors[i] })
    }
  }

  async similaritySearch(query: string, k: number): Promise<Document[]> {
    const queryVector = await this.embeddings.embedQuery(query)
    return this.entries
      .map((entry) => ({
        document: entry.document,
        score: cosineSimilarity(queryVector, entry.embedding),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, k)
      .map((item) => item.document)
  }

  clear(): void {
    this.entries = []
  }

  get size(): number {
    return this.entries.length
  }
}
