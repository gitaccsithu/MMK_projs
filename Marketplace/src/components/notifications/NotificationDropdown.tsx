import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useAppStore, getUnreadCount } from '@/store/appStore'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
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

  useEffect(() => {
    const interval = setInterval(() => {
      if (user) refreshNotifications(user.id)
    }, 10000)
    return () => clearInterval(interval)
  }, [user, refreshNotifications])

  const handleMarkRead = async (id: string) => {
    await api.markNotificationRead(id)
    if (user) refreshNotifications(user.id)
  }

  const handleMarkAllRead = async () => {
    if (!user) return
    await api.markAllNotificationsRead(user.id)
    refreshNotifications(user.id)
  }

  return (
    <div className="relative">
      <Button variant="ghost" size="icon" className="relative" onClick={() => setOpen(!open)}>
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground animate-pulse">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </Button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-xl border bg-popover shadow-lg">
            <div className="flex items-center justify-between border-b p-3">
              <h3 className="font-semibold">Notifications</h3>
              {unread > 0 && (
                <Button variant="ghost" size="sm" onClick={handleMarkAllRead}>
                  Mark all read
                </Button>
              )}
            </div>
            <ScrollArea className="max-h-80">
              {notifications.length === 0 ? (
                <p className="p-4 text-center text-sm text-muted-foreground">No notifications</p>
              ) : (
                notifications.slice(0, 8).map((n) => (
                  <div
                    key={n.id}
                    className={`border-b p-3 text-sm cursor-pointer hover:bg-accent ${!n.read ? 'bg-primary/5' : ''}`}
                    onClick={() => handleMarkRead(n.id)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium">{n.title}</p>
                      {!n.read && <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1" />}
                    </div>
                    <p className="text-muted-foreground line-clamp-2">{n.message}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{formatRelativeTime(n.createdAt)}</p>
                    {n.link && (
                      <Link to={n.link} className="text-xs text-primary hover:underline" onClick={() => setOpen(false)}>
                        View details →
                      </Link>
                    )}
                  </div>
                ))
              )}
            </ScrollArea>
          </div>
        </>
      )}
    </div>
  )
}
