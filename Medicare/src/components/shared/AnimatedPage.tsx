import Box from '@mui/material/Box'
import type { ReactNode } from 'react'

export function AnimatedPage({ children }: { children: ReactNode }) {
  return <Box>{children}</Box>
}

export function AnimatedCard({ children, className }: { children: ReactNode; className?: string }) {
  return <Box className={className}>{children}</Box>
}

export function FadeIn({ children, className }: { children: ReactNode; className?: string }) {
  return <Box className={className}>{children}</Box>
}
