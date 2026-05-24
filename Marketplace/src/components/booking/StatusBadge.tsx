import type { BookingStatus } from '@/types'
import { BOOKING_STATUS_LABELS } from '@/types'
import { Badge } from '@/components/ui/badge'

const STATUS_VARIANT: Record<BookingStatus, 'default' | 'secondary' | 'success' | 'warning' | 'destructive'> = {
  pending: 'warning',
  confirmed: 'default',
  vendor_assigned: 'default',
  on_the_way: 'secondary',
  in_progress: 'secondary',
  completed: 'success',
  cancelled: 'destructive',
}

export function StatusBadge({ status }: { status: BookingStatus }) {
  return (
    <Badge variant={STATUS_VARIANT[status]}>
      {BOOKING_STATUS_LABELS[status]}
    </Badge>
  )
}
