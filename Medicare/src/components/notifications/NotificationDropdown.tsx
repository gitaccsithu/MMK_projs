import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Badge from '@mui/material/Badge'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import NotificationsIcon from '@mui/icons-material/Notifications'
import { useAuthStore, useAppStore, getUnreadCount } from '@/store'
import { formatRelativeTime } from '@/utils/cn'
import * as api from '@/services/mockApi'

export function NotificationDropdown() {
  const { user } = useAuthStore()
  const { notifications, refreshNotifications } = useAppStore()
  const [open, setOpen] = useState(false)
  const unread = getUnreadCount(notifications)

  useEffect(() => {
    if (user) refreshNotifications(user.id)
  }, [user, refreshNotifications])

  return (
    <Box sx={{ position: 'relative' }}>
      <IconButton color="inherit" onClick={() => setOpen(!open)}>
        <Badge badgeContent={unread > 0 ? (unread > 9 ? '9+' : unread) : 0} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>
      {open && (
        <>
          <Box sx={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setOpen(false)} />
          <Paper
            elevation={8}
            sx={{
              position: 'absolute',
              right: 0,
              top: '100%',
              mt: 1,
              width: 320,
              zIndex: 50,
              overflow: 'hidden',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1.5 }}>
              <Typography variant="subtitle2" fontWeight={600}>Notifications</Typography>
              {unread > 0 && (
                <Button
                  size="small"
                  onClick={() => user && api.markAllNotificationsRead(user.id).then(() => refreshNotifications(user.id))}
                >
                  Mark all read
                </Button>
              )}
            </Box>
            <Divider />
            <Box sx={{ maxHeight: 320, overflow: 'auto' }}>
              {notifications.slice(0, 8).map((n) => (
                <Box
                  key={n.id}
                  onClick={() => api.markNotificationRead(n.id).then(() => user && refreshNotifications(user.id))}
                  sx={{
                    p: 1.5,
                    cursor: 'pointer',
                    borderBottom: 1,
                    borderColor: 'divider',
                    bgcolor: !n.read ? 'action.hover' : 'transparent',
                    '&:hover': { bgcolor: 'action.selected' },
                  }}
                >
                  <Typography variant="body2" fontWeight={500}>{n.title}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {n.message}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                    {formatRelativeTime(n.createdAt)}
                  </Typography>
                  {n.link && (
                    <Typography component={Link} to={n.link} variant="caption" color="primary" onClick={() => setOpen(false)}>
                      View →
                    </Typography>
                  )}
                </Box>
              ))}
            </Box>
          </Paper>
        </>
      )}
    </Box>
  )
}
