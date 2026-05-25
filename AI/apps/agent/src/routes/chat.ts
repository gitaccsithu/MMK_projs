import { Router } from 'express'
import { z } from 'zod'
import { streamRagChat } from '../rag/chatService.js'

const chatSchema = z.object({
  message: z.string().min(1),
  conversationId: z.string().optional(),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string(),
      }),
    )
    .optional(),
  model: z.string().optional(),
  settings: z
    .object({
      systemPrompt: z.string().optional(),
      temperature: z.number().optional(),
      maxTokens: z.number().optional(),
    })
    .optional(),
})

export const chatRouter = Router()

chatRouter.post('/', async (req, res) => {
  const parsed = chatSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() })
    return
  }

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders?.()

  const send = (data: object) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`)
  }

  try {
    for await (const event of streamRagChat({
      message: parsed.data.message,
      history: parsed.data.history,
      model: parsed.data.model,
      temperature: parsed.data.settings?.temperature,
      maxTokens: parsed.data.settings?.maxTokens,
      systemPrompt: parsed.data.settings?.systemPrompt,
    })) {
      send(event)
      if (event.type === 'done' || event.type === 'error') break
    }
  } catch (err) {
    send({ type: 'error', message: err instanceof Error ? err.message : 'Stream failed' })
  }
  res.write('data: [DONE]\n\n')
  res.end()
})
