export type UserRole = 'patient' | 'doctor' | 'receptionist' | 'admin'

export type AppointmentStatus =
  | 'pending'
  | 'confirmed'
  | 'waiting'
  | 'in_consultation'
  | 'completed'
  | 'cancelled'

export type AppointmentMode = 'online' | 'clinic' | 'emergency' | 'followup'

export type VerificationStatus = 'pending' | 'approved' | 'rejected' | 'needs_info'

export type NotificationType =
  | 'appointment'
  | 'consultation'
  | 'prescription'
  | 'billing'
  | 'system'
  | 'message'

export type PaymentStatus = 'pending' | 'paid' | 'partial' | 'refunded' | 'failed'

export type DoctorSpecialty =
  | 'General Practitioner'
  | 'Cardiologist'
  | 'Dermatologist'
  | 'Neurologist'
  | 'Dentist'
  | 'Pediatrician'
  | 'Psychiatrist'

export const SPECIALTIES: DoctorSpecialty[] = [
  'General Practitioner',
  'Cardiologist',
  'Dermatologist',
  'Neurologist',
  'Dentist',
  'Pediatrician',
  'Psychiatrist',
]

export interface EmergencyContact {
  id: string
  name: string
  relationship: string
  phone: string
}

export interface InsuranceInfo {
  provider: string
  policyNumber: string
  groupNumber?: string
  expiryDate?: string
}

export interface VitalReading {
  id: string
  type: 'heart_rate' | 'blood_pressure' | 'blood_sugar' | 'weight' | 'sleep' | 'exercise'
  value: string
  unit: string
  recordedAt: string
}

export interface MedicalDocument {
  id: string
  name: string
  type: string
  url: string
  uploadedAt: string
}

export interface User {
  id: string
  email: string
  password: string
  role: UserRole
  name: string
  phone: string
  avatar?: string
  dateOfBirth?: string
  gender?: string
  notificationPrefs: {
    email: boolean
    sms: boolean
    push: boolean
    whatsapp: boolean
  }
  createdAt: string
  updatedAt: string
}

export interface Patient {
  id: string
  userId: string
  bloodType?: string
  medicalHistory: string[]
  allergies: string[]
  emergencyContacts: EmergencyContact[]
  insurance?: InsuranceInfo
  vitals: VitalReading[]
  documents: MedicalDocument[]
  createdAt: string
}

export interface DoctorAvailability {
  day: string
  slots: string[]
  blocked?: boolean
}

export interface Doctor {
  id: string
  userId: string
  specialty: DoctorSpecialty
  licenseNumber: string
  verificationStatus: VerificationStatus
  adminNotes?: string
  clinicIds: string[]
  departmentId?: string
  bio: string
  rating: number
  consultationFee: number
  availability: DoctorAvailability[]
  /** ISO date strings (yyyy-mm-dd) for days the clinic is closed for this physician */
  blockedDates?: string[]
  emergencyAvailable: boolean
  totalConsultations: number
  isActive: boolean
  createdAt: string
}

export interface Clinic {
  id: string
  name: string
  address: string
  phone: string
  email: string
  departments: string[]
  isActive: boolean
}

export interface Department {
  id: string
  clinicId: string
  name: string
  description: string
}

export interface Appointment {
  id: string
  patientId: string
  doctorId: string
  clinicId?: string
  mode: AppointmentMode
  status: AppointmentStatus
  scheduledAt: string
  duration: number
  reason: string
  notes?: string
  checkedInAt?: string
  queuePosition?: number
  createdAt: string
  updatedAt: string
}

export interface Medicine {
  id: string
  name: string
  category: string
  dosage: string
  frequency: string
  duration: string
  instructions?: string
}

export interface Prescription {
  id: string
  patientId: string
  doctorId: string
  appointmentId?: string
  medicines: Medicine[]
  diagnosis?: string
  status: 'active' | 'completed' | 'cancelled'
  refillReminder?: string
  createdAt: string
}

export interface Consultation {
  id: string
  appointmentId: string
  patientId: string
  doctorId: string
  symptoms: string
  diagnosis: string
  notes: string
  summary: string
  followUpDate?: string
  duration: number
  createdAt: string
}

export interface Message {
  id: string
  senderId: string
  receiverId: string
  content: string
  read: boolean
  attachment?: string
  createdAt: string
}

export interface InvoiceLineItem {
  description: string
  amount: number
}

export interface Invoice {
  id: string
  patientId: string
  appointmentId?: string
  amount: number
  insuranceClaim?: number
  patientPay: number
  status: PaymentStatus
  method?: string
  lineItems: InvoiceLineItem[]
  createdAt: string
}

export interface Notification {
  id: string
  userId: string
  type: NotificationType
  title: string
  message: string
  read: boolean
  channel?: 'email' | 'sms' | 'push' | 'whatsapp'
  link?: string
  createdAt: string
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
  patients: Patient[]
  doctors: Doctor[]
  clinics: Clinic[]
  departments: Department[]
  appointments: Appointment[]
  prescriptions: Prescription[]
  consultations: Consultation[]
  messages: Message[]
  invoices: Invoice[]
  notifications: Notification[]
  activityLogs: ActivityLog[]
  settings: AppSettings
  initialized: boolean
}

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  waiting: 'Waiting',
  in_consultation: 'In Consultation',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

export const MEDICINE_CATEGORIES = [
  'Antibiotics',
  'Painkillers',
  'Vitamins',
  'Chronic disease medication',
  'Allergy medication',
] as const
