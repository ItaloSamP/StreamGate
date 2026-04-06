import type { AuthToken, AuthUser } from '@/lib/streamgate-api'

const AUTH_SESSION_KEY = 'streamgate.auth.session'

export type StoredAuthSession = {
  user: AuthUser
  session: AuthToken
  remember: boolean
  createdAt: string
}

export type CreateStoredAuthSessionInput = {
  user: AuthUser
  session: AuthToken
  remember: boolean
}

export function createStoredAuthSession({ user, session, remember }: CreateStoredAuthSessionInput): StoredAuthSession {
  return {
    user,
    session,
    remember,
    createdAt: new Date().toISOString(),
  }
}

export function storeAuthSession(session: StoredAuthSession) {
  clearStoredAuthSession()

  const target = session.remember ? window.localStorage : window.sessionStorage
  target.setItem(AUTH_SESSION_KEY, JSON.stringify(session))
}

function readSessionFromStorage(storage: Storage): StoredAuthSession | null {
  const value = storage.getItem(AUTH_SESSION_KEY)

  if (!value) {
    return null
  }

  try {
    return JSON.parse(value) as StoredAuthSession
  } catch {
    storage.removeItem(AUTH_SESSION_KEY)
    return null
  }
}

export function readStoredAuthSession(): StoredAuthSession | null {
  const localSession = readSessionFromStorage(window.localStorage)
  if (localSession) {
    return localSession
  }

  return readSessionFromStorage(window.sessionStorage)
}

export function clearStoredAuthSession() {
  window.localStorage.removeItem(AUTH_SESSION_KEY)
  window.sessionStorage.removeItem(AUTH_SESSION_KEY)
}

export function getStoredAccessToken() {
  return readStoredAuthSession()?.session.access_token ?? null
}

export function isStoredSessionExpired(session: StoredAuthSession) {
  return new Date(session.session.expires_at).getTime() <= Date.now()
}
