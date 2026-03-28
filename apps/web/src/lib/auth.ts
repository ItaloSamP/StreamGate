const SESSION_KEY = 'streamgate.session'
const PROFILE_KEY = 'streamgate.profile'

export type SessionPayload = {
  email: string
  name: string
  remember: boolean
  createdAt: string
}

export type RegisteredProfile = {
  email: string
  name: string
}

type CreateSessionOptions = {
  email: string
  name: string
  remember: boolean
}

export function createSessionPayload({
  email,
  name,
  remember,
}: CreateSessionOptions): SessionPayload {
  return {
    email,
    name,
    remember,
    createdAt: new Date().toISOString(),
  }
}

export function storeSession(session: SessionPayload) {
  clearStoredSession()

  const target = session.remember ? window.localStorage : window.sessionStorage
  target.setItem(SESSION_KEY, JSON.stringify(session))
}

export function readStoredSession(): SessionPayload | null {
  const localValue = window.localStorage.getItem(SESSION_KEY)
  if (localValue) {
    return JSON.parse(localValue) as SessionPayload
  }

  const sessionValue = window.sessionStorage.getItem(SESSION_KEY)
  if (sessionValue) {
    return JSON.parse(sessionValue) as SessionPayload
  }

  return null
}

export function clearStoredSession() {
  window.localStorage.removeItem(SESSION_KEY)
  window.sessionStorage.removeItem(SESSION_KEY)
}

export function saveRegisteredProfile(profile: RegisteredProfile) {
  window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
}

export function readRegisteredProfile(email: string) {
  const profile = window.localStorage.getItem(PROFILE_KEY)

  if (!profile) {
    return null
  }

  const parsed = JSON.parse(profile) as RegisteredProfile
  return parsed.email === email ? parsed : null
}
