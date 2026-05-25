# InsightFlow Product Documentation

**Department:** Product  
**Tags:** product, features, rag

## Product overview

InsightFlow AI is an internal knowledge base and support assistant. Employees ask questions; the system retrieves answers from company documents using RAG (Retrieval-Augmented Generation).

## Key features

- **AI Chat:** Natural language Q&A with citations
- **Knowledge base:** Browse and search internal markdown/wiki content
- **Ingestion pipeline:** Upload documents → chunk → embed → index
- **Analytics:** Query volume, token usage, popular topics
- **Prompt management:** Configure system prompts and model settings (admin)

## Supported document types

- Markdown (primary)
- Plain text
- JSON metadata bundles
- PDF (preview UI; text extraction in enterprise tier)

## Models

Default chat model is configurable via admin settings. Supported providers include OpenRouter (GPT-4o mini, Claude, Llama, Gemini).

## Access roles

- **Member:** Chat, search, view knowledge
- **Admin:** Ingestion, analytics, prompts, monitoring

## Support

Internal users: #insightflow-support on Slack.
