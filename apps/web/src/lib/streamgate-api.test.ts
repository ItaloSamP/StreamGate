import { describe, expect, it, vi } from 'vitest'

import { createStreamgateApi } from '@/lib/streamgate-api'

describe('streamgateApi auth adapter', () => {
  it('maps register payload to backend contract', async () => {
    const post = vi.fn().mockResolvedValue({ data: { user: { id: 'user_1' }, session: { access_token: 'tok' } } })
    const api = createStreamgateApi({
      get: vi.fn(),
      post,
    })

    await api.auth.register({
      fullName: 'Ana Costa',
      email: 'ana@empresa.com',
      password: 'StrongPass123!',
      passwordConfirmation: 'StrongPass123!',
    })

    expect(post).toHaveBeenCalledWith('/api/v1/auth/register', {
      body: {
        registration: {
          full_name: 'Ana Costa',
          email: 'ana@empresa.com',
          password: 'StrongPass123!',
          password_confirmation: 'StrongPass123!',
        },
      },
    })
  })

  it('maps login payload to backend contract', async () => {
    const post = vi.fn().mockResolvedValue({ data: { user: { id: 'user_1' }, session: { access_token: 'tok' } } })
    const api = createStreamgateApi({
      get: vi.fn(),
      post,
    })

    await api.auth.login({
      email: 'ana@empresa.com',
      password: 'StrongPass123!',
    })

    expect(post).toHaveBeenCalledWith('/api/v1/auth/login', {
      body: {
        session: {
          email: 'ana@empresa.com',
          password: 'StrongPass123!',
        },
      },
    })
  })

  it('calls me, logout and refresh on the correct endpoints', async () => {
    const get = vi.fn().mockResolvedValue({ user: { id: 'user_1' }, session: { id: 'sess_1' } })
    const post = vi.fn().mockResolvedValue({ data: { revoked: true } })

    const api = createStreamgateApi({ get, post })

    await api.auth.me()
    await api.auth.logout()
    await api.auth.refresh()

    expect(get).toHaveBeenCalledWith('/api/v1/auth/me', undefined)
    expect(post).toHaveBeenNthCalledWith(1, '/api/v1/auth/logout', undefined)
    expect(post).toHaveBeenNthCalledWith(2, '/api/v1/auth/session/refresh', undefined)
  })

  it('maps password reset request and confirm payloads', async () => {
    const post = vi.fn().mockResolvedValue({ data: { message: 'ok' } })
    const api = createStreamgateApi({ get: vi.fn(), post })

    await api.auth.requestPasswordReset({ email: 'ana@empresa.com' })
    await api.auth.confirmPasswordReset({
      token: 'token_debug',
      password: 'StrongPass123!',
      passwordConfirmation: 'StrongPass123!',
    })

    expect(post).toHaveBeenNthCalledWith(1, '/api/v1/auth/password/reset/request', {
      body: {
        password_reset: {
          email: 'ana@empresa.com',
        },
      },
    })

    expect(post).toHaveBeenNthCalledWith(2, '/api/v1/auth/password/reset/confirm', {
      body: {
        password_reset_confirmation: {
          token: 'token_debug',
          password: 'StrongPass123!',
          password_confirmation: 'StrongPass123!',
        },
      },
    })
  })

  it('aligns jobs and uploads list endpoints with api v1 and keeps query shape stable', async () => {
    const getEnvelope = vi.fn()
      .mockResolvedValueOnce({
        data: [{ id: 'job_1', status: 'pending' }],
        meta: { pagination: { page: 1, per_page: 20, total_count: 1, total_pages: 1 }, filters: { status: 'pending' } },
      })
      .mockResolvedValueOnce({
        data: [{ id: 'upload_1', filename: 'input.csv', status: 'registered' }],
        meta: { pagination: { page: 1, per_page: 20, total_count: 1, total_pages: 1 }, filters: { status: 'registered' } },
      })

    const api = createStreamgateApi({
      get: vi.fn(),
      post: vi.fn(),
      getEnvelope,
    })

    await api.listJobs({ status: 'pending', page: 1, per_page: 20 })
    await api.listUploads({ status: 'registered', page: 1, per_page: 20, search: 'input' })

    expect(getEnvelope).toHaveBeenNthCalledWith(1, '/api/v1/jobs', {
      query: {
        status: 'pending',
        page: 1,
        per_page: 20,
        search: undefined,
      },
    })

    expect(getEnvelope).toHaveBeenNthCalledWith(2, '/api/v1/uploads', {
      query: {
        status: 'registered',
        page: 1,
        per_page: 20,
        search: 'input',
      },
    })
  })
})