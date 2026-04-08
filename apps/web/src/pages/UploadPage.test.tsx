import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { AuthProvider } from '@/features/auth/auth-context'
import { createStoredAuthSession, storeAuthSession } from '@/lib/auth'
import { UploadPage } from '@/pages/UploadPage'

const originalFetch = global.fetch
const originalCrypto = globalThis.crypto

type UploadApiMockOptions = {
  failSignedUrl?: boolean
}

function renderUploadPage(initialEntry = '/upload') {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/upload" element={<UploadPage />} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  )
}

function setupUploadApiMock(options: UploadApiMockOptions = {}) {
  const counters = {
    uploadsList: 0,
    jobsList: 0,
    signedUrl: 0,
    register: 0,
    signedPut: 0,
    uploadsUrls: [] as string[],
    jobsUrls: [] as string[],
  }

  global.fetch = vi.fn().mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input)
    const method = (init?.method ?? 'GET').toUpperCase()

    if (url.includes('/api/v1/auth/me')) {
      return Promise.resolve(jsonResponse(200, {
        data: {
          user: {
            id: 'user_1',
            email: 'ana@empresa.com',
            full_name: 'Ana Costa',
            role: 'operator',
            status: 'active',
          },
          session: {
            id: 'sess_1',
            user_id: 'user_1',
            expires_at: '2099-04-07T12:00:00Z',
            revoked_at: null,
            last_seen_at: null,
            trace_id: 'trace_auth_1',
          },
        },
      }))
    }

    if (url.includes('/api/v1/uploads?') && method === 'GET') {
      counters.uploadsList += 1
      counters.uploadsUrls.push(url)
      return Promise.resolve(jsonResponse(200, {
        data: [],
        meta: {
          pagination: {
            page: readPageFromUrl(url),
            per_page: 20,
            total_count: 0,
            total_pages: 0,
          },
          filters: {},
        },
      }))
    }

    if (url.includes('/api/v1/jobs?') && method === 'GET') {
      counters.jobsList += 1
      counters.jobsUrls.push(url)
      return Promise.resolve(jsonResponse(200, {
        data: [],
        meta: {
          pagination: {
            page: readPageFromUrl(url),
            per_page: 20,
            total_count: 0,
            total_pages: 0,
          },
          filters: {},
        },
      }))
    }

    if (url.includes('/api/v1/uploads/signed-url') && method === 'POST') {
      counters.signedUrl += 1

      if (options.failSignedUrl) {
        return Promise.resolve(jsonResponse(503, {
          error: {
            code: 'dependency_unavailable',
            message: 'signed url indisponivel',
            request_id: 'req_signed_fail',
            trace_id: 'trace_signed_fail',
          },
        }))
      }

      return Promise.resolve(jsonResponse(201, {
        data: {
          storage_key: 'uploads/user_1/2026/04/08/token-input.csv',
          method: 'PUT',
          upload_url: 'http://localhost:9000/signed/upload',
          required_headers: {
            'Content-Type': 'text/csv',
          },
          expires_at: '2026-04-08T12:00:00Z',
        },
      }))
    }

    if (url.includes('http://localhost:9000/signed/upload') && method === 'PUT') {
      counters.signedPut += 1
      return Promise.resolve({
        ok: true,
        status: 200,
        headers: new Headers(),
      } as Response)
    }

    if (url.endsWith('/api/v1/uploads') && method === 'POST') {
      counters.register += 1
      return Promise.resolve(jsonResponse(201, {
        data: {
          upload: {
            id: 'upload_1',
            filename: 'input.csv',
            content_type: 'text/csv',
            byte_size: 7,
            checksum_sha256: 'a'.repeat(64),
            storage_key: 'uploads/user_1/2026/04/08/token-input.csv',
            status: 'registered',
            sensitivity_level: 'internal',
            user_id: 'user_1',
            trace_id: 'trace_upload_1',
            created_at: '2026-04-08T10:00:00Z',
            updated_at: '2026-04-08T10:00:00Z',
          },
          job: {
            id: 'job_1',
            upload_id: 'upload_1',
            requested_by_id: 'user_1',
            source_type: 'upload',
            status: 'pending',
            error_code: null,
            error_category: null,
            quarantined_records_count: 0,
            trace_id: 'trace_job_1',
            created_at: '2026-04-08T10:00:00Z',
            updated_at: '2026-04-08T10:00:00Z',
          },
        },
        meta: {
          idempotent: false,
        },
      }))
    }

    return Promise.resolve(jsonResponse(404, {
      error: {
        code: 'not_found',
        message: `endpoint nao mapeado no mock: ${method} ${url}`,
        request_id: 'req_unknown',
        trace_id: 'trace_unknown',
      },
    }))
  }) as typeof fetch

  return counters
}

describe('UploadPage', () => {
  beforeEach(() => {
    window.localStorage.clear()
    window.sessionStorage.clear()

    storeAuthSession(
      createStoredAuthSession({
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
          access_token: 'token_valid',
          expires_at: '2099-04-07T12:00:00Z',
        },
      }),
    )

    Object.defineProperty(globalThis, 'crypto', {
      value: {
        subtle: {
          digest: vi.fn().mockResolvedValue(new Uint8Array(32).fill(7).buffer),
        },
      },
      configurable: true,
    })
  })

  afterEach(() => {
    global.fetch = originalFetch
    Object.defineProperty(globalThis, 'crypto', { value: originalCrypto, configurable: true })
  })

  it('runs signed-url -> storage put -> register flow and refreshes both lists', async () => {
    const counters = setupUploadApiMock()

    renderUploadPage('/upload')

    await waitFor(() => {
      expect(counters.uploadsList).toBe(1)
      expect(counters.jobsList).toBe(1)
    })

    fireEvent.change(screen.getByLabelText('Arquivo (ZIP ou CSV)'), {
      target: {
        files: [new File(['a,b\n1,2'], 'input.csv', { type: 'text/csv' })],
      },
    })

    fireEvent.click(screen.getByRole('button', { name: 'Enviar arquivo' }))

    await waitFor(() => {
      expect(counters.signedUrl).toBe(1)
      expect(counters.signedPut).toBe(1)
      expect(counters.register).toBe(1)
      expect(counters.uploadsList).toBeGreaterThanOrEqual(2)
      expect(counters.jobsList).toBeGreaterThanOrEqual(2)
    })

    expect(await screen.findByText('Upload upload_1 confirmado e job job_1 criado.')).toBeInTheDocument()
  })

  it('shows explicit error state when signed-url step fails', async () => {
    const counters = setupUploadApiMock({ failSignedUrl: true })

    renderUploadPage('/upload')

    fireEvent.change(screen.getByLabelText('Arquivo (ZIP ou CSV)'), {
      target: {
        files: [new File(['abc'], 'input.csv', { type: 'text/csv' })],
      },
    })

    fireEvent.click(screen.getByRole('button', { name: 'Enviar arquivo' }))

    expect(await screen.findByText('signed url indisponivel (dependency_unavailable)')).toBeInTheDocument()
    expect(screen.getByText('Etapa atual: Erro no fluxo de upload')).toBeInTheDocument()
    expect(counters.register).toBe(0)
    expect(counters.signedPut).toBe(0)
  })

  it('reads upload/job filters and pages from URL query', async () => {
    const counters = setupUploadApiMock()

    renderUploadPage('/upload?upload_status=registered&upload_page=2&job_status=pending&job_page=3')

    await waitFor(() => {
      expect(counters.uploadsUrls[0]).toContain('/api/v1/uploads?status=registered&page=2&per_page=20')
      expect(counters.jobsUrls[0]).toContain('/api/v1/jobs?status=pending&page=3&per_page=20')
    })
  })
})

function jsonResponse(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers({ 'content-type': 'application/json' }),
    json: async () => body,
  } as Response
}

function readPageFromUrl(url: string) {
  const parsed = new URL(url)
  const value = Number.parseInt(parsed.searchParams.get('page') ?? '', 10)
  return Number.isFinite(value) && value > 0 ? value : 1
}
