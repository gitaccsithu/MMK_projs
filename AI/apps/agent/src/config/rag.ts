export function ragTopK(): number {
  return Number(process.env.RAG_TOP_K ?? 5)
}

export function ragChunkSize(): number {
  return Number(process.env.RAG_CHUNK_SIZE ?? 800)
}

export function ragChunkOverlap(): number {
  return Number(process.env.RAG_CHUNK_OVERLAP ?? 120)
}
