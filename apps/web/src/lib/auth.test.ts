import {
  clearStoredSession,
  createSessionPayload,
  readStoredSession,
  storeSession,
} from '@/lib/auth'

describe('mock auth session storage', () => {
  beforeEach(() => {
    window.localStorage.clear()
    window.sessionStorage.clear()
  })

  it('stores remembered sessions in localStorage', () => {
    const session = createSessionPayload({
      email: 'ana@empresa.com',
      name: 'Ana Costa',
      remember: true,
    })

    storeSession(session)

    expect(JSON.parse(window.localStorage.getItem('streamgate.session') ?? 'null')).toMatchObject({
      email: 'ana@empresa.com',
      remember: true,
    })
    expect(window.sessionStorage.getItem('streamgate.session')).toBeNull()
    expect(readStoredSession()).toMatchObject({
      email: 'ana@empresa.com',
      remember: true,
    })
  })

  it('stores temporary sessions in sessionStorage', () => {
    const session = createSessionPayload({
      email: 'ana@empresa.com',
      name: 'Ana Costa',
      remember: false,
    })

    storeSession(session)

    expect(JSON.parse(window.sessionStorage.getItem('streamgate.session') ?? 'null')).toMatchObject({
      email: 'ana@empresa.com',
      remember: false,
    })
    expect(window.localStorage.getItem('streamgate.session')).toBeNull()
    expect(readStoredSession()).toMatchObject({
      email: 'ana@empresa.com',
      remember: false,
    })
  })

  it('clears both storage targets on logout', () => {
    const rememberedSession = createSessionPayload({
      email: 'ana@empresa.com',
      name: 'Ana Costa',
      remember: true,
    })
    const temporarySession = createSessionPayload({
      email: 'time@empresa.com',
      name: 'Time StreamGate',
      remember: false,
    })

    storeSession(rememberedSession)
    storeSession(temporarySession)

    clearStoredSession()

    expect(window.localStorage.getItem('streamgate.session')).toBeNull()
    expect(window.sessionStorage.getItem('streamgate.session')).toBeNull()
    expect(readStoredSession()).toBeNull()
  })
})
