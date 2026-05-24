import { Check } from 'lucide-react'
import type { BookingStatus, BookingTimelineEvent } from '@/types'
import { BOOKING_STATUS_ORDER, BOOKING_STATUS_LABELS } from '@/types'
import { cn } from '@/utils/cn'
import { formatDateTime } from '@/utils/cn'

interface BookingTimelineProps {
  currentStatus: BookingStatus
  timeline: BookingTimelineEvent[]
  animated?: boolean
}

export function BookingTimeline({ currentStatus, timeline, animated }: BookingTimelineProps) {
  const currentIdx = BOOKING_STATUS_ORDER.indexOf(currentStatus as (typeof BOOKING_STATUS_ORDER)[number])

  return (
    <div className="space-y-0">
      {BOOKING_STATUS_ORDER.map((status, idx) => {
        const event = timeline.find((t) => t.status === status)
        const isComplete = idx <= currentIdx
        const isCurrent = status === currentStatus
        const isCancelled = currentStatus === 'cancelled'

        return (
          <div key={status} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all duration-500',
                  isComplete && !isCancelled
                    ? 'border-primary bg-primary text-primary-foreground'
                    : isCancelled && idx === 0
                    ? 'border-destructive bg-destructive text-destructive-foreground'
                    : 'border-muted bg-background',
                  isCurrent && animated && 'ring-4 ring-primary/20 animate-pulse'
                )}
              >
                {isComplete && !isCancelled ? <Check className="h-4 w-4" /> : <span className="text-xs">{idx + 1}</span>}
              </div>
              {idx < BOOKING_STATUS_ORDER.length - 1 && (
                <div
                  className={cn(
                    'w-0.5 flex-1 min-h-[2rem] transition-colors duration-500',
                    idx < currentIdx && !isCancelled ? 'bg-primary' : 'bg-muted'
                  )}
                />
              )}
            </div>
            <div className="pb-6">
              <p className={cn('font-medium text-sm', isCurrent && 'text-primary')}>
                {BOOKING_STATUS_LABELS[status]}
              </p>
              {event && (
                <p className="text-xs text-muted-foreground mt-0.5">{formatDateTime(event.timestamp)}</p>
              )}
              {event?.message && (
                <p className="text-xs text-muted-foreground">{event.message}</p>
              )}
            </div>
          </div>
        )
      })}
      {currentStatus === 'cancelled' && (
        <div className="flex gap-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-destructive bg-destructive text-destructive-foreground">
            ✕
          </div>
          <div>
            <p className="font-medium text-sm text-destructive">Cancelled</p>
          </div>
        </div>
      )}
    </div>
  )
}
