import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { ApiClientError, configureApiClientAuth, createApiClient } from '@/lib/api-client'
import { createStreamgateApi } from '@/lib/streamgate-api'

const integrationApiBaseUrl =
  process.env.AUTH_INTEGRATION_BASE_URL ?? process.env.VITE_API_BASE_URL ?? 'http://localhost:3000'

const seededOperatorPassword = process.env.SEED_OPERATOR_PASSWORD ?? 'ChangeMe123!'

const apiClient = createApiClient(integrationApiBaseUrl)
const streamgateApi = createStreamgateApi(apiClient)

let currentToken: string | null = null

describe.sequential('auth integration with real backend', () => {
  beforeEach(() => {
    currentToken = null

    configureApiClientAuth({
      getAccessToken: () => currentToken,
    })
  })

  afterEach(() => {
    configureApiClientAuth({
      getAccessToken: undefined,
      onAuthFailure: undefined,
    })
  })

  it('logs in seeded operator, fetches me, and revokes session on logout', async () => {
    const login = await streamgateApi.auth.login({
      email: 'operator@streamgate.local',
      password: seededOperatorPassword,
    })

    currentToken = login.session.access_token

    expect(login.user.email).toBe('operator@streamgate.local')
    expect(login.session.access_token.length).toBeGreaterThan(20)

    const me = await streamgateApi.auth.me()

    expect(me.user.email).toBe('operator@streamgate.local')
    expect(me.session.id).toBeTruthy()

    await streamgateApi.auth.logout()

    await expect(streamgateApi.auth.me()).rejects.toMatchObject({
      code: 'access_denied',
      status: 403,
    })
  })

  it('registers an ephemeral user and bootstraps me with a valid bearer session', async () => {
    const credentials = buildEphemeralCredentials('register')

    const registration = await streamgateApi.auth.register({
      fullName: credentials.fullName,
      email: credentials.email,
      password: credentials.password,
      passwordConfirmation: credentials.password,
    })

    currentToken = registration.session.access_token

    const me = await streamgateApi.auth.me()

    expect(registration.user.email).toBe(credentials.email)
    expect(me.user.email).toBe(credentials.email)
    expect(me.user.id).toBe(registration.user.id)
  })

  it('resets an ephemeral user password and accepts login with the new password', async () => {
    const credentials = buildEphemeralCredentials('reset')
    const newPassword = 'NewStrongPass123!'

    await streamgateApi.auth.register({
      fullName: credentials.fullName,
      email: credentials.email,
      password: credentials.password,
      passwordConfirmation: credentials.password,
    })

    const resetRequest = await streamgateApi.auth.requestPasswordReset({ email: credentials.email })

    expect(resetRequest.debug_reset_token).toBeTruthy()

    await streamgateApi.auth.confirmPasswordReset({
      token: resetRequest.debug_reset_token ?? '',
      password: newPassword,
      passwordConfirmation: newPassword,
    })

    await expect(
      streamgateApi.auth.login({
        email: credentials.email,
        password: credentials.password,
      }),
    ).rejects.toMatchObject({ code: 'invalid_credentials' } satisfies Partial<ApiClientError>)

    const loginWithNewPassword = await streamgateApi.auth.login({
      email: credentials.email,
      password: newPassword,
    })

    currentToken = loginWithNewPassword.session.access_token

    const me = await streamgateApi.auth.me()
    expect(me.user.email).toBe(credentials.email)
  })
})

function buildEphemeralCredentials(prefix: string) {
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

  return {
    fullName: `Integration ${prefix} ${unique}`,
    email: `${prefix}-${unique}@streamgate.local`,
    password: 'StrongPass123!',
  }
}
