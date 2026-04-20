import type { ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from 'sonner'

import { ProtectedRoute } from '@/features/auth/protected-route'
import { AnalyticsPage } from '@/pages/AnalyticsPage'
import { AuditPage } from '@/pages/AuditPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { EventLogPage } from '@/pages/EventLogPage'
import { JobsPage } from '@/pages/JobsPage'
import { LandingPage } from '@/pages/LandingPage'
import { AuditDetailPage, DlqDetailPage, JobDetailPage, QuarantineDetailPage } from '@/pages/OperationalDetailPages'
import { LoginPage } from '@/pages/LoginPage'
import { NotificationsPage } from '@/pages/NotificationsPage'
import { OperationsPage } from '@/pages/OperationsPage'
import { QuarantinePage } from '@/pages/QuarantinePage'
import { RegisterPage } from '@/pages/RegisterPage'
import { ResetPasswordPage } from '@/pages/ResetPasswordPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { UploadPage } from '@/pages/UploadPage'

function App() {
  const protectedPage = (element: ReactNode) => <ProtectedRoute>{element}</ProtectedRoute>

  return (
    <>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/dashboard" element={protectedPage(<DashboardPage />)} />
        <Route path="/upload" element={protectedPage(<UploadPage />)} />
        <Route path="/jobs" element={protectedPage(<JobsPage />)} />
        <Route path="/jobs/:id" element={protectedPage(<JobDetailPage />)} />
        <Route path="/analytics" element={protectedPage(<AnalyticsPage />)} />
        <Route path="/quarantine" element={protectedPage(<QuarantinePage />)} />
        <Route path="/quarantine/dlq/:messageId" element={protectedPage(<DlqDetailPage />)} />
        <Route path="/quarantine/:id" element={protectedPage(<QuarantineDetailPage />)} />
        <Route path="/events" element={protectedPage(<EventLogPage />)} />
        <Route path="/audit" element={protectedPage(<AuditPage />)} />
        <Route path="/audit/:id" element={protectedPage(<AuditDetailPage />)} />
        <Route path="/operations" element={protectedPage(<OperationsPage />)} />
        <Route path="/notifications" element={protectedPage(<NotificationsPage />)} />
        <Route path="/settings" element={protectedPage(<SettingsPage />)} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <Toaster
        closeButton
        richColors
        visibleToasts={1}
        position="top-right"
        theme="dark"
        toastOptions={{
          style: {
            background: 'var(--surface-2)',
            color: 'var(--foreground)',
            border: '1px solid rgb(255 255 255 / 0.08)',
          },
        }}
      />
    </>
  )
}

export default App
