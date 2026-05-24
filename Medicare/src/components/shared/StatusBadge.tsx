import Chip from '@mui/material/Chip'
import type { AppointmentStatus } from '@/types'
import { APPOINTMENT_STATUS_LABELS } from '@/types'

function statusColor(status: AppointmentStatus): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' {
  switch (status) {
    case 'confirmed':
    case 'completed':
      return 'success'
    case 'pending':
      return 'warning'
    case 'cancelled':
      return 'error'
    case 'waiting':
    case 'in_consultation':
      return 'info'
    default:
      return 'default'
  }
}

export function StatusBadge({ status }: { status: AppointmentStatus }) {
  return (
    <Chip
      label={APPOINTMENT_STATUS_LABELS[status]}
      color={statusColor(status)}
      size="small"
      variant="outlined"
    />
  )
}
