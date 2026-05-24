import type { UserRole } from '@/types'
import {
  LayoutDashboard,
  Store,
  Calendar,
  User,
  Wallet,
  Settings,
  Bell,
  BarChart3,
  Users,
  Shield,
  Package,
  Tag,
  Kanban,
  HelpCircle,
  Gift,
  Activity,
  ClipboardList,
} from 'lucide-react'

export interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

export const customerNav: NavItem[] = [
  { title: 'Dashboard', href: '/customer', icon: LayoutDashboard },
  { title: 'Marketplace', href: '/customer/marketplace', icon: Store },
  { title: 'My Bookings', href: '/customer/bookings', icon: Calendar },
  { title: 'Wallet', href: '/customer/wallet', icon: Wallet },
  { title: 'Notifications', href: '/customer/notifications', icon: Bell },
  { title: 'Referrals', href: '/customer/referrals', icon: Gift },
  { title: 'Profile', href: '/customer/profile', icon: User },
  { title: 'Settings', href: '/customer/settings', icon: Settings },
]

export const vendorNav: NavItem[] = [
  { title: 'Dashboard', href: '/vendor', icon: LayoutDashboard },
  { title: 'Bookings', href: '/vendor/bookings', icon: Calendar },
  { title: 'Kanban', href: '/vendor/kanban', icon: Kanban },
  { title: 'Services', href: '/vendor/services', icon: Package },
  { title: 'Promotions', href: '/vendor/promotions', icon: Tag },
  { title: 'Analytics', href: '/vendor/analytics', icon: BarChart3 },
  { title: 'Onboarding', href: '/vendor/onboarding', icon: ClipboardList },
  { title: 'Profile', href: '/vendor/profile', icon: User },
  { title: 'Settings', href: '/vendor/settings', icon: Settings },
]

export const adminNav: NavItem[] = [
  { title: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { title: 'Verification', href: '/admin/verification', icon: Shield },
  { title: 'Users', href: '/admin/users', icon: Users },
  { title: 'Vendors', href: '/admin/vendors', icon: Store },
  { title: 'Categories', href: '/admin/categories', icon: Package },
  { title: 'Monitoring', href: '/admin/monitoring', icon: Activity },
  { title: 'Promotions', href: '/admin/promotions', icon: Tag },
  { title: 'Notifications', href: '/admin/notifications', icon: Bell },
  { title: 'Settings', href: '/admin/settings', icon: Settings },
]

export const publicNav: NavItem[] = [
  { title: 'Help Center', href: '/help', icon: HelpCircle },
  { title: 'FAQ', href: '/faq', icon: HelpCircle },
]

export function getNavForRole(role: UserRole): NavItem[] {
  switch (role) {
    case 'customer':
      return customerNav
    case 'vendor':
      return vendorNav
    case 'admin':
      return adminNav
    default:
      return []
  }
}

export function getRoleHome(role: UserRole): string {
  switch (role) {
    case 'customer':
      return '/customer'
    case 'vendor':
      return '/vendor'
    case 'admin':
      return '/admin'
    default:
      return '/login'
  }
}
