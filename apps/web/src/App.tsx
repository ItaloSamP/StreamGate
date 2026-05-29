import { lazy, Suspense, type ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from 'sonner'

import { ProtectedRoute } from '@/features/auth/protected-route'

const AnalyticsPage = lazy(() => import('@/pages/AnalyticsPage').then(module => ({ default: module.AnalyticsPage })))
const AuditPage = lazy(() => import('@/pages/AuditPage').then(module => ({ default: module.AuditPage })))
const DashboardPage = lazy(() => import('@/pages/DashboardPage').then(module => ({ default: module.DashboardPage })))
const EventLogPage = lazy(() => import('@/pages/EventLogPage').then(module => ({ default: module.EventLogPage })))
const ClickHousePage = lazy(() => import('@/pages/ExplorationPages').then(module => ({ default: module.ClickHousePage })))
const EtlExplorerPage = lazy(() => import('@/pages/ExplorationPages').then(module => ({ default: module.EtlExplorerPage })))
const JobsPage = lazy(() => import('@/pages/JobsPage').then(module => ({ default: module.JobsPage })))
const LandingPage = lazy(() => import('@/pages/LandingPage').then(module => ({ default: module.LandingPage })))
const AuditDetailPage = lazy(() => import('@/pages/OperationalDetailPages').then(module => ({ default: module.AuditDetailPage })))
const DlqDetailPage = lazy(() => import('@/pages/OperationalDetailPages').then(module => ({ default: module.DlqDetailPage })))
const JobDetailPage = lazy(() => import('@/pages/OperationalDetailPages').then(module => ({ default: module.JobDetailPage })))
const QuarantineDetailPage = lazy(() => import('@/pages/OperationalDetailPages').then(module => ({ default: module.QuarantineDetailPage })))
const LoginPage = lazy(() => import('@/pages/LoginPage').then(module => ({ default: module.LoginPage })))
const NotificationsPage = lazy(() => import('@/pages/NotificationsPage').then(module => ({ default: module.NotificationsPage })))
const OperationsPage = lazy(() => import('@/pages/OperationsPage').then(module => ({ default: module.OperationsPage })))
const QuarantinePage = lazy(() => import('@/pages/QuarantinePage').then(module => ({ default: module.QuarantinePage })))
const RegisterPage = lazy(() => import('@/pages/RegisterPage').then(module => ({ default: module.RegisterPage })))
const ResetPasswordPage = lazy(() => import('@/pages/ResetPasswordPage').then(module => ({ default: module.ResetPasswordPage })))
const SettingsPage = lazy(() => import('@/pages/SettingsPage').then(module => ({ default: module.SettingsPage })))
const UploadPage = lazy(() => import('@/pages/UploadPage').then(module => ({ default: module.UploadPage })))

function SuspenseFallback() {
  return (
    <div className="flex h-screen w-full items-center justify-center">
      <div className="text-mono text-sm text-[var(--text-dim)]">Carregando...</div>
    </div>
  )
}

function App() {
  const protectedPage = (element: ReactNode) => <ProtectedRoute><Suspense fallback={<SuspenseFallback />}>{element}</Suspense></ProtectedRoute>
  const publicPage = (element: ReactNode) => <Suspense fallback={<SuspenseFallback />}>{element}</Suspense>

  return (
    <>
      <Routes>
        <Route path="/" element={publicPage(<LandingPage />)} />
        <Route path="/login" element={publicPage(<LoginPage />)} />
        <Route path="/register" element={publicPage(<RegisterPage />)} />
        <Route path="/reset-password" element={publicPage(<ResetPasswordPage />)} />
        <Route path="/dashboard" element={protectedPage(<DashboardPage />)} />
        <Route path="/upload" element={protectedPage(<UploadPage />)} />
        <Route path="/jobs" element={protectedPage(<JobsPage />)} />
        <Route path="/jobs/:id" element={protectedPage(<JobDetailPage />)} />
        <Route path="/analytics" element={protectedPage(<AnalyticsPage />)} />
        <Route path="/clickhouse" element={protectedPage(<ClickHousePage />)} />
        <Route path="/quarantine" element={protectedPage(<QuarantinePage />)} />
        <Route path="/etl-explorer" element={protectedPage(<EtlExplorerPage />)} />
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
