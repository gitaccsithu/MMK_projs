import type { Request, Response, NextFunction } from 'express'

export function optionalServiceKey(req: Request, res: Response, next: NextFunction) {
  const expected = process.env.AI_SERVICE_KEY?.trim()
  if (!expected) {
    next()
    return
  }
  const header = req.header('X-AI-Service-Key') ?? req.header('Authorization')?.replace(/^Bearer\s+/i, '')
  if (header !== expected) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }
  next()
}
