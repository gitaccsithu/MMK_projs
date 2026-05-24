import { faker } from '@faker-js/faker'
import type {
  AppData,
  User,
  Patient,
  Doctor,
  Clinic,
  Department,
  Appointment,
  Prescription,
  Consultation,
  Message,
  Invoice,
  Notification,
  ActivityLog,
  AppointmentStatus,
  DoctorSpecialty,
  VitalReading,
} from '@/types'
import { SPECIALTIES, MEDICINE_CATEGORIES } from '@/types'
import { DEMO_ACCOUNTS } from './demoAccounts'
import { generateId } from '@/utils/cn'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const SLOTS = ['09:00', '09:30', '10:00', '10:30', '11:00', '14:00', '14:30', '15:00', '15:30', '16:00']

function generateUsers(): User[] {
  const demos: User[] = DEMO_ACCOUNTS.map((d, i) => ({
    id: `user_demo_${i + 1}`,
    email: d.email,
    password: d.password,
    role: d.role,
    name: d.name,
    phone: faker.phone.number(),
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${d.email}`,
    dateOfBirth: faker.date.birthdate({ min: 1970, max: 2005, mode: 'year' }).toISOString().split('T')[0],
    gender: faker.helpers.arrayElement(['Male', 'Female', 'Other']),
    notificationPrefs: { email: true, sms: true, push: true, whatsapp: false },
    createdAt: faker.date.past({ years: 2 }).toISOString(),
    updatedAt: new Date().toISOString(),
  }))

  const extra: User[] = Array.from({ length: 46 }, (_, i) => ({
    id: `user_p_${i + 1}`,
    email: faker.internet.email(),
    password: 'password123',
    role: 'patient' as const,
    name: faker.person.fullName(),
    phone: faker.phone.number(),
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=p${i}`,
    notificationPrefs: { email: true, sms: false, push: true, whatsapp: false },
    createdAt: faker.date.past({ years: 1 }).toISOString(),
    updatedAt: new Date().toISOString(),
  }))

  return [...demos, ...extra]
}

function generateClinics(): Clinic[] {
  return Array.from({ length: 5 }, (_, i) => ({
    id: `clinic_${i + 1}`,
    name: faker.company.name() + ' Medical Center',
    address: faker.location.streetAddress({ useFullAddress: true }),
    phone: faker.phone.number(),
    email: `clinic${i + 1}@medicare.demo`,
    departments: [],
    isActive: true,
  }))
}

function generateDepartments(clinics: Clinic[]): Department[] {
  const names = ['General Medicine', 'Cardiology', 'Dermatology', 'Neurology', 'Pediatrics', 'Psychiatry', 'Dental', 'Emergency']
  return names.map((name, i) => ({
    id: `dept_${i + 1}`,
    clinicId: clinics[i % clinics.length].id,
    name,
    description: `${name} department providing specialized care`,
  }))
}

function generatePatients(users: User[]): Patient[] {
  const patientUsers = users.filter((u) => u.role === 'patient')
  return patientUsers.map((u, i) => ({
    id: `patient_${i + 1}`,
    userId: u.id,
    bloodType: faker.helpers.arrayElement(['A+', 'B+', 'O+', 'AB+', 'A-', 'O-']),
    medicalHistory: faker.helpers.arrayElements(['Hypertension', 'Diabetes', 'Asthma', 'None'], { min: 0, max: 2 }),
    allergies: faker.helpers.arrayElements(['Penicillin', 'Peanuts', 'Latex', 'None'], { min: 0, max: 2 }),
    emergencyContacts: [{
      id: generateId('ec'),
      name: faker.person.fullName(),
      relationship: 'Spouse',
      phone: faker.phone.number(),
    }],
    insurance: {
      provider: faker.company.name() + ' Health',
      policyNumber: faker.string.alphanumeric(10).toUpperCase(),
      groupNumber: faker.string.numeric(6),
    },
    vitals: generateVitals(),
    documents: [],
    createdAt: u.createdAt,
  }))
}

function generateVitals(): VitalReading[] {
  const types: VitalReading['type'][] = ['heart_rate', 'blood_pressure', 'blood_sugar', 'weight']
  return types.map((type) => ({
    id: generateId('v'),
    type,
    value: type === 'heart_rate' ? String(faker.number.int({ min: 60, max: 100 }))
      : type === 'blood_pressure' ? `${faker.number.int({ min: 110, max: 130 })}/${faker.number.int({ min: 70, max: 85 })}`
      : type === 'blood_sugar' ? String(faker.number.int({ min: 80, max: 120 }))
      : String(faker.number.int({ min: 55, max: 90 })),
    unit: type === 'weight' ? 'kg' : type === 'blood_pressure' ? 'mmHg' : type === 'blood_sugar' ? 'mg/dL' : 'bpm',
    recordedAt: faker.date.recent({ days: 7 }).toISOString(),
  }))
}

function generateDoctors(users: User[], clinics: Clinic[]): Doctor[] {
  const doctorUser = users.find((u) => u.email === 'doctor@example.com')
  const doctors: Doctor[] = []

  if (doctorUser) {
    doctors.push({
      id: 'doctor_demo_1',
      userId: doctorUser.id,
      specialty: 'General Practitioner',
      licenseNumber: 'MD-2024-001',
      verificationStatus: 'approved',
      clinicIds: [clinics[0].id],
      departmentId: 'dept_1',
      bio: 'Board-certified GP with 15 years of experience in primary care and telemedicine.',
      rating: 4.9,
      consultationFee: 75,
      availability: DAYS.map((day) => ({ day, slots: SLOTS })),
      blockedDates: [],
      emergencyAvailable: true,
      totalConsultations: 1240,
      isActive: true,
      createdAt: faker.date.past({ years: 2 }).toISOString(),
    })
  }

  for (let i = 0; i < 19; i++) {
    const specialty = SPECIALTIES[i % SPECIALTIES.length] as DoctorSpecialty
    const status = faker.helpers.arrayElement(['approved', 'approved', 'pending', 'needs_info'] as const)
    doctors.push({
      id: `doctor_${i + 2}`,
      userId: `user_doc_${i + 2}`,
      specialty,
      licenseNumber: `MD-${faker.string.numeric(6)}`,
      verificationStatus: status,
      adminNotes: status === 'needs_info' ? 'Please resubmit medical license' : undefined,
      clinicIds: [clinics[i % clinics.length].id],
      departmentId: `dept_${(i % 8) + 1}`,
      bio: faker.person.bio(),
      rating: faker.number.float({ min: 3.8, max: 5, fractionDigits: 1 }),
      consultationFee: faker.number.int({ min: 50, max: 200 }),
      availability: DAYS.slice(0, 5).map((day) => ({ day, slots: faker.helpers.arrayElements(SLOTS, { min: 4, max: 8 }) })),
      blockedDates: [],
      emergencyAvailable: faker.datatype.boolean(),
      totalConsultations: faker.number.int({ min: 50, max: 2000 }),
      isActive: status === 'approved',
      createdAt: faker.date.past({ years: 2 }).toISOString(),
    })
  }
  return doctors
}

function generateAppointments(patients: Patient[], doctors: Doctor[]): Appointment[] {
  const statuses: AppointmentStatus[] = ['pending', 'confirmed', 'waiting', 'in_consultation', 'completed', 'cancelled']
  const modes = ['online', 'clinic', 'emergency', 'followup'] as const
  return Array.from({ length: 100 }, (_, i) => {
    const patient = faker.helpers.arrayElement(patients)
    const doctor = faker.helpers.arrayElement(doctors.filter((d) => d.isActive))
    const status = faker.helpers.arrayElement(statuses)
    const scheduledAt = faker.date.soon({ days: 14 })
    return {
      id: `appt_${i + 1}`,
      patientId: patient.id,
      doctorId: doctor.id,
      clinicId: doctor.clinicIds[0],
      mode: faker.helpers.arrayElement(modes),
      status,
      scheduledAt: scheduledAt.toISOString(),
      duration: 30,
      reason: faker.helpers.arrayElement(['Annual checkup', 'Follow-up visit', 'Skin rash', 'Headache', 'Chest pain', 'Dental cleaning']),
      notes: faker.helpers.maybe(() => faker.lorem.sentence(), { probability: 0.3 }),
      checkedInAt: ['waiting', 'in_consultation', 'completed'].includes(status) ? faker.date.recent({ days: 1 }).toISOString() : undefined,
      queuePosition: status === 'waiting' ? faker.number.int({ min: 1, max: 8 }) : undefined,
      createdAt: faker.date.recent({ days: 30 }).toISOString(),
      updatedAt: new Date().toISOString(),
    }
  })
}

function generatePrescriptions(_patients: Patient[], _doctors: Doctor[], appointments: Appointment[]): Prescription[] {
  return Array.from({ length: 100 }, (_, i) => {
    const appt = faker.helpers.arrayElement(appointments)
    const cat = faker.helpers.arrayElement([...MEDICINE_CATEGORIES])
    return {
      id: `rx_${i + 1}`,
      patientId: appt.patientId,
      doctorId: appt.doctorId,
      appointmentId: appt.id,
      medicines: [{
        id: generateId('med'),
        name: faker.helpers.arrayElement(['Amoxicillin', 'Ibuprofen', 'Metformin', 'Lisinopril', 'Vitamin D', 'Cetirizine']),
        category: cat,
        dosage: faker.helpers.arrayElement(['250mg', '500mg', '10mg', '20mg']),
        frequency: faker.helpers.arrayElement(['Once daily', 'Twice daily', 'Three times daily', 'As needed']),
        duration: faker.helpers.arrayElement(['7 days', '14 days', '30 days', 'Ongoing']),
        instructions: 'Take with food',
      }],
      diagnosis: faker.helpers.arrayElement(['Upper respiratory infection', 'Hypertension', 'Allergic rhinitis', 'Type 2 diabetes']),
      status: faker.helpers.arrayElement(['active', 'completed', 'active'] as const),
      refillReminder: faker.date.soon({ days: 30 }).toISOString(),
      createdAt: faker.date.recent({ days: 60 }).toISOString(),
    }
  })
}

function generateConsultations(appointments: Appointment[]): Consultation[] {
  return appointments.filter((a) => ['completed', 'in_consultation'].includes(a.status)).slice(0, 60).map((a, i) => ({
    id: `consult_${i + 1}`,
    appointmentId: a.id,
    patientId: a.patientId,
    doctorId: a.doctorId,
    symptoms: faker.lorem.sentence(),
    diagnosis: faker.helpers.arrayElement(['Healthy', 'Mild infection', 'Hypertension stage 1', 'Anxiety disorder']),
    notes: faker.lorem.paragraph(),
    summary: faker.lorem.sentences(2),
    followUpDate: faker.helpers.maybe(() => faker.date.soon({ days: 30 }).toISOString(), { probability: 0.4 }),
    duration: faker.number.int({ min: 15, max: 45 }),
    createdAt: a.scheduledAt,
  }))
}

function generateMessages(users: User[]): Message[] {
  const msgs: Message[] = []
  for (let i = 0; i < 40; i++) {
    const sender = faker.helpers.arrayElement(users.filter((u) => u.role === 'patient' || u.role === 'doctor'))
    const receiver = users.find((u) => u.role !== sender.role && u.role !== 'admin')!
    msgs.push({
      id: `msg_${i + 1}`,
      senderId: sender.id,
      receiverId: receiver?.id ?? users[0].id,
      content: faker.lorem.sentence(),
      read: faker.datatype.boolean({ probability: 0.5 }),
      createdAt: faker.date.recent({ days: 14 }).toISOString(),
    })
  }
  return msgs
}

function generateInvoices(_patients: Patient[], appointments: Appointment[]): Invoice[] {
  return appointments.slice(0, 80).map((a, i) => {
    const fee = faker.number.int({ min: 50, max: 250 })
    const claim = Math.round(fee * 0.7)
    return {
      id: `inv_${i + 1}`,
      patientId: a.patientId,
      appointmentId: a.id,
      amount: fee,
      insuranceClaim: claim,
      patientPay: fee - claim,
      status: faker.helpers.arrayElement(['paid', 'paid', 'pending', 'partial'] as const),
      method: faker.helpers.arrayElement(['card', 'insurance', 'banking', 'wallet']),
      lineItems: [{ description: 'Consultation fee', amount: fee }],
      createdAt: a.createdAt,
    }
  })
}

function generateNotifications(users: User[]): Notification[] {
  const notifs: Notification[] = []
  let count = 0
  for (const user of users) {
    for (let i = 0; i < 5 && count < 200; i++) {
      notifs.push({
        id: `notif_${++count}`,
        userId: user.id,
        type: faker.helpers.arrayElement(['appointment', 'consultation', 'prescription', 'billing', 'system'] as const),
        title: faker.helpers.arrayElement(['Appointment Reminder', 'Prescription Ready', 'Payment Received', 'Consultation Starting']),
        message: faker.lorem.sentence(),
        read: faker.datatype.boolean({ probability: 0.4 }),
        channel: faker.helpers.arrayElement(['email', 'sms', 'push', 'whatsapp'] as const),
        createdAt: faker.date.recent({ days: 30 }).toISOString(),
      })
    }
  }
  return notifs.slice(0, 200)
}

function generateActivityLogs(appointments: Appointment[]): ActivityLog[] {
  return appointments.slice(0, 25).map((a) => ({
    id: generateId('log'),
    action: 'appointment_created',
    entity: 'appointment',
    entityId: a.id,
    details: `Appointment scheduled for ${a.reason}`,
    createdAt: a.createdAt,
  }))
}

export function generateSeedData(): AppData {
  faker.seed(42)
  const users = generateUsers()
  const clinics = generateClinics()
  const departments = generateDepartments(clinics)
  clinics.forEach((c) => { c.departments = departments.filter((d) => d.clinicId === c.id).map((d) => d.id) })
  const patients = generatePatients(users)
  const doctors = generateDoctors(users, clinics)
  const appointments = generateAppointments(patients, doctors)
  const prescriptions = generatePrescriptions(patients, doctors, appointments)
  const consultations = generateConsultations(appointments)
  const messages = generateMessages(users)
  const invoices = generateInvoices(patients, appointments)
  const notifications = generateNotifications(users)
  const activityLogs = generateActivityLogs(appointments)

  return {
    users,
    patients,
    doctors,
    clinics,
    departments,
    appointments,
    prescriptions,
    consultations,
    messages,
    invoices,
    notifications,
    activityLogs,
    settings: { theme: 'system', language: 'en', maintenanceMode: false },
    initialized: true,
  }
}

export function createPatientProfile(userId: string, _name: string): Patient {
  return {
    id: generateId('patient'),
    userId,
    medicalHistory: [],
    allergies: [],
    emergencyContacts: [],
    vitals: generateVitals(),
    documents: [],
    createdAt: new Date().toISOString(),
  }
}

export function createDoctorProfile(userId: string): Doctor {
  return {
    id: generateId('doctor'),
    userId,
    specialty: 'General Practitioner',
    licenseNumber: '',
    verificationStatus: 'pending',
    clinicIds: [],
    bio: '',
    rating: 0,
    consultationFee: 75,
    availability: DAYS.map((day) => ({ day, slots: SLOTS })),
    blockedDates: [],
    emergencyAvailable: false,
    totalConsultations: 0,
    isActive: false,
    createdAt: new Date().toISOString(),
  }
}
