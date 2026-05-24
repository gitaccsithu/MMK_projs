import type {
  AppData, User, Patient, Doctor, Appointment, Prescription, Consultation,
  Message, Invoice, Clinic, Department,
  AppointmentStatus, VerificationStatus, AuthSession,
} from '@/types'
import { generateSeedData, createPatientProfile, createDoctorProfile } from '@/data/seed'
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

function save(data: AppData) { storageService.setAppData(data) }

export function initializeApp() { return getData() }
export function resetDemoData() { const d = generateSeedData(); save(d); return d }
export function getAppDataSync() { return getData() }
export function saveAppDataSync(data: AppData) { save(data) }

export async function login(email: string, password: string, rememberMe = false): Promise<ApiResult<AuthSession>> {
  await delay(600)
  const data = getData()
  const user = data.users.find((u) => u.email === email && u.password === password)
  if (!user) return { data: null, error: 'Invalid email or password' }
  const session: AuthSession = {
    userId: user.id, email: user.email, role: user.role,
    token: generateId('tok'), expiresAt: new Date(Date.now() + 86400000 * 7).toISOString(), rememberMe,
  }
  storageService.setAuth(session)
  return { data: session, error: null }
}

export async function register(payload: Partial<User> & { email: string; password: string; name: string; role?: User['role'] }): Promise<ApiResult<User>> {
  await delay(800)
  const data = getData()
  if (data.users.some((u) => u.email === payload.email)) return { data: null, error: 'Email already registered' }
  const user: User = {
    id: generateId('user'), email: payload.email, password: payload.password,
    role: payload.role ?? 'patient', name: payload.name, phone: payload.phone ?? '',
    notificationPrefs: { email: true, sms: true, push: true, whatsapp: false },
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  }
  data.users.push(user)
  if (user.role === 'patient') data.patients.push(createPatientProfile(user.id, user.name))
  if (user.role === 'doctor') data.doctors.push(createDoctorProfile(user.id))
  save(data)
  return { data: user, error: null }
}

export async function getUsers() { await delay(300); return getData().users }
export async function getUserById(id: string) { await delay(200); return getData().users.find((u) => u.id === id) }
export async function updateUser(id: string, updates: Partial<User>): Promise<ApiResult<User>> {
  await delay(400)
  const data = getData()
  const idx = data.users.findIndex((u) => u.id === id)
  if (idx === -1) return { data: null, error: 'Not found' }
  data.users[idx] = { ...data.users[idx], ...updates, updatedAt: new Date().toISOString() }
  save(data)
  return { data: data.users[idx], error: null }
}

export async function getPatients() { await delay(300); return getData().patients }
export async function getPatientByUserId(userId: string) { await delay(200); return getData().patients.find((p) => p.userId === userId) }
export async function getPatientById(id: string) { await delay(200); return getData().patients.find((p) => p.id === id) }
export async function updatePatient(id: string, updates: Partial<Patient>): Promise<ApiResult<Patient>> {
  await delay(400)
  const data = getData()
  const idx = data.patients.findIndex((p) => p.id === id)
  if (idx === -1) return { data: null, error: 'Not found' }
  data.patients[idx] = { ...data.patients[idx], ...updates }
  save(data)
  return { data: data.patients[idx], error: null }
}

export async function getDoctors() { await delay(300); return getData().doctors.filter((d) => d.isActive || true) }
export async function getDoctorByUserId(userId: string) { await delay(200); return getData().doctors.find((d) => d.userId === userId) }
export async function getDoctorById(id: string) { await delay(200); return getData().doctors.find((d) => d.id === id) }
export async function updateDoctor(id: string, updates: Partial<Doctor>): Promise<ApiResult<Doctor>> {
  await delay(400)
  const data = getData()
  const idx = data.doctors.findIndex((d) => d.id === id)
  if (idx === -1) return { data: null, error: 'Not found' }
  data.doctors[idx] = { ...data.doctors[idx], ...updates }
  save(data)
  return { data: data.doctors[idx], error: null }
}

export async function updateDoctorVerification(id: string, status: VerificationStatus, adminNotes?: string): Promise<ApiResult<Doctor>> {
  await delay(500)
  const data = getData()
  const idx = data.doctors.findIndex((d) => d.id === id)
  if (idx === -1) return { data: null, error: 'Not found' }
  data.doctors[idx].verificationStatus = status
  data.doctors[idx].adminNotes = adminNotes
  data.doctors[idx].isActive = status === 'approved'
  data.activityLogs.unshift({ id: generateId('log'), action: 'doctor_verification', entity: 'doctor', entityId: id, details: `Doctor ${status}`, createdAt: new Date().toISOString() })
  save(data)
  return { data: data.doctors[idx], error: null }
}

export async function getAppointments(userId?: string, role?: string) {
  await delay(400)
  const data = getData()
  if (!userId) return data.appointments
  if (role === 'patient') {
    const p = data.patients.find((x) => x.userId === userId)
    return p ? data.appointments.filter((a) => a.patientId === p.id) : []
  }
  if (role === 'doctor') {
    const d = data.doctors.find((x) => x.userId === userId)
    return d ? data.appointments.filter((a) => a.doctorId === d.id) : []
  }
  return data.appointments
}

export async function getAppointmentById(id: string) { await delay(200); return getData().appointments.find((a) => a.id === id) }

export async function createAppointment(appt: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResult<Appointment>> {
  await delay(700)
  const data = getData()
  const patient = data.patients.find((p) => p.id === appt.patientId)
  const newAppt: Appointment = { ...appt, id: generateId('appt'), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
  data.appointments.unshift(newAppt)
  if (patient) {
    const user = data.users.find((u) => u.id === patient.userId)
    if (user) data.notifications.unshift({ id: generateId('notif'), userId: user.id, type: 'appointment', title: 'Appointment Booked', message: 'Your appointment has been scheduled', read: false, createdAt: new Date().toISOString() })
  }
  save(data)
  return { data: newAppt, error: null }
}

export async function updateAppointmentStatus(id: string, status: AppointmentStatus): Promise<ApiResult<Appointment>> {
  await delay(500)
  const data = getData()
  const idx = data.appointments.findIndex((a) => a.id === id)
  if (idx === -1) return { data: null, error: 'Not found' }
  data.appointments[idx].status = status
  data.appointments[idx].updatedAt = new Date().toISOString()
  if (status === 'waiting') data.appointments[idx].checkedInAt = new Date().toISOString()
  save(data)
  return { data: data.appointments[idx], error: null }
}

export async function cancelAppointment(id: string) { return updateAppointmentStatus(id, 'cancelled') }

export async function updateAppointment(
  id: string,
  updates: Partial<
    Pick<
      Appointment,
      | 'scheduledAt'
      | 'duration'
      | 'notes'
      | 'reason'
      | 'mode'
      | 'clinicId'
      | 'status'
      | 'patientId'
      | 'doctorId'
      | 'queuePosition'
      | 'checkedInAt'
    >
  >
): Promise<ApiResult<Appointment>> {
  await delay(400)
  const data = getData()
  const idx = data.appointments.findIndex((a) => a.id === id)
  if (idx === -1) return { data: null, error: 'Not found' }
  data.appointments[idx] = {
    ...data.appointments[idx],
    ...updates,
    updatedAt: new Date().toISOString(),
  }
  save(data)
  return { data: data.appointments[idx], error: null }
}

export async function getPrescriptions(patientId?: string, doctorId?: string) {
  await delay(300)
  let rx = getData().prescriptions
  if (patientId) rx = rx.filter((p) => p.patientId === patientId)
  if (doctorId) rx = rx.filter((p) => p.doctorId === doctorId)
  return rx
}

export async function createPrescription(rx: Omit<Prescription, 'id' | 'createdAt'>): Promise<ApiResult<Prescription>> {
  await delay(500)
  const data = getData()
  const newRx: Prescription = { ...rx, id: generateId('rx'), createdAt: new Date().toISOString() }
  data.prescriptions.unshift(newRx)
  save(data)
  return { data: newRx, error: null }
}

export async function updatePrescription(id: string, updates: Partial<Prescription>): Promise<ApiResult<Prescription>> {
  await delay(400)
  const data = getData()
  const idx = data.prescriptions.findIndex((p) => p.id === id)
  if (idx === -1) return { data: null, error: 'Not found' }
  data.prescriptions[idx] = { ...data.prescriptions[idx], ...updates }
  save(data)
  return { data: data.prescriptions[idx], error: null }
}

export async function deletePrescription(id: string) {
  await delay(400)
  const data = getData()
  data.prescriptions = data.prescriptions.filter((p) => p.id !== id)
  save(data)
  return { data: true, error: null }
}

export async function getConsultations(appointmentId?: string) {
  await delay(300)
  const c = getData().consultations
  return appointmentId ? c.filter((x) => x.appointmentId === appointmentId) : c
}

export async function createConsultation(c: Omit<Consultation, 'id' | 'createdAt'>): Promise<ApiResult<Consultation>> {
  await delay(500)
  const data = getData()
  const nc: Consultation = { ...c, id: generateId('consult'), createdAt: new Date().toISOString() }
  data.consultations.unshift(nc)
  save(data)
  return { data: nc, error: null }
}

export async function getMessages(userId: string) {
  await delay(300)
  return getData().messages.filter((m) => m.senderId === userId || m.receiverId === userId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export async function sendMessage(msg: Omit<Message, 'id' | 'createdAt' | 'read'>): Promise<ApiResult<Message>> {
  await delay(400)
  const data = getData()
  const m: Message = { ...msg, id: generateId('msg'), read: false, createdAt: new Date().toISOString() }
  data.messages.unshift(m)
  save(data)
  return { data: m, error: null }
}

export async function getInvoices(patientId?: string) {
  await delay(300)
  const inv = getData().invoices
  return patientId ? inv.filter((i) => i.patientId === patientId) : inv
}

export async function getInvoicesForDoctor(doctorId: string) {
  await delay(300)
  const data = getData()
  const appointmentIds = new Set(data.appointments.filter((a) => a.doctorId === doctorId).map((a) => a.id))
  return data.invoices.filter((i) => i.appointmentId && appointmentIds.has(i.appointmentId))
}

export async function updateInvoice(id: string, updates: Partial<Invoice>): Promise<ApiResult<Invoice>> {
  await delay(400)
  const data = getData()
  const idx = data.invoices.findIndex((x) => x.id === id)
  if (idx === -1) return { data: null, error: 'Not found' }
  data.invoices[idx] = { ...data.invoices[idx], ...updates }
  save(data)
  return { data: data.invoices[idx], error: null }
}

export async function getNotifications(userId: string) {
  await delay(300)
  return getData().notifications.filter((n) => n.userId === userId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export async function markNotificationRead(id: string) {
  await delay(200)
  const data = getData()
  const n = data.notifications.find((x) => x.id === id)
  if (n) n.read = true
  save(data)
}

export async function markAllNotificationsRead(userId: string) {
  await delay(300)
  const data = getData()
  data.notifications.filter((n) => n.userId === userId).forEach((n) => (n.read = true))
  save(data)
}

export async function getClinics() { await delay(200); return getData().clinics }
export async function getDepartments() { await delay(200); return getData().departments }
export async function createClinic(c: Omit<Clinic, 'id'>): Promise<ApiResult<Clinic>> {
  await delay(400)
  const data = getData()
  const nc: Clinic = { ...c, id: generateId('clinic') }
  data.clinics.push(nc)
  save(data)
  return { data: nc, error: null }
}
export async function updateClinic(id: string, updates: Partial<Clinic>): Promise<ApiResult<Clinic>> {
  await delay(400)
  const data = getData()
  const idx = data.clinics.findIndex((c) => c.id === id)
  if (idx === -1) return { data: null, error: 'Not found' }
  data.clinics[idx] = { ...data.clinics[idx], ...updates }
  save(data)
  return { data: data.clinics[idx], error: null }
}

export async function deleteClinic(id: string): Promise<ApiResult<boolean>> {
  await delay(350)
  const data = getData()
  const idx = data.clinics.findIndex((c) => c.id === id)
  if (idx === -1) return { data: null, error: 'Not found' }
  data.clinics.splice(idx, 1)
  data.departments = data.departments.filter((d) => d.clinicId !== id)
  data.doctors.forEach((d) => {
    d.clinicIds = d.clinicIds.filter((cid) => cid !== id)
  })
  save(data)
  return { data: true, error: null }
}

export async function createDepartment(d: Omit<Department, 'id'>): Promise<ApiResult<Department>> {
  await delay(350)
  const data = getData()
  const nd: Department = { ...d, id: generateId('dept') }
  data.departments.push(nd)
  save(data)
  return { data: nd, error: null }
}

export async function updateDepartment(id: string, updates: Partial<Department>): Promise<ApiResult<Department>> {
  await delay(350)
  const data = getData()
  const idx = data.departments.findIndex((d) => d.id === id)
  if (idx === -1) return { data: null, error: 'Not found' }
  data.departments[idx] = { ...data.departments[idx], ...updates }
  save(data)
  return { data: data.departments[idx], error: null }
}

export async function deleteDepartment(id: string): Promise<ApiResult<boolean>> {
  await delay(250)
  const data = getData()
  data.departments = data.departments.filter((d) => d.id !== id)
  save(data)
  return { data: true, error: null }
}

export async function getActivityLogs() { await delay(300); return getData().activityLogs }
export async function getAppSettings() { await delay(100); return getData().settings }
export async function updateAppSettings(updates: Partial<AppData['settings']>) {
  await delay(300)
  const data = getData()
  data.settings = { ...data.settings, ...updates }
  save(data)
  return data.settings
}

export async function searchDoctors(filters?: { specialty?: string; search?: string }) {
  await delay(400)
  let docs = getData().doctors.filter((d) => d.isActive)
  if (filters?.specialty) docs = docs.filter((d) => d.specialty === filters.specialty)
  if (filters?.search) {
    const q = filters.search.toLowerCase()
    docs = docs.filter((d) => d.specialty.toLowerCase().includes(q) || d.bio.toLowerCase().includes(q))
  }
  return docs
}
