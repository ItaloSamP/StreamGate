import {
  clearStoredAuthSession,
  createStoredAuthSession,
  getStoredAccessToken,
  readStoredAuthSession,
  storeAuthSession,
} from '@/lib/auth'

describe('auth session storage', () => {
  beforeEach(() => {
    window.localStorage.clear()
    window.sessionStorage.clear()
  })

  it('stores remembered sessions in localStorage', () => {
    const session = createStoredAuthSession({
      remember: true,
      user: {
        id: 'user_1',
        email: 'ana@empresa.com',
        full_name: 'Ana Costa',
        role: 'operator',
        status: 'active',
      },
      session: {
        id: 'sess_1',
        token_type: 'Bearer',
        access_token: 'token_local',
        expires_at: '2026-04-07T12:00:00Z',
      },
    })

    storeAuthSession(session)

    expect(JSON.parse(window.localStorage.getItem('streamgate.auth.session') ?? 'null')).toMatchObject({
      remember: true,
      user: { email: 'ana@empresa.com' },
      session: { access_token: 'token_local' },
    })
    expect(window.sessionStorage.getItem('streamgate.auth.session')).toBeNull()
    expect(readStoredAuthSession()).toMatchObject({
      remember: true,
      user: { email: 'ana@empresa.com' },
      session: { access_token: 'token_local' },
    })
    expect(getStoredAccessToken()).toBe('token_local')
  })

  it('stores temporary sessions in sessionStorage', () => {
    const session = createStoredAuthSession({
      remember: false,
      user: {
        id: 'user_1',
        email: 'ana@empresa.com',
        full_name: 'Ana Costa',
        role: 'operator',
        status: 'active',
      },
      session: {
        id: 'sess_2',
        token_type: 'Bearer',
        access_token: 'token_session',
        expires_at: '2026-04-07T12:00:00Z',
      },
    })

    storeAuthSession(session)

    expect(JSON.parse(window.sessionStorage.getItem('streamgate.auth.session') ?? 'null')).toMatchObject({
      remember: false,
      session: { access_token: 'token_session' },
    })
    expect(window.localStorage.getItem('streamgate.auth.session')).toBeNull()
    expect(readStoredAuthSession()).toMatchObject({
      remember: false,
      session: { access_token: 'token_session' },
    })
    expect(getStoredAccessToken()).toBe('token_session')
  })

  it('clears both storage targets on logout', () => {
    const session = createStoredAuthSession({
      remember: true,
      user: {
        id: 'user_1',
        email: 'ana@empresa.com',
        full_name: 'Ana Costa',
        role: 'operator',
        status: 'active',
      },
      session: {
        id: 'sess_1',
        token_type: 'Bearer',
        access_token: 'token_clear',
        expires_at: '2026-04-07T12:00:00Z',
      },
    })

    storeAuthSession(session)
    clearStoredAuthSession()

    expect(window.localStorage.getItem('streamgate.auth.session')).toBeNull()
    expect(window.sessionStorage.getItem('streamgate.auth.session')).toBeNull()
    expect(readStoredAuthSession()).toBeNull()
    expect(getStoredAccessToken()).toBeNull()
  })
})
