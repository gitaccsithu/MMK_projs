# InsightFlow AI

Enterprise internal AI knowledge base and support assistant. Monorepo with React frontend and Node.js LangChain agent (OpenRouter + RAG).

## Quick start

```bash
cd AI
cp .env.example .env
# Add your OpenRouter API key to .env:
# OPENROUTER_API_KEY=sk-or-...

npm install
npm run dev
```

- **Web:** http://localhost:5173  
- **Agent:** http://localhost:8790  

### Demo login

| Role | Email |
|------|-------|
| Member | `alex@insightflow.example.com` |
| Admin | `admin@insightflow.example.com` |

## Architecture

```
apps/web     → React UI, LocalStorage, mock analytics
apps/agent   → Express + LangChain RAG + OpenRouter
knowledge/   → Seed markdown company documents
packages/shared → Shared TypeScript types
```

### Where is the vector data?

Vectors are **not** in `knowledge/` (that folder is plain markdown only).

| Path | Contents |
|------|----------|
| `knowledge/*.md` | Source documents (human-readable) |
| `apps/agent/storage/vector-index.json` | Chunk text + embedding arrays (~400KB JSON, **gitignored**) |

The agent loads that JSON into **memory** on startup. If you do not see `vector-index.json` in the IDE, enable viewing ignored files or open the path above in Finder — it is listed in `.gitignore` so Git (and some editors) hide it by default.

### RAG pipeline

1. Load markdown from `knowledge/`
2. Chunk with `RecursiveCharacterTextSplitter`
3. Embed via OpenAI-compatible API (OpenRouter)
4. Store in `MemoryVectorStore` + `apps/agent/storage/vector-index.json`
5. On chat: similarity search → inject context → stream LLM response with citations

## Troubleshooting

### `indexLoaded: false` or "Knowledge index is not loaded"

1. **Kill a stale agent** still bound to port 8790 (common after multiple `npm run dev` runs):
   ```bash
   lsof -i :8790
   kill <PID>
   npm run dev
   ```
2. Open http://localhost:8790/health — confirm `model` is `openai/gpt-oss-120b:free` (your `.env`) and `indexLoaded` is `true`.
3. If still false, run **Ingestion** in the app or `npm run index`, then restart the agent.
4. Ensure `OPENROUTER_API_KEY` is set in `AI/.env`.

**Free chat vs embeddings:** `OPENROUTER_CHAT_MODEL=openai/gpt-oss-120b:free` only affects chat replies. RAG indexing and search still use `OPENROUTER_EMBEDDING_MODEL` (`openai/text-embedding-3-small` by default), which uses OpenRouter credits — it is not a `:free` model.

## Environment variables

See [.env.example](.env.example). Required for live AI:

- `OPENROUTER_API_KEY` — from [openrouter.ai](https://openrouter.ai)

Optional:

- `OPENROUTER_CHAT_MODEL` (default: `openai/gpt-4o-mini`)
- `OPENROUTER_EMBEDDING_MODEL` (default: `openai/text-embedding-3-small`)
- `RAG_TOP_K`, `RAG_CHUNK_SIZE`, `RAG_CHUNK_OVERLAP`

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start web + agent concurrently |
| `npm run build` | Build all packages |
| `npm run index` | Rebuild vector index from CLI |

## API (agent)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health + index stats |
| POST | `/api/chat` | SSE streaming RAG chat |
| POST | `/api/search` | Semantic search |
| POST | `/api/ingest` | Rebuild vector index |
| POST | `/api/summarize` | Document summary |
| GET | `/api/documents/:slug` | Raw markdown content |

## Demo questions

See [questions.md](questions.md) for benchmark prompts (remote work, leave, security, deployment, etc.).

## Tech stack

- **Frontend:** React 19, Vite, Tailwind CSS 4, Zustand, Framer Motion, Recharts, React Markdown
- **Agent:** Node.js, Express, LangChain, `@langchain/openrouter`, in-memory vector store

## Reference

OpenRouter + LangChain patterns adapted from the EduGlobe CRM AI service (`ChatOpenRouter` factory, env-based model config). InsightFlow adds document RAG instead of SQL tooling.
