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
    publicLink: 0,
    signedPut: 0,
    uploadsUrls: [] as string[],
    jobsUrls: [] as string[],
    lastPublicLinkBody: null as Record<string, unknown> | null,
    lastIdempotencyKey: null as string | null,
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

    if (url.endsWith('/api/v1/uploads/public-link') && method === 'POST') {
      counters.publicLink += 1
      counters.lastPublicLinkBody = JSON.parse(String(init?.body ?? '{}')) as Record<string, unknown>
      counters.lastIdempotencyKey = readHeader(init?.headers, 'Idempotency-Key')
      return Promise.resolve(jsonResponse(202, {
        data: {
          upload: {
            id: 'upload_link_1',
            filename: 'remote.csv',
            content_type: 'text/csv',
            byte_size: 128,
            checksum_sha256: 'b'.repeat(64),
            storage_key: 'uploads/user_1/public-link/remote.csv',
            source_type: 'external_link',
            status: 'registered',
            sensitivity_level: 'internal',
            user_id: 'user_1',
            trace_id: 'trace_link_1',
            created_at: '2026-04-08T10:00:00Z',
            updated_at: '2026-04-08T10:00:00Z',
          },
          job: {
            id: 'job_link_1',
            upload_id: 'upload_link_1',
            requested_by_id: 'user_1',
            source_type: 'external_link',
            status: 'pending',
            error_code: null,
            error_category: null,
            quarantined_records_count: 0,
            trace_id: 'trace_link_job_1',
            created_at: '2026-04-08T10:00:00Z',
            updated_at: '2026-04-08T10:00:00Z',
          },
          acquisition: {
            id: 'acq_link_1',
            upload_id: 'upload_link_1',
            job_id: 'job_link_1',
            source_type: 'public_link',
            link_mode: 'public_link',
            status: 'requested',
            url_masked: 'https://example.test/files/remote.csv',
            url_hash: 'hash_fixture',
            source_host: 'example.test',
            content_type: 'text/csv',
            byte_size: 128,
            requested_at: '2026-04-08T10:00:00Z',
            completed_at: null,
            trace_id: 'trace_acq_1',
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

  it('creates a public-link upload without exposing future connector modes', async () => {
    const counters = setupUploadApiMock()

    renderUploadPage('/upload')

    fireEvent.click(await screen.findByRole('button', { name: 'Link publico' }))
    fireEvent.change(screen.getByLabelText('URL publica'), {
      target: { value: 'https://example.test/files/remote.csv' },
    })
    fireEvent.change(screen.getByLabelText('Nome do arquivo'), {
      target: { value: 'remote.csv' },
    })
    fireEvent.change(screen.getByLabelText('Tamanho estimado (bytes)'), {
      target: { value: '128' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Criar upload por link' }))

    await waitFor(() => {
      expect(counters.publicLink).toBe(1)
      expect(counters.signedUrl).toBe(0)
      expect(counters.signedPut).toBe(0)
      expect(counters.register).toBe(0)
    })

    expect(counters.lastIdempotencyKey).toMatch(/^public-link-/)
    expect(counters.lastPublicLinkBody).toEqual({
      public_link: {
        url: 'https://example.test/files/remote.csv',
        filename: 'remote.csv',
        content_type: 'text/csv',
        byte_size: 128,
      },
    })
    expect(await screen.findByText('Link publico aceito: upload upload_link_1 e job job_link_1 criados.')).toBeInTheDocument()
    expect(screen.getByText('https://example.test/files/remote.csv')).toBeInTheDocument()
    expect(screen.queryByText(/google_drive|oauth_delegated|s3|http_url/i)).not.toBeInTheDocument()
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

function readHeader(headers: HeadersInit | undefined, name: string) {
  if (!headers) return null

  const target = name.toLowerCase()
  if (headers instanceof Headers) {
    return headers.get(name)
  }

  if (Array.isArray(headers)) {
    return headers.find(([key]) => key.toLowerCase() === target)?.[1] ?? null
  }

  return Object.entries(headers).find(([key]) => key.toLowerCase() === target)?.[1] ?? null
}
