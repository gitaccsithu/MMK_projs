import type { UserRole } from '@/types'
import type { SvgIconComponent } from '@mui/icons-material'
import DashboardIcon from '@mui/icons-material/Dashboard'
import EventAvailableIcon from '@mui/icons-material/EventAvailable'
import LocalHospitalIcon from '@mui/icons-material/LocalHospital'
import DescriptionIcon from '@mui/icons-material/Description'
import ChatIcon from '@mui/icons-material/Chat'
import MedicationIcon from '@mui/icons-material/Medication'
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart'
import PersonIcon from '@mui/icons-material/Person'
import NotificationsIcon from '@mui/icons-material/Notifications'
import SettingsIcon from '@mui/icons-material/Settings'
import PeopleIcon from '@mui/icons-material/People'
import AssignmentIcon from '@mui/icons-material/Assignment'
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered'
import PaymentIcon from '@mui/icons-material/Payment'
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser'
import BusinessIcon from '@mui/icons-material/Business'
import BarChartIcon from '@mui/icons-material/BarChart'
import ComputerIcon from '@mui/icons-material/Computer'

export interface NavItem {
  title: string
  href: string
  icon: SvgIconComponent
}

export const patientNav: NavItem[] = [
  { title: 'Dashboard', href: '/patient/dashboard', icon: DashboardIcon },
  { title: 'Book Appointment', href: '/patient/appointments/book', icon: EventAvailableIcon },
  { title: 'Appointments', href: '/patient/appointments', icon: LocalHospitalIcon },
  { title: 'Prescriptions', href: '/patient/prescriptions', icon: MedicationIcon },
  { title: 'Medical Records', href: '/patient/records', icon: DescriptionIcon },
  { title: 'Health Metrics', href: '/patient/metrics', icon: MonitorHeartIcon },
  { title: 'Messages', href: '/patient/messages', icon: ChatIcon },
  { title: 'Notifications', href: '/patient/notifications', icon: NotificationsIcon },
  { title: 'Profile', href: '/patient/profile', icon: PersonIcon },
  { title: 'Settings', href: '/patient/settings', icon: SettingsIcon },
]

export const doctorNav: NavItem[] = [
  { title: 'Dashboard', href: '/doctor', icon: DashboardIcon },
  { title: 'Appointments', href: '/doctor/appointments', icon: EventAvailableIcon },
  { title: 'Consultation', href: '/doctor/consultation', icon: LocalHospitalIcon },
  { title: 'Patients', href: '/doctor/patients', icon: PeopleIcon },
  { title: 'Prescriptions', href: '/doctor/prescriptions', icon: MedicationIcon },
  { title: 'Availability', href: '/doctor/availability', icon: AssignmentIcon },
  { title: 'Analytics', href: '/doctor/analytics', icon: BarChartIcon },
  { title: 'Messages', href: '/doctor/messages', icon: ChatIcon },
  { title: 'Settings', href: '/doctor/settings', icon: SettingsIcon },
]

export const receptionistNav: NavItem[] = [
  { title: 'Dashboard', href: '/receptionist', icon: DashboardIcon },
  { title: 'Patient Registration', href: '/receptionist/patients', icon: PeopleIcon },
  { title: 'Scheduling', href: '/receptionist/scheduling', icon: EventAvailableIcon },
  { title: 'Queue', href: '/receptionist/queue', icon: FormatListNumberedIcon },
  { title: 'Billing', href: '/receptionist/billing', icon: PaymentIcon },
  { title: 'Notifications', href: '/receptionist/notifications', icon: NotificationsIcon },
]

export const adminNav: NavItem[] = [
  { title: 'Dashboard', href: '/admin', icon: DashboardIcon },
  { title: 'Doctor Verification', href: '/admin/verification', icon: VerifiedUserIcon },
  { title: 'Clinic Management', href: '/admin/clinics', icon: BusinessIcon },
  { title: 'Users', href: '/admin/users', icon: PeopleIcon },
  { title: 'Monitoring', href: '/admin/monitoring', icon: ComputerIcon },
  { title: 'Notifications', href: '/admin/notifications', icon: NotificationsIcon },
  { title: 'Settings', href: '/admin/settings', icon: SettingsIcon },
]

export function getNavForRole(role: UserRole): NavItem[] {
  switch (role) {
    case 'patient': return patientNav
    case 'doctor': return doctorNav
    case 'receptionist': return receptionistNav
    case 'admin': return adminNav
    default: return []
  }
}

export { getRoleHome, ROLE_HOME } from './routes'
