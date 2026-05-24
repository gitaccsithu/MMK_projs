import { Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from './ProtectedRoute'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import { PublicLayout } from '@/layouts/PublicLayout'
import { AuthLayout } from '@/layouts/AuthLayout'
import { paths } from './routes'

// Auth
import { LoginPage } from '@/pages/auth/LoginPage'
import { RegisterPage } from '@/pages/auth/RegisterPage'
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage'
import { OtpVerificationPage } from '@/pages/auth/OtpVerificationPage'
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage'

// Public
import { LandingPage } from '@/pages/public/LandingPage'
import { HelpPage } from '@/pages/public/HelpPage'
import { FAQPage } from '@/pages/public/FAQPage'
import { TermsPage } from '@/pages/public/TermsPage'
import { PrivacyPage } from '@/pages/public/PrivacyPage'

// Patient
import { PatientDashboard } from '@/pages/patient/PatientDashboard'
import { BookAppointmentPage } from '@/pages/patient/BookAppointmentPage'
import { AppointmentsPage } from '@/pages/patient/AppointmentsPage'
import { TeleconsultationPage } from '@/pages/patient/TeleconsultationPage'
import { MessagesPage } from '@/pages/patient/MessagesPage'
import { PrescriptionsPage } from '@/pages/patient/PrescriptionsPage'
import { MedicalRecordsPage } from '@/pages/patient/MedicalRecordsPage'
import { HealthMetricsPage } from '@/pages/patient/HealthMetricsPage'
import { PatientProfilePage } from '@/pages/patient/PatientProfilePage'
import { PatientNotificationsPage } from '@/pages/patient/PatientNotificationsPage'
import { PatientSettingsPage } from '@/pages/patient/PatientSettingsPage'

// Doctor
import { DoctorDashboard } from '@/pages/doctor/DoctorDashboard'
import { DoctorAppointmentsPage } from '@/pages/doctor/DoctorAppointmentsPage'
import { ConsultationWorkspacePage } from '@/pages/doctor/ConsultationWorkspacePage'
import { DoctorPatientsPage } from '@/pages/doctor/DoctorPatientsPage'
import { DoctorPrescriptionsPage } from '@/pages/doctor/DoctorPrescriptionsPage'
import { DoctorAvailabilityPage } from '@/pages/doctor/DoctorAvailabilityPage'
import { DoctorAnalyticsPage } from '@/pages/doctor/DoctorAnalyticsPage'
import { DoctorMessagesPage } from '@/pages/doctor/DoctorMessagesPage'
import { DoctorSettingsPage } from '@/pages/doctor/DoctorSettingsPage'

// Receptionist
import { ReceptionistDashboard } from '@/pages/receptionist/ReceptionistDashboard'
import { PatientRegistrationPage } from '@/pages/receptionist/PatientRegistrationPage'
import { SchedulingPage } from '@/pages/receptionist/SchedulingPage'
import { QueuePage } from '@/pages/receptionist/QueuePage'
import { ReceptionistBillingPage } from '@/pages/receptionist/ReceptionistBillingPage'
import { ReceptionistNotificationsPage } from '@/pages/receptionist/ReceptionistNotificationsPage'

// Admin
import { AdminDashboard } from '@/pages/admin/AdminDashboard'
import { DoctorVerificationPage } from '@/pages/admin/DoctorVerificationPage'
import { ClinicManagementPage } from '@/pages/admin/ClinicManagementPage'
import { AdminUsersPage } from '@/pages/admin/AdminUsersPage'
import { AdminMonitoringPage } from '@/pages/admin/AdminMonitoringPage'
import { AdminNotificationsPage } from '@/pages/admin/AdminNotificationsPage'
import { AdminSettingsPage } from '@/pages/admin/AdminSettingsPage'

export function AppRouter() {
  return (
    <Routes>
      <Route path={paths.landing} element={<PublicLayout fullWidth><LandingPage /></PublicLayout>} />
      <Route path={paths.help} element={<PublicLayout><HelpPage /></PublicLayout>} />
      <Route path={paths.faq} element={<PublicLayout><FAQPage /></PublicLayout>} />
      <Route path={paths.terms} element={<PublicLayout><TermsPage /></PublicLayout>} />
      <Route path={paths.privacy} element={<PublicLayout><PrivacyPage /></PublicLayout>} />

      <Route path={paths.login} element={<AuthLayout><LoginPage /></AuthLayout>} />
      <Route path={paths.register} element={<AuthLayout><RegisterPage /></AuthLayout>} />
      <Route path={paths.forgotPassword} element={<AuthLayout><ForgotPasswordPage /></AuthLayout>} />
      <Route path={paths.otp} element={<AuthLayout><OtpVerificationPage /></AuthLayout>} />
      <Route path={paths.resetPassword} element={<AuthLayout><ResetPasswordPage /></AuthLayout>} />
      <Route path="/login" element={<Navigate to={paths.login} replace />} />

      <Route path="/patient" element={<ProtectedRoute allowedRoles={['patient']}><DashboardLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/patient/dashboard" replace />} />
        <Route path="dashboard" element={<PatientDashboard />} />
        <Route path="appointments/book" element={<BookAppointmentPage />} />
        <Route path="appointments" element={<AppointmentsPage />} />
        <Route path="teleconsultation/:id" element={<TeleconsultationPage />} />
        <Route path="messages" element={<MessagesPage />} />
        <Route path="prescriptions" element={<PrescriptionsPage />} />
        <Route path="records" element={<MedicalRecordsPage />} />
        <Route path="metrics" element={<HealthMetricsPage />} />
        <Route path="profile" element={<PatientProfilePage />} />
        <Route path="notifications" element={<PatientNotificationsPage />} />
        <Route path="settings" element={<PatientSettingsPage />} />
      </Route>

      <Route path="/doctor" element={<ProtectedRoute allowedRoles={['doctor']}><DashboardLayout /></ProtectedRoute>}>
        <Route index element={<DoctorDashboard />} />
        <Route path="appointments" element={<DoctorAppointmentsPage />} />
        <Route path="consultation" element={<ConsultationWorkspacePage />} />
        <Route path="consultation/:appointmentId" element={<ConsultationWorkspacePage />} />
        <Route path="patients" element={<DoctorPatientsPage />} />
        <Route path="prescriptions" element={<DoctorPrescriptionsPage />} />
        <Route path="availability" element={<DoctorAvailabilityPage />} />
        <Route path="analytics" element={<DoctorAnalyticsPage />} />
        <Route path="messages" element={<DoctorMessagesPage />} />
        <Route path="settings" element={<DoctorSettingsPage />} />
      </Route>

      <Route path="/receptionist" element={<ProtectedRoute allowedRoles={['receptionist']}><DashboardLayout /></ProtectedRoute>}>
        <Route index element={<ReceptionistDashboard />} />
        <Route path="patients" element={<PatientRegistrationPage />} />
        <Route path="scheduling" element={<SchedulingPage />} />
        <Route path="queue" element={<QueuePage />} />
        <Route path="billing" element={<ReceptionistBillingPage />} />
        <Route path="notifications" element={<ReceptionistNotificationsPage />} />
      </Route>

      <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><DashboardLayout /></ProtectedRoute>}>
        <Route index element={<AdminDashboard />} />
        <Route path="verification" element={<DoctorVerificationPage />} />
        <Route path="clinics" element={<ClinicManagementPage />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="monitoring" element={<AdminMonitoringPage />} />
        <Route path="notifications" element={<AdminNotificationsPage />} />
        <Route path="settings" element={<AdminSettingsPage />} />
      </Route>

      <Route path="*" element={<Navigate to={paths.landing} replace />} />
    </Routes>
  )
}
