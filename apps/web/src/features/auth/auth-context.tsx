/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  startTransition,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import {
  clearStoredSession,
  createSessionPayload,
  readStoredSession,
  storeSession,
  type SessionPayload,
} from '@/lib/auth'

type LoginOptions = {
  email: string
  name: string
  remember: boolean
}

type AuthContextValue = {
  session: SessionPayload | null
  isAuthenticated: boolean
  login: (options: LoginOptions) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SessionPayload | null>(() => readStoredSession())

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isAuthenticated: session !== null,
      login: ({ email, name, remember }) => {
        const nextSession = createSessionPayload({ email, name, remember })
        storeSession(nextSession)
        startTransition(() => {
          setSession(nextSession)
        })
      },
      logout: () => {
        clearStoredSession()
        startTransition(() => {
          setSession(null)
        })
      },
    }),
    [session],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)

  if (!value) {
    throw new Error('useAuth must be used within AuthProvider')
  }

  return value
}
