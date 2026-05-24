import type {
  AppData,
  User,
  Vendor,
  Service,
  Booking,
  Notification,
  Transaction,
  Promotion,
  ServiceCategory,
  ActivityLog,
  BookingStatus,
  VerificationStatus,
  AuthSession,
} from '@/types'
import { generateSeedData } from '@/data/seed'
import { storageService } from './storageService'
import { delay, generateId } from '@/utils/cn'

type ApiResult<T> = { data: T; error: null } | { data: null; error: string }

function getData(): AppData {
  let data = storageService.getAppData()
  if (!data?.initialized) {
    data = generateSeedData()
    storageService.setAppData(data)
  }
  return data!
}

function saveData(data: AppData) {
  storageService.setAppData(data)
}

export function initializeApp(): AppData {
  return getData()
}

export function resetDemoData(): AppData {
  const data = generateSeedData()
  storageService.setAppData(data)
  return data
}

export async function login(
  email: string,
  password: string,
  rememberMe = false
): Promise<ApiResult<AuthSession>> {
  await delay(600)
  const data = getData()
  const user = data.users.find((u) => u.email === email && u.password === password)
  if (!user) return { data: null, error: 'Invalid email or password' }
  const session: AuthSession = {
    userId: user.id,
    email: user.email,
    role: user.role,
    token: generateId('token'),
    expiresAt: new Date(Date.now() + 86400000 * 7).toISOString(),
    rememberMe,
  }
  storageService.setAuth(session)
  return { data: session, error: null }
}

export async function register(userData: Partial<User> & { email: string; password: string; name: string }): Promise<ApiResult<User>> {
  await delay(800)
  const data = getData()
  if (data.users.some((u) => u.email === userData.email)) {
    return { data: null, error: 'Email already registered' }
  }
  const user: User = {
    id: generateId('user'),
    email: userData.email,
    password: userData.password,
    role: userData.role ?? 'customer',
    name: userData.name,
    phone: userData.phone ?? '',
    addresses: [],
    paymentMethods: [],
    favoriteVendorIds: [],
    loyaltyPoints: 100,
    referralCode: generateId('ref').slice(-8).toUpperCase(),
    notificationPrefs: { email: true, push: true, sms: false, promotions: true },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  data.users.push(user)
  saveData(data)
  return { data: user, error: null }
}

export async function getUsers(): Promise<User[]> {
  await delay(300)
  return getData().users
}

export async function getUserById(id: string): Promise<User | undefined> {
  await delay(200)
  return getData().users.find((u) => u.id === id)
}

export async function updateUser(id: string, updates: Partial<User>): Promise<ApiResult<User>> {
  await delay(400)
  const data = getData()
  const idx = data.users.findIndex((u) => u.id === id)
  if (idx === -1) return { data: null, error: 'User not found' }
  data.users[idx] = { ...data.users[idx], ...updates, updatedAt: new Date().toISOString() }
  saveData(data)
  return { data: data.users[idx], error: null }
}

export async function deleteUser(id: string): Promise<ApiResult<boolean>> {
  await delay(450)
  const data = getData()
  if (!data.users.some((u) => u.id === id)) return { data: null, error: 'User not found' }
  data.users = data.users.filter((u) => u.id !== id)
  data.activityLogs.unshift({
    id: generateId('log'),
    action: 'user_deleted',
    entity: 'user',
    entityId: id,
    details: `User removed from platform`,
    createdAt: new Date().toISOString(),
  })
  saveData(data)
  return { data: true, error: null }
}

export async function createUser(payload: {
  email: string
  password: string
  name: string
  role: User['role']
  phone?: string
}): Promise<ApiResult<User>> {
  await delay(500)
  const data = getData()
  if (data.users.some((u) => u.email === payload.email)) {
    return { data: null, error: 'Email already registered' }
  }
  const user: User = {
    id: generateId('user'),
    email: payload.email.trim(),
    password: payload.password,
    role: payload.role,
    name: payload.name.trim(),
    phone: payload.phone?.trim() ?? '',
    addresses: [],
    paymentMethods: [],
    favoriteVendorIds: [],
    loyaltyPoints: 0,
    referralCode: generateId('ref').slice(-8).toUpperCase(),
    notificationPrefs: { email: true, push: true, sms: false, promotions: true },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  data.users.push(user)
  saveData(data)
  return { data: user, error: null }
}

export async function getVendors(): Promise<Vendor[]> {
  await delay(300)
  return getData().vendors
}

export async function getVendorById(id: string): Promise<Vendor | undefined> {
  await delay(200)
  return getData().vendors.find((v) => v.id === id)
}

export async function updateVendor(id: string, updates: Partial<Vendor>): Promise<ApiResult<Vendor>> {
  await delay(400)
  const data = getData()
  const idx = data.vendors.findIndex((v) => v.id === id)
  if (idx === -1) return { data: null, error: 'Vendor not found' }
  const prev = data.vendors[idx]
  const next = { ...prev, ...updates }
  if (updates.onboarding !== undefined) {
    const o = updates.onboarding
    next.onboarding = {
      ...prev.onboarding,
      ...o,
      location:
        o.location !== undefined ? { ...prev.onboarding.location, ...o.location } : prev.onboarding.location,
      documents: o.documents ?? prev.onboarding.documents,
    }
  }
  data.vendors[idx] = next
  saveData(data)
  return { data: data.vendors[idx], error: null }
}

export async function updateVendorVerification(
  id: string,
  status: VerificationStatus,
  adminNotes?: string
): Promise<ApiResult<Vendor>> {
  await delay(500)
  const data = getData()
  const idx = data.vendors.findIndex((v) => v.id === id)
  if (idx === -1) return { data: null, error: 'Vendor not found' }
  data.vendors[idx].verificationStatus = status
  data.vendors[idx].adminNotes = adminNotes
  data.vendors[idx].isActive = status === 'approved'
  data.activityLogs.unshift({
    id: generateId('log'),
    action: 'vendor_verification',
    entity: 'vendor',
    entityId: id,
    details: `Vendor verification ${status}`,
    createdAt: new Date().toISOString(),
  })
  saveData(data)
  return { data: data.vendors[idx], error: null }
}

export async function getServices(filters?: {
  categoryId?: string
  search?: string
  minPrice?: number
  maxPrice?: number
  minRating?: number
}): Promise<Service[]> {
  await delay(400)
  let services = getData().services.filter((s) => s.isActive)
  if (filters?.categoryId) services = services.filter((s) => s.categoryId === filters.categoryId)
  if (filters?.search) {
    const q = filters.search.toLowerCase()
    services = services.filter(
      (s) => s.title.toLowerCase().includes(q) || s.description.toLowerCase().includes(q)
    )
  }
  if (filters?.minPrice) services = services.filter((s) => s.packages[0].price >= filters.minPrice!)
  if (filters?.maxPrice) services = services.filter((s) => s.packages[0].price <= filters.maxPrice!)
  if (filters?.minRating) services = services.filter((s) => s.rating >= filters.minRating!)
  return services
}

export async function getServiceById(id: string): Promise<Service | undefined> {
  await delay(200)
  return getData().services.find((s) => s.id === id)
}

export async function getServicesForVendor(vendorId: string): Promise<Service[]> {
  await delay(250)
  return getData().services.filter((s) => s.vendorId === vendorId)
}

export async function createService(service: Omit<Service, 'id' | 'createdAt'>): Promise<ApiResult<Service>> {
  await delay(500)
  const data = getData()
  const newService: Service = {
    ...service,
    id: generateId('svc'),
    createdAt: new Date().toISOString(),
  }
  data.services.push(newService)
  saveData(data)
  return { data: newService, error: null }
}

export async function updateService(id: string, updates: Partial<Service>): Promise<ApiResult<Service>> {
  await delay(400)
  const data = getData()
  const idx = data.services.findIndex((s) => s.id === id)
  if (idx === -1) return { data: null, error: 'Service not found' }
  data.services[idx] = { ...data.services[idx], ...updates }
  saveData(data)
  return { data: data.services[idx], error: null }
}

export async function deleteService(id: string): Promise<ApiResult<boolean>> {
  await delay(400)
  const data = getData()
  data.services = data.services.filter((s) => s.id !== id)
  saveData(data)
  return { data: true, error: null }
}

export async function getBookings(userId?: string, role?: string): Promise<Booking[]> {
  await delay(400)
  const data = getData()
  if (!userId) return data.bookings
  if (role === 'customer') return data.bookings.filter((b) => b.customerId === userId)
  if (role === 'vendor') {
    const vendor = data.vendors.find((v) => v.userId === userId)
    if (!vendor) return []
    return data.bookings.filter((b) => b.vendorId === vendor.id)
  }
  return data.bookings
}

export async function getBookingById(id: string): Promise<Booking | undefined> {
  await delay(200)
  return getData().bookings.find((b) => b.id === id)
}

export async function createBooking(
  booking: Omit<Booking, 'id' | 'createdAt' | 'updatedAt' | 'timeline'>
): Promise<ApiResult<Booking>> {
  await delay(700)
  const data = getData()
  const newBooking: Booking = {
    ...booking,
    id: generateId('booking'),
    timeline: [
      {
        id: generateId('tl'),
        status: 'pending',
        message: 'Booking created and awaiting confirmation',
        timestamp: new Date().toISOString(),
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  data.bookings.unshift(newBooking)
  data.notifications.unshift({
    id: generateId('notif'),
    userId: booking.customerId,
    type: 'booking',
    title: 'Booking Created',
    message: `Your booking has been created successfully`,
    read: false,
    link: `/customer/bookings/${newBooking.id}`,
    createdAt: new Date().toISOString(),
  })
  data.activityLogs.unshift({
    id: generateId('log'),
    action: 'booking_created',
    entity: 'booking',
    entityId: newBooking.id,
    details: `New booking for $${booking.amount}`,
    createdAt: new Date().toISOString(),
  })
  saveData(data)
  return { data: newBooking, error: null }
}

export async function updateBookingStatus(
  id: string,
  status: BookingStatus,
  message?: string
): Promise<ApiResult<Booking>> {
  await delay(500)
  const data = getData()
  const idx = data.bookings.findIndex((b) => b.id === id)
  if (idx === -1) return { data: null, error: 'Booking not found' }
  const booking = data.bookings[idx]
  booking.status = status
  booking.updatedAt = new Date().toISOString()
  booking.timeline.push({
    id: generateId('tl'),
    status,
    message: message ?? `Status updated to ${status}`,
    timestamp: new Date().toISOString(),
  })
  if (status === 'on_the_way') {
    booking.eta = Math.floor(Math.random() * 30) + 5
    const vendor = data.vendors.find((v) => v.id === booking.vendorId)
    if (vendor) {
      booking.vendorLocation = {
        lat: vendor.location.lat + 0.005,
        lng: vendor.location.lng + 0.005,
      }
    }
  }
  data.notifications.unshift({
    id: generateId('notif'),
    userId: booking.customerId,
    type: 'booking',
    title: 'Booking Update',
    message: message ?? `Your booking status is now ${status}`,
    read: false,
    link: `/customer/bookings/${id}/track`,
    createdAt: new Date().toISOString(),
  })
  saveData(data)
  return { data: booking, error: null }
}

export async function cancelBooking(id: string): Promise<ApiResult<Booking>> {
  return updateBookingStatus(id, 'cancelled', 'Booking was cancelled')
}

export async function getNotifications(userId: string): Promise<Notification[]> {
  await delay(300)
  return getData()
    .notifications.filter((n) => n.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export async function markNotificationRead(id: string): Promise<void> {
  await delay(200)
  const data = getData()
  const notif = data.notifications.find((n) => n.id === id)
  if (notif) notif.read = true
  saveData(data)
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  await delay(300)
  const data = getData()
  data.notifications.filter((n) => n.userId === userId).forEach((n) => (n.read = true))
  saveData(data)
}

export async function getTransactions(userId: string): Promise<Transaction[]> {
  await delay(300)
  return getData().transactions.filter((t) => t.userId === userId)
}

export async function getAllTransactions(): Promise<Transaction[]> {
  await delay(250)
  return [...getData().transactions].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
}

export async function getCategories(): Promise<ServiceCategory[]> {
  await delay(200)
  return getData().categories
}

export async function createCategory(
  category: Omit<ServiceCategory, 'id'>
): Promise<ApiResult<ServiceCategory>> {
  await delay(400)
  const data = getData()
  const slug = category.slug.trim() || category.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  if (data.categories.some((c) => c.slug === slug)) {
    return { data: null, error: 'A category with this slug already exists' }
  }
  const created: ServiceCategory = {
    ...category,
    slug,
    id: generateId('cat'),
  }
  data.categories.push(created)
  saveData(data)
  return { data: created, error: null }
}

export async function updateCategory(
  id: string,
  updates: Partial<Omit<ServiceCategory, 'id'>>
): Promise<ApiResult<ServiceCategory>> {
  await delay(400)
  const data = getData()
  const idx = data.categories.findIndex((c) => c.id === id)
  if (idx === -1) return { data: null, error: 'Category not found' }
  const merged = { ...data.categories[idx], ...updates }
  if (updates.slug && data.categories.some((c) => c.id !== id && c.slug === merged.slug)) {
    return { data: null, error: 'Slug already in use' }
  }
  data.categories[idx] = merged
  saveData(data)
  return { data: data.categories[idx], error: null }
}

export async function deleteCategory(id: string): Promise<ApiResult<boolean>> {
  await delay(350)
  const data = getData()
  const inUse = data.services.some((s) => s.categoryId === id)
  if (inUse) {
    return { data: null, error: 'Category is referenced by active services — reassign services first.' }
  }
  if (!data.categories.some((c) => c.id === id)) return { data: null, error: 'Category not found' }
  data.categories = data.categories.filter((c) => c.id !== id)
  saveData(data)
  return { data: true, error: null }
}

export async function getPromotions(): Promise<Promotion[]> {
  await delay(300)
  return getData().promotions
}

export async function getPromotionsForVendor(vendorId: string): Promise<Promotion[]> {
  await delay(200)
  return getData().promotions.filter((p) => p.vendorId === vendorId)
}

export async function createPromotion(promotion: Omit<Promotion, 'id'>): Promise<ApiResult<Promotion>> {
  await delay(500)
  const data = getData()
  const codeUpper = promotion.code.trim().toUpperCase()
  if (data.promotions.some((p) => p.code === codeUpper)) {
    return { data: null, error: 'Promo code already exists' }
  }
  const created: Promotion = { ...promotion, id: generateId('promo'), code: codeUpper }
  data.promotions.push(created)
  saveData(data)
  return { data: created, error: null }
}

export async function updatePromotion(id: string, updates: Partial<Promotion>): Promise<ApiResult<Promotion>> {
  await delay(400)
  const data = getData()
  const idx = data.promotions.findIndex((p) => p.id === id)
  if (idx === -1) return { data: null, error: 'Promotion not found' }
  const nextCode = updates.code?.trim().toUpperCase()
  if (
    nextCode &&
    data.promotions.some((p) => p.id !== id && p.code === nextCode)
  ) {
    return { data: null, error: 'Promo code already in use' }
  }
  data.promotions[idx] = {
    ...data.promotions[idx],
    ...updates,
    ...(nextCode ? { code: nextCode } : {}),
  }
  saveData(data)
  return { data: data.promotions[idx], error: null }
}

export async function deletePromotion(id: string): Promise<ApiResult<boolean>> {
  await delay(300)
  const data = getData()
  if (!data.promotions.some((p) => p.id === id)) return { data: null, error: 'Promotion not found' }
  data.promotions = data.promotions.filter((p) => p.id !== id)
  saveData(data)
  return { data: true, error: null }
}

export async function getActivityLogs(): Promise<ActivityLog[]> {
  await delay(300)
  return getData().activityLogs
}

export async function getReviews(serviceId?: string) {
  await delay(300)
  const reviews = getData().reviews
  if (serviceId) return reviews.filter((r) => r.serviceId === serviceId)
  return reviews
}

export async function getAppSettings() {
  await delay(100)
  return getData().settings
}

export async function updateAppSettings(updates: Partial<AppData['settings']>) {
  await delay(300)
  const data = getData()
  data.settings = { ...data.settings, ...updates }
  saveData(data)
  return data.settings
}

export function getAppDataSync(): AppData {
  return getData()
}

export function saveAppDataSync(data: AppData) {
  saveData(data)
}
