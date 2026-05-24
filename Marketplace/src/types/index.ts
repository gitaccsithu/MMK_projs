export type UserRole = 'customer' | 'vendor' | 'admin'

export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'vendor_assigned'
  | 'on_the_way'
  | 'in_progress'
  | 'completed'
  | 'cancelled'

export type VerificationStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'needs_info'

export type NotificationType =
  | 'booking'
  | 'payment'
  | 'message'
  | 'promotion'
  | 'verification'
  | 'system'

export type PaymentMethod = 'card' | 'wallet' | 'paypal' | 'grabpay' | 'apple_pay'
export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'refunded'

export interface Address {
  id: string
  label: string
  street: string
  city: string
  state: string
  zip: string
  lat: number
  lng: number
  isDefault?: boolean
}

export interface PaymentMethodInfo {
  id: string
  type: PaymentMethod
  label: string
  last4?: string
  expiry?: string
  isDefault?: boolean
}

export interface User {
  id: string
  email: string
  password: string
  role: UserRole
  name: string
  phone: string
  avatar?: string
  addresses: Address[]
  paymentMethods: PaymentMethodInfo[]
  favoriteVendorIds: string[]
  loyaltyPoints: number
  referralCode: string
  notificationPrefs: {
    email: boolean
    push: boolean
    sms: boolean
    promotions: boolean
  }
  createdAt: string
  updatedAt: string
}

export interface ServicePackage {
  id: string
  name: string
  description: string
  price: number
  duration: number
  features: string[]
}

export interface ServiceCategory {
  id: string
  name: string
  slug: string
  icon: string
  description: string
}

export interface Review {
  id: string
  userId: string
  userName: string
  userAvatar?: string
  serviceId: string
  vendorId: string
  rating: number
  comment: string
  createdAt: string
}

export interface Service {
  id: string
  vendorId: string
  categoryId: string
  title: string
  description: string
  images: string[]
  packages: ServicePackage[]
  rating: number
  reviewCount: number
  tags: string[]
  isActive: boolean
  availability: string[]
  location: { lat: number; lng: number; address: string }
  distance?: number
  popularity: number
  createdAt: string
}

export interface VendorDocument {
  id: string
  name: string
  type: string
  url: string
  uploadedAt: string
}

export interface VendorOnboarding {
  step: number
  businessName: string
  businessType: string
  registrationNumber: string
  categories: string[]
  documents: VendorDocument[]
  bankName: string
  bankAccount: string
  location: { lat: number; lng: number; address: string }
  serviceAreas: string[]
  submittedAt?: string
}

export interface Vendor {
  id: string
  userId: string
  businessName: string
  slug: string
  description: string
  logo?: string
  banner?: string
  verificationStatus: VerificationStatus
  adminNotes?: string
  rating: number
  reviewCount: number
  totalEarnings: number
  completedBookings: number
  categories: string[]
  coverageAreas: string[]
  location: { lat: number; lng: number; address: string }
  gallery: string[]
  certifications: string[]
  teamMembers: { id: string; name: string; role: string; avatar?: string }[]
  onboarding: VendorOnboarding
  isActive: boolean
  createdAt: string
}

export interface BookingTimelineEvent {
  id: string
  status: BookingStatus
  message: string
  timestamp: string
}

export interface Booking {
  id: string
  customerId: string
  vendorId: string
  serviceId: string
  packageId: string
  status: BookingStatus
  scheduledAt: string
  address: Address
  notes?: string
  amount: number
  paymentMethod: PaymentMethod
  paymentStatus: TransactionStatus
  timeline: BookingTimelineEvent[]
  eta?: number
  vendorLocation?: { lat: number; lng: number }
  createdAt: string
  updatedAt: string
}

export interface Notification {
  id: string
  userId: string
  type: NotificationType
  title: string
  message: string
  read: boolean
  link?: string
  createdAt: string
}

export interface Transaction {
  id: string
  userId: string
  bookingId?: string
  amount: number
  type: 'payment' | 'refund' | 'topup' | 'withdrawal'
  method: PaymentMethod
  status: TransactionStatus
  description: string
  invoiceId: string
  createdAt: string
}

export interface Promotion {
  id: string
  code: string
  title: string
  description: string
  discountType: 'percentage' | 'fixed'
  discountValue: number
  minAmount: number
  maxUses: number
  usedCount: number
  vendorId?: string
  expiresAt: string
  isActive: boolean
}

export interface ActivityLog {
  id: string
  userId?: string
  action: string
  entity: string
  entityId: string
  details: string
  createdAt: string
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system'
  language: 'en' | 'mm'
  maintenanceMode: boolean
  walletBalance: number
  /** Platform fee shown in admin configuration (percentage) */
  commissionPercent?: number
  /** Support SLA response hours (mock KPI) */
  supportSlaHours?: number
}

export interface AuthSession {
  userId: string
  email: string
  role: UserRole
  token: string
  expiresAt: string
  rememberMe: boolean
}

export interface AppData {
  users: User[]
  vendors: Vendor[]
  services: Service[]
  categories: ServiceCategory[]
  bookings: Booking[]
  notifications: Notification[]
  transactions: Transaction[]
  promotions: Promotion[]
  reviews: Review[]
  activityLogs: ActivityLog[]
  settings: AppSettings
  initialized: boolean
}

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  vendor_assigned: 'Vendor Assigned',
  on_the_way: 'On The Way',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

export const BOOKING_STATUS_ORDER: BookingStatus[] = [
  'pending',
  'confirmed',
  'vendor_assigned',
  'on_the_way',
  'in_progress',
  'completed',
]

export const SERVICE_CATEGORIES = [
  'Home Cleaning',
  'Plumbing',
  'Electrical Repair',
  'Air Conditioner Service',
  'Beauty & Spa',
  'Car Wash',
  'Food Catering',
  'Moving Service',
  'Photography',
  'Computer Repair',
] as const
