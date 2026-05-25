import { cn } from '@/utils/cn'

export function Badge({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <span className={cn('inline-flex rounded-md bg-indigo-500/10 px-2 py-0.5 text-xs font-medium text-indigo-600 dark:text-indigo-400', className)}>
      {children}
    </span>
  )
}
