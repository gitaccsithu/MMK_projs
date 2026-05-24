import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import InboxIcon from '@mui/icons-material/Inbox'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: { label: string; onClick: () => void }
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8, px: 2, textAlign: 'center' }}>
      <Box sx={{ mb: 2, p: 2, borderRadius: '50%', bgcolor: 'grey.200', color: 'text.secondary' }}>
        {icon ?? <InboxIcon sx={{ fontSize: 32 }} />}
      </Box>
      <Typography variant="h6" fontWeight={500}>{title}</Typography>
      {description && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, maxWidth: 360 }}>
          {description}
        </Typography>
      )}
      {action && (
        <Button variant="contained" sx={{ mt: 2 }} onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </Box>
  )
}
