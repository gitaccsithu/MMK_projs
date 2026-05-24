import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from './ProtectedRoute'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import { PublicLayout } from '@/layouts/PublicLayout'

// Auth
import { LoginPage } from '@/pages/auth/LoginPage'
import { RegisterPage } from '@/pages/auth/RegisterPage'
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage'
import { OtpVerificationPage } from '@/pages/auth/OtpVerificationPage'

// Customer
import { CustomerDashboard } from '@/pages/customer/CustomerDashboard'
import { MarketplacePage } from '@/pages/customer/MarketplacePage'
import { ServiceDetailPage } from '@/pages/customer/ServiceDetailPage'
import { BookingWizardPage } from '@/pages/customer/BookingWizardPage'
import { BookingsPage } from '@/pages/customer/BookingsPage'
import { BookingTrackPage } from '@/pages/customer/BookingTrackPage'
import { CustomerProfilePage } from '@/pages/customer/CustomerProfilePage'
import { WalletPage } from '@/pages/customer/WalletPage'
import { NotificationsPage as CustomerNotificationsPage } from '@/pages/customer/NotificationsPage'
import { ReferralsPage } from '@/pages/customer/ReferralsPage'
import { CustomerSettingsPage } from '@/pages/customer/CustomerSettingsPage'

// Vendor
import { VendorDashboard } from '@/pages/vendor/VendorDashboard'
import { VendorBookingsPage } from '@/pages/vendor/VendorBookingsPage'
import { KanbanPage } from '@/pages/vendor/KanbanPage'
import { VendorServicesPage } from '@/pages/vendor/VendorServicesPage'
import { VendorPromotionsPage } from '@/pages/vendor/VendorPromotionsPage'
import { VendorAnalyticsPage } from '@/pages/vendor/VendorAnalyticsPage'
import { VendorOnboardingPage } from '@/pages/vendor/VendorOnboardingPage'
import { VendorProfilePage } from '@/pages/vendor/VendorProfilePage'
import { VendorSettingsPage } from '@/pages/vendor/VendorSettingsPage'

// Admin
import { AdminDashboard } from '@/pages/admin/AdminDashboard'
import { VerificationPage } from '@/pages/admin/VerificationPage'
import { AdminUsersPage } from '@/pages/admin/AdminUsersPage'
import { AdminVendorsPage } from '@/pages/admin/AdminVendorsPage'
import { AdminCategoriesPage } from '@/pages/admin/AdminCategoriesPage'
import { AdminMonitoringPage } from '@/pages/admin/AdminMonitoringPage'
import { AdminPromotionsPage } from '@/pages/admin/AdminPromotionsPage'
import { AdminNotificationsPage } from '@/pages/admin/AdminNotificationsPage'
import { AdminSettingsPage } from '@/pages/admin/AdminSettingsPage'

// Public
import { LandingPage } from '@/pages/public/LandingPage'
import { HelpPage } from '@/pages/public/HelpPage'
import { FAQPage } from '@/pages/public/FAQPage'
import { TermsPage } from '@/pages/public/TermsPage'
import { PrivacyPage } from '@/pages/public/PrivacyPage'

function CustomerRoutes() {
  return (
    <DashboardLayout>
      <Routes>
        <Route index element={<CustomerDashboard />} />
        <Route path="marketplace" element={<MarketplacePage />} />
        <Route path="marketplace/:id" element={<ServiceDetailPage />} />
        <Route path="book/:serviceId" element={<BookingWizardPage />} />
        <Route path="bookings" element={<BookingsPage />} />
        <Route path="bookings/:id/track" element={<BookingTrackPage />} />
        <Route path="profile" element={<CustomerProfilePage />} />
        <Route path="wallet" element={<WalletPage />} />
        <Route path="notifications" element={<CustomerNotificationsPage />} />
        <Route path="referrals" element={<ReferralsPage />} />
        <Route path="settings" element={<CustomerSettingsPage />} />
        <Route path="*" element={<Navigate to="/customer" replace />} />
      </Routes>
    </DashboardLayout>
  )
}

function VendorRoutes() {
  return (
    <DashboardLayout>
      <Routes>
        <Route index element={<VendorDashboard />} />
        <Route path="bookings" element={<VendorBookingsPage />} />
        <Route path="kanban" element={<KanbanPage />} />
        <Route path="services" element={<VendorServicesPage />} />
        <Route path="promotions" element={<VendorPromotionsPage />} />
        <Route path="analytics" element={<VendorAnalyticsPage />} />
        <Route path="onboarding" element={<VendorOnboardingPage />} />
        <Route path="profile" element={<VendorProfilePage />} />
        <Route path="settings" element={<VendorSettingsPage />} />
        <Route path="*" element={<Navigate to="/vendor" replace />} />
      </Routes>
    </DashboardLayout>
  )
}

function AdminRoutes() {
  return (
    <DashboardLayout>
      <Routes>
        <Route index element={<AdminDashboard />} />
        <Route path="verification" element={<VerificationPage />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="vendors" element={<AdminVendorsPage />} />
        <Route path="categories" element={<AdminCategoriesPage />} />
        <Route path="monitoring" element={<AdminMonitoringPage />} />
        <Route path="promotions" element={<AdminPromotionsPage />} />
        <Route path="notifications" element={<AdminNotificationsPage />} />
        <Route path="settings" element={<AdminSettingsPage />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </DashboardLayout>
  )
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<PublicLayout variant="full"><LandingPage /></PublicLayout>} />
        <Route path="/help" element={<PublicLayout variant="wide"><HelpPage /></PublicLayout>} />
        <Route path="/faq" element={<PublicLayout><FAQPage /></PublicLayout>} />
        <Route path="/terms" element={<PublicLayout variant="wide"><TermsPage /></PublicLayout>} />
        <Route path="/privacy" element={<PublicLayout variant="wide"><PrivacyPage /></PublicLayout>} />

        {/* Auth */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/otp-verification" element={<OtpVerificationPage />} />

        {/* Customer */}
        <Route
          path="/customer/*"
          element={
            <ProtectedRoute allowedRoles={['customer']}>
              <CustomerRoutes />
            </ProtectedRoute>
          }
        />

        {/* Vendor */}
        <Route
          path="/vendor/*"
          element={
            <ProtectedRoute allowedRoles={['vendor']}>
              <VendorRoutes />
            </ProtectedRoute>
          }
        />

        {/* Admin */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminRoutes />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
