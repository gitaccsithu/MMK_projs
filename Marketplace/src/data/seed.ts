import { faker } from '@faker-js/faker'
import type {
  ServiceCategory,
  User,
  Vendor,
  Service,
  Booking,
  Notification,
  Transaction,
  Review,
  Promotion,
  ActivityLog,
  AppData,
  BookingStatus,
  Address,
} from '@/types'
import { DEMO_ACCOUNTS } from './demoAccounts'
import { generateId } from '@/utils/cn'

const CATEGORY_ICONS: Record<string, string> = {
  'Home Cleaning': '🧹',
  Plumbing: '🔧',
  'Electrical Repair': '⚡',
  'Air Conditioner Service': '❄️',
  'Beauty & Spa': '💅',
  'Car Wash': '🚗',
  'Food Catering': '🍽️',
  'Moving Service': '📦',
  Photography: '📷',
  'Computer Repair': '💻',
}

const SERVICE_IMAGES = [
  'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800',
  'https://images.unsplash.com/photo-1628177142896-93e36e4e3a50?w=800',
  'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800',
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
  'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=800',
  'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=800',
  'https://images.unsplash.com/photo-1517245386807-bb43d82acdcc?w=800',
  'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800',
]

function createAddress(): Address {
  return {
    id: generateId('addr'),
    label: faker.helpers.arrayElement(['Home', 'Office', 'Other']),
    street: faker.location.streetAddress(),
    city: faker.location.city(),
    state: faker.location.state({ abbreviated: true }),
    zip: faker.location.zipCode(),
    lat: faker.location.latitude({ min: 1.2, max: 1.5 }),
    lng: faker.location.longitude({ min: 103.6, max: 104.0 }),
  }
}

export function generateCategories(): ServiceCategory[] {
  return Object.entries(CATEGORY_ICONS).map(([name, icon], i) => ({
    id: `cat_${i + 1}`,
    name,
    slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    icon,
    description: `Professional ${name.toLowerCase()} services near you`,
  }))
}

export function generateUsers(): User[] {
  const demoUsers: User[] = DEMO_ACCOUNTS.map((demo, i) => ({
    id: `user_demo_${i + 1}`,
    email: demo.email,
    password: demo.password,
    role: demo.role,
    name: demo.name,
    phone: faker.phone.number(),
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${demo.email}`,
    addresses: [createAddress()],
    paymentMethods: [
      {
        id: generateId('pm'),
        type: 'card',
        label: 'Visa ending 4242',
        last4: '4242',
        expiry: '12/28',
        isDefault: true,
      },
    ],
    favoriteVendorIds: [],
    loyaltyPoints: faker.number.int({ min: 100, max: 5000 }),
    referralCode: faker.string.alphanumeric(8).toUpperCase(),
    notificationPrefs: {
      email: true,
      push: true,
      sms: false,
      promotions: true,
    },
    createdAt: faker.date.past({ years: 1 }).toISOString(),
    updatedAt: new Date().toISOString(),
  }))

  const extraCustomers: User[] = Array.from({ length: 15 }, (_, i) => ({
    id: `user_cust_${i + 1}`,
    email: faker.internet.email(),
    password: 'password123',
    role: 'customer' as const,
    name: faker.person.fullName(),
    phone: faker.phone.number(),
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=cust${i}`,
    addresses: [createAddress()],
    paymentMethods: [],
    favoriteVendorIds: [],
    loyaltyPoints: faker.number.int({ min: 0, max: 2000 }),
    referralCode: faker.string.alphanumeric(8).toUpperCase(),
    notificationPrefs: { email: true, push: true, sms: false, promotions: false },
    createdAt: faker.date.past({ years: 1 }).toISOString(),
    updatedAt: new Date().toISOString(),
  }))

  return [...demoUsers, ...extraCustomers]
}

export function generateVendors(users: User[], categories: ServiceCategory[]): Vendor[] {
  const vendorUsers = users.filter((u) => u.role === 'vendor')
  const vendors: Vendor[] = []

  // Demo vendor
  if (vendorUsers[0]) {
    vendors.push({
      id: 'vendor_demo_1',
      userId: vendorUsers[0].id,
      businessName: 'SparkClean Pro Services',
      slug: 'sparkclean-pro',
      description: 'Premium home and office cleaning services with eco-friendly products.',
      logo: 'https://api.dicebear.com/7.x/initials/svg?seed=SC',
      banner: SERVICE_IMAGES[0],
      verificationStatus: 'approved',
      rating: 4.8,
      reviewCount: 234,
      totalEarnings: 45600,
      completedBookings: 312,
      categories: ['cat_1', 'cat_2'],
      coverageAreas: ['Downtown', 'Marina Bay', 'Orchard'],
      location: { lat: 1.3521, lng: 103.8198, address: '123 Orchard Road, Singapore' },
      gallery: SERVICE_IMAGES.slice(0, 4),
      certifications: ['ISO 9001', 'Green Clean Certified'],
      teamMembers: [
        { id: 'tm_1', name: 'Sarah Chen', role: 'Owner', avatar: vendorUsers[0].avatar },
        { id: 'tm_2', name: 'John Doe', role: 'Technician' },
      ],
      onboarding: {
        step: 8,
        businessName: 'SparkClean Pro Services',
        businessType: 'LLC',
        registrationNumber: 'REG-2024-001',
        categories: ['cat_1'],
        documents: [],
        bankName: 'DBS Bank',
        bankAccount: '****5678',
        location: { lat: 1.3521, lng: 103.8198, address: '123 Orchard Road' },
        serviceAreas: ['Downtown', 'Marina Bay'],
        submittedAt: faker.date.past({ years: 1 }).toISOString(),
      },
      isActive: true,
      createdAt: faker.date.past({ years: 1 }).toISOString(),
    })
  }

  // Generate 19 more vendors
  for (let i = 0; i < 19; i++) {
    const cat = faker.helpers.arrayElement(categories)
    const status = faker.helpers.arrayElement([
      'approved',
      'approved',
      'approved',
      'pending',
      'needs_info',
    ] as const)
    vendors.push({
      id: `vendor_${i + 2}`,
      userId: `user_vendor_${i + 2}`,
      businessName: faker.company.name() + ' Services',
      slug: faker.helpers.slugify(faker.company.name()).toLowerCase(),
      description: faker.company.catchPhrase(),
      logo: `https://api.dicebear.com/7.x/initials/svg?seed=v${i}`,
      banner: faker.helpers.arrayElement(SERVICE_IMAGES),
      verificationStatus: status,
      adminNotes: status === 'needs_info' ? 'Please resubmit business license' : undefined,
      rating: faker.number.float({ min: 3.5, max: 5, fractionDigits: 1 }),
      reviewCount: faker.number.int({ min: 5, max: 500 }),
      totalEarnings: faker.number.int({ min: 1000, max: 100000 }),
      completedBookings: faker.number.int({ min: 10, max: 500 }),
      categories: [cat.id],
      coverageAreas: faker.helpers.arrayElements(
        ['Downtown', 'Marina Bay', 'Orchard', 'Jurong', 'Tampines', 'Woodlands'],
        { min: 1, max: 3 }
      ),
      location: {
        lat: faker.location.latitude({ min: 1.2, max: 1.5 }),
        lng: faker.location.longitude({ min: 103.6, max: 104.0 }),
        address: faker.location.streetAddress(),
      },
      gallery: faker.helpers.arrayElements(SERVICE_IMAGES, { min: 2, max: 4 }),
      certifications: faker.helpers.arrayElements(
        ['Licensed', 'Insured', 'Certified Pro', 'Background Checked'],
        { min: 0, max: 2 }
      ),
      teamMembers: Array.from({ length: faker.number.int({ min: 1, max: 3 }) }, (_, j) => ({
        id: `tm_v${i}_${j}`,
        name: faker.person.fullName(),
        role: faker.helpers.arrayElement(['Owner', 'Technician', 'Manager']),
      })),
      onboarding: {
        step: status === 'approved' ? 8 : faker.number.int({ min: 1, max: 7 }),
        businessName: faker.company.name(),
        businessType: 'LLC',
        registrationNumber: faker.string.alphanumeric(10).toUpperCase(),
        categories: [cat.id],
        documents: [],
        bankName: faker.company.name() + ' Bank',
        bankAccount: '****' + faker.string.numeric(4),
        location: {
          lat: faker.location.latitude({ min: 1.2, max: 1.5 }),
          lng: faker.location.longitude({ min: 103.6, max: 104.0 }),
          address: faker.location.streetAddress(),
        },
        serviceAreas: ['Downtown'],
      },
      isActive: status === 'approved',
      createdAt: faker.date.past({ years: 1 }).toISOString(),
    })
  }

  return vendors
}

export function generateServices(vendors: Vendor[], categories: ServiceCategory[]): Service[] {
  const services: Service[] = []
  let count = 0

  for (const vendor of vendors) {
    const numServices = faker.number.int({ min: 3, max: 8 })
    for (let i = 0; i < numServices && count < 100; i++) {
      const catId = faker.helpers.arrayElement(vendor.categories)
      const cat = categories.find((c) => c.id === catId) ?? categories[0]
      const basePrice = faker.number.int({ min: 30, max: 500 })
      services.push({
        id: `svc_${++count}`,
        vendorId: vendor.id,
        categoryId: cat.id,
        title: `${cat.name} - ${faker.commerce.productAdjective()} ${faker.helpers.arrayElement(['Basic', 'Premium', 'Express', 'Standard'])}`,
        description: faker.lorem.paragraphs(2),
        images: faker.helpers.arrayElements(SERVICE_IMAGES, { min: 1, max: 3 }),
        packages: [
          {
            id: generateId('pkg'),
            name: 'Basic',
            description: 'Essential service package',
            price: basePrice,
            duration: 60,
            features: ['Standard service', 'Basic equipment', '1-hour session'],
          },
          {
            id: generateId('pkg'),
            name: 'Premium',
            description: 'Enhanced service with extras',
            price: Math.round(basePrice * 1.5),
            duration: 120,
            features: ['Premium service', 'Advanced equipment', '2-hour session', 'Priority support'],
          },
        ],
        rating: faker.number.float({ min: 3.5, max: 5, fractionDigits: 1 }),
        reviewCount: faker.number.int({ min: 0, max: 200 }),
        tags: faker.helpers.arrayElements(['popular', 'fast', 'eco-friendly', '24/7', 'insured'], {
          min: 1,
          max: 3,
        }),
        isActive: vendor.isActive,
        availability: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        location: vendor.location,
        distance: faker.number.float({ min: 0.5, max: 15, fractionDigits: 1 }),
        popularity: faker.number.int({ min: 1, max: 100 }),
        createdAt: faker.date.past({ years: 1 }).toISOString(),
      })
    }
  }

  // Ensure at least 100 services
  while (services.length < 100) {
    const vendor = faker.helpers.arrayElement(vendors)
    const cat = faker.helpers.arrayElement(categories)
    const basePrice = faker.number.int({ min: 30, max: 500 })
    services.push({
      id: `svc_${services.length + 1}`,
      vendorId: vendor.id,
      categoryId: cat.id,
      title: `${cat.name} Service ${services.length + 1}`,
      description: faker.lorem.paragraph(),
      images: [faker.helpers.arrayElement(SERVICE_IMAGES)],
      packages: [
        {
          id: generateId('pkg'),
          name: 'Standard',
          description: 'Standard package',
          price: basePrice,
          duration: 60,
          features: ['Standard service'],
        },
      ],
      rating: 4.5,
      reviewCount: 10,
      tags: ['popular'],
      isActive: true,
      availability: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      location: vendor.location,
      distance: 2.5,
      popularity: 50,
      createdAt: faker.date.past({ years: 1 }).toISOString(),
    })
  }

  return services
}

export function generateBookings(
  users: User[],
  vendors: Vendor[],
  services: Service[]
): Booking[] {
  const customers = users.filter((u) => u.role === 'customer')
  const statuses: BookingStatus[] = [
    'pending',
    'confirmed',
    'vendor_assigned',
    'on_the_way',
    'in_progress',
    'completed',
    'cancelled',
  ]

  return Array.from({ length: 50 }, (_, i) => {
    const customer = faker.helpers.arrayElement(customers)
    const service = faker.helpers.arrayElement(services)
    const vendor = vendors.find((v) => v.id === service.vendorId)!
    const pkg = faker.helpers.arrayElement(service.packages)
    const status = faker.helpers.arrayElement(statuses)
    const scheduledAt = faker.date.soon({ days: 14 })
    const createdAt = faker.date.recent({ days: 30 })

    const statusIndex = statuses.indexOf(status)
    const timeline = statuses.slice(0, statusIndex + 1).map((s, idx) => ({
      id: generateId('tl'),
      status: s,
      message: `Booking ${BOOKING_STATUS_MSG[s]}`,
      timestamp: new Date(
        createdAt.getTime() + idx * 3600000
      ).toISOString(),
    }))

    return {
      id: `booking_${i + 1}`,
      customerId: customer.id,
      vendorId: vendor.id,
      serviceId: service.id,
      packageId: pkg.id,
      status,
      scheduledAt: scheduledAt.toISOString(),
      address: customer.addresses[0] ?? createAddress(),
      notes: faker.helpers.maybe(() => faker.lorem.sentence(), { probability: 0.4 }),
      amount: pkg.price,
      paymentMethod: faker.helpers.arrayElement(['card', 'wallet', 'paypal'] as const),
      paymentStatus: status === 'cancelled' ? 'refunded' : 'completed',
      timeline,
      eta: status === 'on_the_way' ? faker.number.int({ min: 5, max: 45 }) : undefined,
      vendorLocation:
        status === 'on_the_way'
          ? {
              lat: vendor.location.lat + faker.number.float({ min: -0.01, max: 0.01 }),
              lng: vendor.location.lng + faker.number.float({ min: -0.01, max: 0.01 }),
            }
          : undefined,
      createdAt: createdAt.toISOString(),
      updatedAt: new Date().toISOString(),
    }
  })
}

const BOOKING_STATUS_MSG: Record<BookingStatus, string> = {
  pending: 'created and awaiting confirmation',
  confirmed: 'confirmed by vendor',
  vendor_assigned: 'vendor assigned to your booking',
  on_the_way: 'vendor is on the way',
  in_progress: 'service is in progress',
  completed: 'service completed successfully',
  cancelled: 'was cancelled',
}

export function generateNotifications(users: User[], bookings: Booking[]): Notification[] {
  const notifications: Notification[] = []
  let count = 0

  for (const booking of bookings.slice(0, 30)) {
    notifications.push({
      id: `notif_${++count}`,
      userId: booking.customerId,
      type: 'booking',
      title: 'Booking Update',
      message: `Your booking #${booking.id.slice(-4)} has been updated`,
      read: faker.datatype.boolean(),
      link: `/customer/bookings/${booking.id}`,
      createdAt: faker.date.recent({ days: 7 }).toISOString(),
    })
  }

  for (const user of users) {
    const numNotifs = faker.number.int({ min: 3, max: 10 })
    for (let i = 0; i < numNotifs && count < 200; i++) {
      const type = faker.helpers.arrayElement([
        'payment',
        'promotion',
        'message',
        'verification',
        'system',
      ] as const)
      notifications.push({
        id: `notif_${++count}`,
        userId: user.id,
        type,
        title: NOTIFICATION_TITLES[type],
        message: faker.lorem.sentence(),
        read: faker.datatype.boolean({ probability: 0.4 }),
        createdAt: faker.date.recent({ days: 30 }).toISOString(),
      })
    }
  }

  return notifications.slice(0, 200)
}

const NOTIFICATION_TITLES: Record<string, string> = {
  payment: 'Payment Confirmed',
  promotion: 'Special Offer',
  message: 'New Message',
  verification: 'Verification Update',
  system: 'System Notification',
}

export function generateTransactions(_users: User[], bookings: Booking[]): Transaction[] {
  return bookings.map((booking, i) => ({
    id: `txn_${i + 1}`,
    userId: booking.customerId,
    bookingId: booking.id,
    amount: booking.amount,
    type: booking.paymentStatus === 'refunded' ? 'refund' : 'payment',
    method: booking.paymentMethod,
    status: booking.paymentStatus,
    description: `Payment for booking #${booking.id.slice(-4)}`,
    invoiceId: `INV-${String(i + 1).padStart(5, '0')}`,
    createdAt: booking.createdAt,
  }))
}

export function generateReviews(services: Service[], users: User[]): Review[] {
  const customers = users.filter((u) => u.role === 'customer')
  return Array.from({ length: 80 }, (_, i) => {
    const service = faker.helpers.arrayElement(services)
    const customer = faker.helpers.arrayElement(customers)
    return {
      id: `review_${i + 1}`,
      userId: customer.id,
      userName: customer.name,
      userAvatar: customer.avatar,
      serviceId: service.id,
      vendorId: service.vendorId,
      rating: faker.number.int({ min: 3, max: 5 }),
      comment: faker.lorem.paragraph(),
      createdAt: faker.date.past({ years: 1 }).toISOString(),
    }
  })
}

export function generatePromotions(vendors: Vendor[]): Promotion[] {
  return Array.from({ length: 10 }, (_, i) => ({
    id: `promo_${i + 1}`,
    code: faker.string.alphanumeric(8).toUpperCase(),
    title: faker.commerce.productName() + ' Discount',
    description: faker.lorem.sentence(),
    discountType: faker.helpers.arrayElement(['percentage', 'fixed'] as const),
    discountValue: faker.helpers.arrayElement([10, 15, 20, 25, 50]),
    minAmount: faker.number.int({ min: 20, max: 100 }),
    maxUses: faker.number.int({ min: 50, max: 500 }),
    usedCount: faker.number.int({ min: 0, max: 50 }),
    vendorId: faker.helpers.maybe(() => faker.helpers.arrayElement(vendors).id, {
      probability: 0.5,
    }),
    expiresAt: faker.date.future({ years: 1 }).toISOString(),
    isActive: true,
  }))
}

export function generateActivityLogs(bookings: Booking[], vendors: Vendor[]): ActivityLog[] {
  const logs: ActivityLog[] = []
  bookings.slice(0, 20).forEach((b) => {
    logs.push({
      id: generateId('log'),
      action: 'booking_created',
      entity: 'booking',
      entityId: b.id,
      details: `New booking created for $${b.amount}`,
      createdAt: b.createdAt,
    })
  })
  vendors.slice(0, 10).forEach((v) => {
    logs.push({
      id: generateId('log'),
      userId: v.userId,
      action: 'vendor_registered',
      entity: 'vendor',
      entityId: v.id,
      details: `${v.businessName} registered on platform`,
      createdAt: v.createdAt,
    })
  })
  return logs
}

export function generateSeedData(): AppData {
  faker.seed(42)
  const categories = generateCategories()
  const users = generateUsers()
  const vendors = generateVendors(users, categories)
  const services = generateServices(vendors, categories)
  const bookings = generateBookings(users, vendors, services)
  const notifications = generateNotifications(users, bookings)
  const transactions = generateTransactions(users, bookings)
  const reviews = generateReviews(services, users)
  const promotions = generatePromotions(vendors)
  const activityLogs = generateActivityLogs(bookings, vendors)

  // Set favorites for demo customer
  const demoCustomer = users.find((u) => u.email === 'customer@example.com')
  if (demoCustomer) {
    demoCustomer.favoriteVendorIds = vendors.slice(0, 3).map((v) => v.id)
  }

  return {
    users,
    vendors,
    services,
    categories,
    bookings,
    notifications,
    transactions,
    promotions,
    reviews,
    activityLogs,
    settings: {
      theme: 'system',
      language: 'en',
      maintenanceMode: false,
      walletBalance: 250.0,
      commissionPercent: 12,
      supportSlaHours: 4,
    },
    initialized: true,
  }
}
