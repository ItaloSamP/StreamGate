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

  it('maps signed-url payload and endpoint for upload presign flow', async () => {
    const postEnvelope = vi.fn().mockResolvedValue({
      data: {
        storage_key: 'uploads/user_1/2026/04/08/token-import.csv',
        method: 'PUT',
        upload_url: 'http://localhost:9000/bucket/signed',
        required_headers: { 'Content-Type': 'text/csv' },
        expires_at: '2026-04-08T12:00:00Z',
      },
    })

    const api = createStreamgateApi({
      get: vi.fn(),
      post: vi.fn(),
      postEnvelope,
    })

    await api.requestUploadSignedUrl({
      filename: 'import.csv',
      contentType: 'text/csv',
      byteSize: 2048,
      checksumSha256: 'a'.repeat(64),
    })

    expect(postEnvelope).toHaveBeenCalledWith('/api/v1/uploads/signed-url', {
      body: {
        upload: {
          filename: 'import.csv',
          content_type: 'text/csv',
          byte_size: 2048,
          checksum_sha256: 'a'.repeat(64),
        },
      },
    })
  })

  it('maps register upload payload and keeps idempotent meta', async () => {
    const postEnvelope = vi.fn().mockResolvedValue({
      data: {
        upload: { id: 'upload_1', status: 'registered' },
        job: { id: 'job_1', status: 'pending' },
      },
      meta: {
        idempotent: true,
      },
    })

    const api = createStreamgateApi({
      get: vi.fn(),
      post: vi.fn(),
      postEnvelope,
    })

    const response = await api.registerUpload({
      filename: 'import.csv',
      contentType: 'text/csv',
      byteSize: 2048,
      checksumSha256: 'b'.repeat(64),
      storageKey: 'uploads/user_1/2026/04/08/token-import.csv',
      metadata: { source: 'workspace' },
    })

    expect(postEnvelope).toHaveBeenCalledWith('/api/v1/uploads', {
      body: {
        upload: {
          filename: 'import.csv',
          content_type: 'text/csv',
          byte_size: 2048,
          checksum_sha256: 'b'.repeat(64),
          storage_key: 'uploads/user_1/2026/04/08/token-import.csv',
          metadata: { source: 'workspace' },
        },
      },
    })

    expect(response.meta?.idempotent).toBe(true)
  })

  it('maps public-link upload payload with idempotency headers', async () => {
    const postEnvelope = vi.fn().mockResolvedValue({
      data: {
        upload: { id: 'upload_public_link', source_type: 'external_link' },
        job: { id: 'job_public_link', source_type: 'external_link' },
        acquisition: {
          id: 'acq_public_link',
          url_masked: 'https://data.example.com/export.csv',
          source_host: 'data.example.com',
        },
      },
      meta: { idempotent: true },
    })

    const api = createStreamgateApi({
      get: vi.fn(),
      post: vi.fn(),
      postEnvelope,
    })

    const response = await api.createPublicLinkUpload({
      url: 'https://data.example.com/export.csv?token=secret',
      filename: 'export.csv',
      contentType: 'text/csv',
      byteSize: 1024,
      idempotencyKey: 'idem-public-link',
    })

    expect(postEnvelope).toHaveBeenCalledWith('/api/v1/uploads/public-link', {
      body: {
        public_link: {
          url: 'https://data.example.com/export.csv?token=secret',
          filename: 'export.csv',
          content_type: 'text/csv',
          byte_size: 1024,
        },
      },
      headers: { 'Idempotency-Key': 'idem-public-link' },
    })
    expect(response.data.acquisition?.url_masked).toBe('https://data.example.com/export.csv')
    expect(response.meta?.idempotent).toBe(true)
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

  it('aligns operational endpoints with api v1 and keeps query shape stable', async () => {
    const getEnvelope = vi.fn()
      .mockResolvedValueOnce({
        data: {
          window: { from: '2026-04-06T00:00:00Z', to: '2026-04-13T00:00:00Z', preset: 'last_7d', timezone: 'UTC' },
          kpis: {
            uploads_total: 2,
            jobs_total: 2,
            jobs_processing: 1,
            jobs_completed: 1,
            jobs_failed: 0,
            jobs_quarantined: 0,
            quarantine_records_total: 0,
            audit_events_total: 3,
          },
          breakdowns: { status: [], actor: [], source: [] },
        },
      })
      .mockResolvedValueOnce({ data: [{ id: 'quarantine_1', severity: 'warning' }] })
      .mockResolvedValueOnce({ data: [{ id: 'audit_1', action: 'upload.registered' }] })
      .mockResolvedValueOnce({ data: [{ routing_key: 'upload.received.v1.dlq', retry_count: 3, headers: {}, payload: {} }] })

    const api = createStreamgateApi({
      get: vi.fn(),
      post: vi.fn(),
      getEnvelope,
    })

    await api.getAnalytics({ preset: 'last_7d', timezone: 'UTC', sort_by: 'count', sort_order: 'desc' })
    await api.listQuarantine({ preset: 'last_24h', severity: 'warning', page: 2, per_page: 20, sort_by: 'created_at', sort_order: 'desc' })
    await api.listAuditEvents({ preset: 'last_30d', actor_id: 'user_1', search: 'upload', page: 1, per_page: 20 })
    await api.listQuarantineDlq({ dead_letter_reason: 'max_retries_exceeded', sort_by: 'retry_count', sort_order: 'desc' })

    expect(getEnvelope).toHaveBeenNthCalledWith(1, '/api/v1/analytics', {
      query: {
        preset: 'last_7d',
        from: undefined,
        to: undefined,
        timezone: 'UTC',
        sort_by: 'count',
        sort_order: 'desc',
        page: undefined,
        per_page: undefined,
        search: undefined,
      },
    })

    expect(getEnvelope).toHaveBeenNthCalledWith(2, '/api/v1/quarantine', {
      query: expect.objectContaining({
        preset: 'last_24h',
        severity: 'warning',
        page: 2,
        per_page: 20,
        sort_by: 'created_at',
        sort_order: 'desc',
      }),
    })

    expect(getEnvelope).toHaveBeenNthCalledWith(3, '/api/v1/audit', {
      query: expect.objectContaining({
        preset: 'last_30d',
        actor_id: 'user_1',
        search: 'upload',
        page: 1,
        per_page: 20,
      }),
    })

    expect(getEnvelope).toHaveBeenNthCalledWith(4, '/api/v1/quarantine/dlq', {
      query: expect.objectContaining({
        dead_letter_reason: 'max_retries_exceeded',
        sort_by: 'retry_count',
        sort_order: 'desc',
      }),
    })
  })

  it('maps analytics dashboard, warehouse and lineage endpoints', async () => {
    const getEnvelope = vi.fn()
      .mockResolvedValueOnce({
        data: {
          generated_at: '2026-04-24T14:00:00Z',
          source: 'postgres_derived',
          window: { from: '2026-04-23T14:00:00Z', to: '2026-04-24T14:00:00Z', preset: 'last_24h', timezone: 'UTC' },
          sections: {
            queue: { status: 'derived', generated_at: '2026-04-24T14:00:00Z', data: { processed: 2, retried: 0, moved_to_dlq: 0 }, empty_state: null },
            workers: { status: 'derived', generated_at: '2026-04-24T14:00:00Z', data: { processed: 2, failed_terminal: 0, average_latency_ms: 120 }, empty_state: null },
            throughput: { status: 'derived', generated_at: '2026-04-24T14:00:00Z', data: { jobs_total: 2, uploads_total: 2, completed: 1, failed: 0, quarantined: 1 }, empty_state: null },
            formats: { status: 'derived', generated_at: '2026-04-24T14:00:00Z', data: [{ content_type: 'text/csv', count: 2 }], empty_state: null },
            warnings: { status: 'empty', generated_at: '2026-04-24T14:00:00Z', data: { open: 0, failed: 0, resolved: 0 }, empty_state: 'no_data_in_window' },
            event_log: { status: 'derived', generated_at: '2026-04-24T14:00:00Z', data: [], empty_state: null },
          },
          dependencies: { broker: { status: 'healthy' }, warehouse: { status: 'degraded', source: 'postgres_derived', fallback_reason: 'clickhouse_unavailable' } },
          slo: { slo_target_seconds: 300, last_event_at: '2026-04-24T13:59:40Z', lag_seconds: 20, stale: false, p95_ms: 240, error_budget_percent: 99.9 },
        },
      })
      .mockResolvedValueOnce({
        data: {
          source: 'clickhouse',
          generated_at: '2026-04-24T14:00:00Z',
          aggregates: {
            jobs_total: 2,
            uploads_total: 2,
            records_total: 1200,
            valid_records: 1188,
            invalid_records: 12,
            by_status: { completed: 1, quarantined_with_warnings: 1 },
            by_source: { upload: 1, external_link: 1 },
          },
        },
      })
      .mockResolvedValueOnce({
        data: {
          job: { id: 'job_1', upload_id: 'upload_1', source_type: 'upload', status: 'completed' },
          upload: { id: 'upload_1', filename: 'input.csv' },
          batches: [],
          attempts: [],
          quarantine: [],
          artifacts: [],
          warnings: [],
          audit_refs: [],
        },
      })

    const api = createStreamgateApi({ get: vi.fn(), post: vi.fn(), getEnvelope })

    await api.getAnalyticsDashboard({ preset: 'last_24h', timezone: 'UTC' })
    await api.getAnalyticsWarehouse({ preset: 'last_24h', timezone: 'UTC' })
    await api.getAnalyticsLineage('job_1')

    expect(getEnvelope).toHaveBeenNthCalledWith(1, '/api/v1/analytics/dashboard', {
      query: expect.objectContaining({ preset: 'last_24h', timezone: 'UTC' }),
    })
    expect(getEnvelope).toHaveBeenNthCalledWith(2, '/api/v1/analytics/warehouse', {
      query: expect.objectContaining({ preset: 'last_24h', timezone: 'UTC' }),
    })
    expect(getEnvelope).toHaveBeenNthCalledWith(3, '/api/v1/analytics/lineage', {
      query: { job_id: 'job_1' },
    })
  })

  it('maps realtime, dashboard export and alert action endpoints', async () => {
    const getEnvelope = vi.fn().mockResolvedValue({
      data: [
        {
          id: 'realtime_1',
          event_type: 'job.completed',
          severity: 'info',
          payload: { token: '[masked]' },
          occurred_at: '2026-04-24T14:00:00Z',
        },
      ],
    })
    const postEnvelope = vi.fn()
      .mockResolvedValueOnce({ data: { ticket: 'ticket_1', organization_id: 'org_1', role: 'admin', expires_at: '2026-04-24T14:01:00Z' } })
      .mockResolvedValueOnce({ data: { id: 'export_1', filename: 'streamgate-dashboard-snapshot.csv', content_type: 'text/csv', content: 'label,value\njobs,12\n' } })
      .mockResolvedValueOnce({ data: { id: 'alert_1', status: 'reviewed' } })
      .mockResolvedValueOnce({ data: { id: 'alert_1', status: 'dismissed' } })
    const api = createStreamgateApi({ get: vi.fn(), post: vi.fn(), getEnvelope, postEnvelope })

    await api.createRealtimeTicket()
    await api.listRealtimeEvents({ since: '2026-04-24T13:59:00Z', limit: 25 })
    await api.createDashboardExport({ kind: 'snapshot', format: 'csv', preset: 'last_24h', timezone: 'UTC', idempotencyKey: 'idem-export' })
    await api.reviewAlert('alert_1', { reason: 'Triagem operacional concluida.', idempotencyKey: 'idem-review' })
    await api.dismissAlert('alert_1', { reason: 'Alerta conhecido e resolvido.', idempotencyKey: 'idem-dismiss' })

    expect(postEnvelope).toHaveBeenNthCalledWith(1, '/api/v1/realtime/tickets')
    expect(getEnvelope).toHaveBeenCalledWith('/api/v1/realtime/events', {
      query: { since: '2026-04-24T13:59:00Z', limit: 25 },
    })
    expect(postEnvelope).toHaveBeenNthCalledWith(2, '/api/v1/analytics/dashboard/exports', {
      body: { export: { kind: 'snapshot', format: 'csv', preset: 'last_24h', timezone: 'UTC' } },
      headers: { 'Idempotency-Key': 'idem-export' },
    })
    expect(postEnvelope).toHaveBeenNthCalledWith(3, '/api/v1/alerts/alert_1/review', {
      body: { operation: { reason: 'Triagem operacional concluida.' } },
      headers: { 'Idempotency-Key': 'idem-review' },
    })
    expect(postEnvelope).toHaveBeenNthCalledWith(4, '/api/v1/alerts/alert_1/dismiss', {
      body: { operation: { reason: 'Alerta conhecido e resolvido.' } },
      headers: { 'Idempotency-Key': 'idem-dismiss' },
    })
  })

  it('maps connector profile and ingestion endpoints without exposing secret shape in responses', async () => {
    const getEnvelope = vi.fn().mockResolvedValue({
      data: [
        { id: 'conn_1', kind: 's3', name: 'finance-s3', status: 'active', settings: { bucket: '[masked]' } },
      ],
    })
    const postEnvelope = vi.fn()
      .mockResolvedValueOnce({ data: { id: 'conn_1', kind: 's3', name: 'finance-s3', status: 'active', settings: { bucket: '[masked]' } } })
      .mockResolvedValueOnce({ data: { id: 'conn_1', kind: 's3', status: 'configured' } })
      .mockResolvedValueOnce({ data: { upload: { id: 'upload_connector' }, job: { id: 'job_connector' }, ingestion: { id: 'ing_connector' }, lease: { id: 'lease_1', token: 'lease-token', expires_at: '2026-04-24T14:05:00Z' } } })
    const patchEnvelope = vi.fn().mockResolvedValue({ data: { id: 'conn_1', status: 'disabled' } })
    const api = createStreamgateApi({ get: vi.fn(), post: vi.fn(), getEnvelope, postEnvelope, patchEnvelope })

    await api.listConnectorProfiles()
    await api.createConnectorProfile({
      name: 'finance-s3',
      kind: 's3',
      settings: { region: 'us-east-1', bucket: 'finance' },
      secrets: { access_key_id: 'AKIASECRET', secret_access_key: 'top-secret' },
      idempotencyKey: 'idem-profile',
    })
    await api.updateConnectorProfile('conn_1', { status: 'disabled', idempotencyKey: 'idem-profile-update' })
    await api.testConnectorProfile('conn_1')
    await api.createConnectorIngestion('conn_1', {
      filename: 'orders.ndjson',
      contentType: 'application/x-ndjson',
      objectKey: 'incoming/orders.ndjson',
      idempotencyKey: 'idem-ingestion',
    })

    expect(getEnvelope).toHaveBeenCalledWith('/api/v1/connectors/profiles')
    expect(postEnvelope).toHaveBeenNthCalledWith(1, '/api/v1/connectors/profiles', {
      body: {
        connector_profile: {
          name: 'finance-s3',
          kind: 's3',
          settings: { region: 'us-east-1', bucket: 'finance' },
          secrets: { access_key_id: 'AKIASECRET', secret_access_key: 'top-secret' },
        },
      },
      headers: { 'Idempotency-Key': 'idem-profile' },
    })
    expect(patchEnvelope).toHaveBeenCalledWith('/api/v1/connectors/profiles/conn_1', {
      body: { connector_profile: { status: 'disabled' } },
      headers: { 'Idempotency-Key': 'idem-profile-update' },
    })
    expect(postEnvelope).toHaveBeenNthCalledWith(2, '/api/v1/connectors/profiles/conn_1/test')
    expect(postEnvelope).toHaveBeenNthCalledWith(3, '/api/v1/connectors/profiles/conn_1/ingestions', {
      body: {
        ingestion: {
          filename: 'orders.ndjson',
          content_type: 'application/x-ndjson',
          object_key: 'incoming/orders.ndjson',
        },
      },
      headers: { 'Idempotency-Key': 'idem-ingestion' },
    })
  })

  it('maps operational mutations and artifacts with idempotency headers', async () => {
    const postEnvelope = vi.fn()
      .mockResolvedValueOnce({ data: { status: 'retry_requested' } })
      .mockResolvedValueOnce({ data: { resolution_status: 'resolved' } })
      .mockResolvedValueOnce({ data: { id: 'replay_1', status: 'requested' } })
      .mockResolvedValueOnce({ data: { id: 'replay_1', status: 'approved' } })
      .mockResolvedValueOnce({ data: { id: 'replay_1', status: 'executed' } })
      .mockResolvedValueOnce({ data: { artifact_id: 'artifact_1', download_url: 'https://signed.test', expires_at: '2026-04-20T12:00:00Z' } })
    const getEnvelope = vi.fn().mockResolvedValue({ data: [{ id: 'artifact_1', artifact_type: 'quality_report' }] })
    const api = createStreamgateApi({ get: vi.fn(), post: vi.fn(), getEnvelope, postEnvelope })

    await api.retryJob('job_1', { reason: 'Reprocessar com seguranca.', idempotencyKey: 'idem-retry' })
    await api.resolveQuarantine('quarantine_1', { reason: 'Registro revisado manualmente.', idempotencyKey: 'idem-resolve' })
    await api.createDlqReplayRequest('message_1', { reason: 'Replay inspecionado.', idempotencyKey: 'idem-request', payload: { event_name: 'upload.received.v1' } })
    await api.approveDlqReplayRequest('replay_1', { reason: 'Aprovado por admin.', idempotencyKey: 'idem-approve' })
    await api.executeDlqReplayRequest('replay_1', { reason: 'Executar aprovado.', idempotencyKey: 'idem-execute' })
    await api.listJobArtifacts('job_1')
    await api.createArtifactDownloadUrl('job_1', 'artifact_1')

    expect(postEnvelope).toHaveBeenNthCalledWith(1, '/api/v1/jobs/job_1/retry', expect.objectContaining({ headers: { 'Idempotency-Key': 'idem-retry' } }))
    expect(postEnvelope).toHaveBeenNthCalledWith(2, '/api/v1/quarantine/quarantine_1/resolve', expect.objectContaining({ headers: { 'Idempotency-Key': 'idem-resolve' } }))
    expect(postEnvelope).toHaveBeenNthCalledWith(3, '/api/v1/quarantine/dlq/message_1/replay-requests', expect.objectContaining({ headers: { 'Idempotency-Key': 'idem-request' } }))
    expect(postEnvelope).toHaveBeenNthCalledWith(4, '/api/v1/dlq-replay-requests/replay_1/approve', expect.objectContaining({ headers: { 'Idempotency-Key': 'idem-approve' } }))
    expect(postEnvelope).toHaveBeenNthCalledWith(5, '/api/v1/dlq-replay-requests/replay_1/execute', expect.objectContaining({ headers: { 'Idempotency-Key': 'idem-execute' } }))
    expect(getEnvelope).toHaveBeenCalledWith('/api/v1/jobs/job_1/artifacts')
    expect(postEnvelope).toHaveBeenNthCalledWith(6, '/api/v1/jobs/job_1/artifacts/artifact_1/download-url')
  })

  it('maps notification inbox, bulk actions, settings and webhook test', async () => {
    const getEnvelope = vi.fn()
      .mockResolvedValueOnce({ data: [{ id: 'notification_1', status: 'unread' }] })
      .mockResolvedValueOnce({ data: { id: 'notifset_1', in_app_enabled: true } })
    const patchEnvelope = vi.fn()
      .mockResolvedValueOnce({ data: { id: 'notification_1', status: 'read' } })
      .mockResolvedValueOnce({ data: { id: 'notification_1', status: 'archived' } })
      .mockResolvedValueOnce({ data: { id: 'notification_1', status: 'read' } })
      .mockResolvedValueOnce({ data: { updated_count: 2 } })
      .mockResolvedValueOnce({ data: { archived_count: 1 } })
      .mockResolvedValueOnce({ data: { id: 'notifset_1', webhook_enabled: true } })
    const deleteEnvelope = vi.fn().mockResolvedValue({ data: { deleted: true, id: 'notification_1' } })
    const postEnvelope = vi.fn().mockResolvedValue({ data: { id: 'delivery_1', status: 'pending' } })
    const api = createStreamgateApi({ get: vi.fn(), post: vi.fn(), getEnvelope, postEnvelope, patchEnvelope, deleteEnvelope })

    await api.listNotifications({ status: 'unread' })
    await api.getNotificationSettings()
    await api.markNotificationRead('notification_1')
    await api.archiveNotification('notification_1')
    await api.unarchiveNotification('notification_1')
    await api.markAllNotificationsRead('active')
    await api.bulkArchiveNotifications(['notification_1'])
    await api.updateNotificationSettings({ inAppEnabled: true, emailEnabled: false, webhookEnabled: true, webhookUrl: 'https://hooks.test/streamgate' })
    await api.deleteNotification('notification_1')
    await api.testWebhookNotification({ reason: 'Validar canal configurado.', idempotencyKey: 'idem-webhook' })

    expect(getEnvelope).toHaveBeenNthCalledWith(1, '/api/v1/notifications', { query: { status: 'unread' } })
    expect(getEnvelope).toHaveBeenNthCalledWith(2, '/api/v1/notification-settings')
    expect(patchEnvelope).toHaveBeenNthCalledWith(1, '/api/v1/notifications/notification_1/read', undefined)
    expect(patchEnvelope).toHaveBeenNthCalledWith(4, '/api/v1/notifications/mark-all-read', { query: { status: 'active' } })
    expect(patchEnvelope).toHaveBeenNthCalledWith(5, '/api/v1/notifications/bulk-archive', { body: { notifications: { ids: ['notification_1'] } } })
    expect(patchEnvelope).toHaveBeenNthCalledWith(6, '/api/v1/notification-settings', {
      body: {
        notification_setting: {
          in_app_enabled: true,
          email_enabled: false,
          webhook_enabled: true,
          webhook_url: 'https://hooks.test/streamgate',
        },
      },
    })
    expect(deleteEnvelope).toHaveBeenCalledWith('/api/v1/notifications/notification_1', undefined)
    expect(postEnvelope).toHaveBeenCalledWith('/api/v1/notification-settings/webhook/test', expect.objectContaining({ headers: { 'Idempotency-Key': 'idem-webhook' } }))
  })
})
