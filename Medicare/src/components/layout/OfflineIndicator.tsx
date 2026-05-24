import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import WifiOffIcon from '@mui/icons-material/WifiOff'
import { useOnlineStatus } from '@/hooks/useDebounce'

export function OfflineIndicator() {
  const online = useOnlineStatus()
  if (online) return null
  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1,
        bgcolor: 'warning.main',
        color: 'warning.contrastText',
        py: 1,
      }}
    >
      <WifiOffIcon fontSize="small" />
      <Typography variant="body2" fontWeight={500}>You are offline.</Typography>
    </Box>
  )
}
