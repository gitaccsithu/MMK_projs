import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store'
import type { UserRole } from '@/types'
import { getRoleHome } from './routes'

export function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: UserRole[] }) {
  const { session } = useAuthStore()
  const location = useLocation()
  if (!session) return <Navigate to="/auth/login" state={{ from: location }} replace />
  if (allowedRoles && !allowedRoles.includes(session.role)) {
    return <Navigate to={getRoleHome(session.role)} replace />
  }
  return <>{children}</>
}
