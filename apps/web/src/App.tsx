import { Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from 'sonner'

import { ProtectedRoute } from '@/features/auth/protected-route'
import { DashboardPage } from '@/pages/DashboardPage'
import { LandingPage } from '@/pages/LandingPage'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { ResetPasswordPage } from '@/pages/ResetPasswordPage'

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
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
