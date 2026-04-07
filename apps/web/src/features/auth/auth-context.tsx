/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

import { configureApiClientAuth } from '@/lib/api-client'
import {
  clearStoredAuthSession,
  createStoredAuthSession,
  isStoredSessionExpired,
  readStoredAuthSession,
  storeAuthSession,
  type StoredAuthSession,
} from '@/lib/auth'
import { streamgateApi } from '@/lib/streamgate-api'

type LoginOptions = {
  email: string
  password: string
  remember: boolean
}

type RegisterOptions = {
  fullName: string
  email: string
  password: string
  passwordConfirmation: string
  remember: boolean
}

type AuthContextValue = {
  session: StoredAuthSession | null
  isAuthenticated: boolean
  isBootstrapping: boolean
  login: (options: LoginOptions) => Promise<void>
  register: (options: RegisterOptions) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function resolveInitialSession() {
  const storedSession = readStoredAuthSession()

  if (!storedSession) {
    return null
  }

  if (isStoredSessionExpired(storedSession)) {
    clearStoredAuthSession()
    return null
  }

  return storedSession
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<StoredAuthSession | null>(() => resolveInitialSession())
  const [isBootstrapping, setIsBootstrapping] = useState(() => session !== null)

  const initialSessionRef = useRef<StoredAuthSession | null>(session)
  const sessionRef = useRef<StoredAuthSession | null>(session)

  useEffect(() => {
    sessionRef.current = session
  }, [session])

  const clearSession = useCallback(() => {
    clearStoredAuthSession()
    startTransition(() => {
      setSession(null)
    })
  }, [])

  const applySession = useCallback(
    ({
      user,
      authSession,
      remember,
    }: {
      user: StoredAuthSession['user']
      authSession: StoredAuthSession['session']
      remember: boolean
    }) => {
      const nextSession = createStoredAuthSession({
        user,
        session: authSession,
        remember,
      })

      storeAuthSession(nextSession)
      startTransition(() => {
        setSession(nextSession)
      })
    },
    [],
  )

  useEffect(() => {
    configureApiClientAuth({
      getAccessToken: () => sessionRef.current?.session.access_token ?? null,
      onAuthFailure: () => {
        clearSession()
      },
    })

    return () => {
      configureApiClientAuth({
        getAccessToken: undefined,
        onAuthFailure: undefined,
      })
    }
  }, [clearSession])

  useEffect(() => {
    const bootstrapSession = initialSessionRef.current

    if (!bootstrapSession) {
      return
    }

    let isMounted = true

    streamgateApi.auth
      .me()
      .then((data) => {
        if (!isMounted) {
          return
        }

        applySession({
          user: data.user,
          authSession: bootstrapSession.session,
          remember: bootstrapSession.remember,
        })
      })
      .catch(() => {
        if (!isMounted) {
          return
        }

        clearSession()
      })
      .finally(() => {
        if (isMounted) {
          setIsBootstrapping(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [applySession, clearSession])

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isAuthenticated: session !== null,
      isBootstrapping,
      login: async ({ email, password, remember }) => {
        const payload = await streamgateApi.auth.login({
          email,
          password,
        })

        applySession({
          user: payload.user,
          authSession: payload.session,
          remember,
        })
      },
      register: async ({ fullName, email, password, passwordConfirmation, remember }) => {
        const payload = await streamgateApi.auth.register({
          fullName,
          email,
          password,
          passwordConfirmation,
        })

        applySession({
          user: payload.user,
          authSession: payload.session,
          remember,
        })
      },
      logout: async () => {
        const currentToken = sessionRef.current?.session.access_token

        if (currentToken) {
          try {
            await streamgateApi.auth.logout()
          } catch {
            // Intencional: logout local deve acontecer mesmo com falha de rede.
          }
        }

        clearSession()
      },
    }),
    [applySession, clearSession, isBootstrapping, session],
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
