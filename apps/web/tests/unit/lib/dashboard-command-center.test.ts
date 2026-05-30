import { describe, expect, it } from 'vitest'

import {
  buildDashboardCommandCenterModel,
  buildDashboardExportRows,
} from '@/lib/dashboard-command-center'
import type { AnalyticsDashboardSnapshot, JobSummary, UploadSummary } from '@/lib/streamgate-api'

describe('dashboard command center adapter', () => {
  it('normalizes the current dashboard contract without inventing hidden chart fixtures', () => {
    const model = buildDashboardCommandCenterModel({
      dashboard: currentDashboard(),
      jobs: [
        job({ id: 'job_processing', status: 'processing', upload_id: 'upload_csv' }),
        job({ id: 'job_pending', status: 'pending', upload_id: 'upload_json' }),
        job({ id: 'job_completed', status: 'completed', upload_id: 'upload_done' }),
      ],
      uploads: [
        upload({ id: 'upload_csv', filename: 'input.csv', byte_size: 128 }),
        upload({ id: 'upload_json', filename: 'events.json', content_type: 'application/json', byte_size: 512 }),
      ],
      role: 'admin',
      dismissedAlertIds: [],
    })

    expect(model.kpis.map((kpi) => [kpi.label, kpi.value])).toEqual([
      ['Jobs hoje', '12'],
      ['Concluidos', '8'],
      ['Em processo', '1'],
      ['Falhos', '2'],
      ['Quarentena', '1'],
    ])
    expect(model.timeseries24h.status).toBe('backend-pending')
    expect(model.timeseries24h.points).toEqual([
      expect.objectContaining({ label: 'janela', jobs: 12, failed: 2 }),
    ])
    expect(model.heatmap7d.status).toBe('backend-pending')
    expect(model.jobsBoard.tabs.active.rows).toHaveLength(1)
    expect(model.jobsBoard.tabs.queue.rows).toHaveLength(1)
    expect(model.jobsBoard.tabs.history.rows).toHaveLength(1)
    expect(model.sourceHealth.rows).toContainEqual(expect.objectContaining({
      name: 'warehouse',
      detail: 'clickhouse_unavailable',
    }))
    expect(model.demoState).toBe('data-driven')
  })

  it('uses expanded command center sections when they are present', () => {
    const model = buildDashboardCommandCenterModel({
      dashboard: expandedCommandCenterDashboard(),
      jobs: [],
      uploads: [],
      role: 'admin',
      dismissedAlertIds: [],
    })

    expect(model.timeseries24h.status).toBe('live')
    expect(model.timeseries24h.points).toHaveLength(2)
    expect(model.statusDistribution.rows).toContainEqual(expect.objectContaining({
      status: 'completed',
      count: 21,
      percent: 70,
    }))
    expect(model.heatmap7d.status).toBe('live')
    expect(model.heatmap7d.rows[0].cells[0].value).toBe(12_000)
    expect(model.workers.rows).toContainEqual(expect.objectContaining({
      id: 'worker-01',
      active: true,
      progress: 43,
    }))
    expect(model.alerts.rows).toContainEqual(expect.objectContaining({
      id: 'alert_1',
      persistence: 'persisted',
    }))
  })

  it('keeps operator source health useful without global technical fallback details', () => {
    const adminModel = buildDashboardCommandCenterModel({
      dashboard: currentDashboard(),
      jobs: [],
      uploads: [],
      role: 'admin',
      dismissedAlertIds: [],
    })
    const operatorModel = buildDashboardCommandCenterModel({
      dashboard: currentDashboard(),
      jobs: [],
      uploads: [],
      role: 'operator',
      dismissedAlertIds: [],
    })

    expect(adminModel.sourceHealth.rows.find((row) => row.name === 'warehouse')?.detail).toBe('clickhouse_unavailable')
    expect(operatorModel.sourceHealth.rows.find((row) => row.name === 'warehouse')?.detail).toBe('fallback ativo')
  })

  it('exports masked event log rows from the normalized model', () => {
    const model = buildDashboardCommandCenterModel({
      dashboard: {
        ...currentDashboard(),
        sections: {
          ...currentDashboard().sections,
          event_log: {
            status: 'derived',
            generated_at: '2026-04-24T14:00:00Z',
            empty_state: null,
            data: [
              {
                timestamp: '2026-04-24T13:59:40Z',
                type: 'audit.leak.test',
                severity: 'warning',
                job_id: 'job_1',
                upload_id: 'upload_1',
                status: 'warning',
                message: 'Sensitive key carried in metadata.',
                metadata: { token: 'secret', trace_id: 'trace_1' },
              },
            ],
          },
        },
      } as unknown as AnalyticsDashboardSnapshot,
      jobs: [],
      uploads: [],
      role: 'admin',
      dismissedAlertIds: [],
    })

    expect(buildDashboardExportRows(model, 'event_log')).toEqual([
      expect.objectContaining({
        type: 'audit.leak.test',
        metadata: '{"token":"[masked]","trace_id":"trace_1"}',
      }),
    ])
  })

  it('keeps event log row ids unique when backend events share the same operational key', () => {
    const repeatedEvent = {
      timestamp: '2026-04-24T13:59:40Z',
      type: 'worker_metric',
      severity: 'info',
      job_id: 'job_processing',
      upload_id: 'upload_csv',
      status: 'processed',
      message: 'Worker processed event_fixture_1 with status processed.',
    }
    const model = buildDashboardCommandCenterModel({
      dashboard: {
        ...currentDashboard(),
        sections: {
          ...currentDashboard().sections,
          event_log: {
            status: 'derived',
            generated_at: '2026-04-24T14:00:00Z',
            empty_state: null,
            data: [repeatedEvent, repeatedEvent],
          },
        },
      } as unknown as AnalyticsDashboardSnapshot,
      jobs: [],
      uploads: [],
      role: 'admin',
      dismissedAlertIds: [],
    })

    expect(new Set(model.eventLog.rows.map((row) => row.id)).size).toBe(2)
  })
})

function currentDashboard(): AnalyticsDashboardSnapshot {
  return {
    generated_at: '2026-04-24T14:00:00Z',
    source: 'postgres_derived',
    window: { from: '2026-04-23T14:00:00Z', to: '2026-04-24T14:00:00Z', preset: 'last_24h', timezone: 'UTC' },
    sections: {
      queue: { status: 'derived', generated_at: '2026-04-24T14:00:00Z', data: { processed: 3, retried: 1, moved_to_dlq: 0 }, empty_state: null },
      workers: { status: 'derived', generated_at: '2026-04-24T14:00:00Z', data: { processed: 2, failed_terminal: 0, average_latency_ms: 120 }, empty_state: null },
      throughput: { status: 'derived', generated_at: '2026-04-24T14:00:00Z', data: { jobs_total: 12, uploads_total: 12, completed: 8, failed: 2, quarantined: 1 }, empty_state: null },
      formats: { status: 'derived', generated_at: '2026-04-24T14:00:00Z', data: [{ content_type: 'text/csv', count: 12 }], empty_state: null },
      warnings: { status: 'derived', generated_at: '2026-04-24T14:00:00Z', data: { open: 1, failed: 2, resolved: 3 }, empty_state: null },
      event_log: {
        status: 'derived',
        generated_at: '2026-04-24T14:00:00Z',
        data: [
          {
            timestamp: '2026-04-24T13:59:40Z',
            type: 'worker_metric',
            severity: 'info',
            job_id: 'job_processing',
            upload_id: 'upload_csv',
            status: 'processed',
            message: 'Worker processed event_fixture_1 with status processed.',
          },
        ],
        empty_state: null,
      },
    },
    dependencies: {
      broker: { status: 'healthy' },
      warehouse: { status: 'degraded', source: 'postgres_derived', fallback_reason: 'clickhouse_unavailable' },
    },
    slo: {
      slo_target_seconds: 300,
      last_event_at: '2026-04-24T13:59:40Z',
      lag_seconds: 20,
      stale: false,
      p95_ms: 240,
      error_budget_percent: 99.9,
    },
  }
}

function expandedCommandCenterDashboard(): AnalyticsDashboardSnapshot {
  return {
    ...currentDashboard(),
    source: 'clickhouse',
    sections: {
      ...currentDashboard().sections,
      timeseries_24h: {
        status: 'live',
        generated_at: '2026-04-24T14:00:00Z',
        empty_state: null,
        data: [
          { label: '13h', records: 42_000, volume_gb: 0.8, jobs: 10, failed: 1 },
          { label: '14h', records: 30_000, volume_gb: 0.5, jobs: 8, failed: 0 },
        ],
      },
      status_distribution: {
        status: 'live',
        generated_at: '2026-04-24T14:00:00Z',
        empty_state: null,
        data: [
          { status: 'completed', count: 21 },
          { status: 'processing', count: 6 },
          { status: 'failed', count: 3 },
        ],
      },
      heatmap_7d: {
        status: 'live',
        generated_at: '2026-04-24T14:00:00Z',
        empty_state: null,
        data: {
          rows: [
            { range: '00-03', values: [12_000, 4_000, 0, 0, 0, 0, 0] },
          ],
          days: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'],
        },
      },
      workers_live: {
        status: 'live',
        generated_at: '2026-04-24T14:00:00Z',
        empty_state: null,
        data: [
          { id: 'worker-01', status: 'active', current_job_id: 'job_1', current_label: 'batch 3/7', progress: 43, active: true },
        ],
      },
      alerts: {
        status: 'degraded',
        generated_at: '2026-04-24T14:00:00Z',
        empty_state: null,
        data: [
          { id: 'alert_1', title: 'Quarentena aberta', message: '1 registro precisa de triagem.', severity: 'warning', href: '/quarantine' },
        ],
      },
    },
  } as unknown as AnalyticsDashboardSnapshot
}

function job(overrides: Partial<JobSummary> = {}): JobSummary {
  return {
    id: 'job_1',
    upload_id: 'upload_1',
    requested_by_id: 'user_1',
    source_type: 'upload',
    status: 'processing',
    error_code: null,
    error_category: null,
    quarantined_records_count: 0,
    trace_id: 'trace_1',
    created_at: '2026-04-24T13:00:00Z',
    updated_at: '2026-04-24T13:10:00Z',
    ...overrides,
  }
}

function upload(overrides: Partial<UploadSummary> = {}): UploadSummary {
  return {
    id: 'upload_1',
    filename: 'input.csv',
    content_type: 'text/csv',
    byte_size: 128,
    checksum_sha256: 'a'.repeat(64),
    storage_key: 'uploads/input.csv',
    source_type: 'upload',
    status: 'registered',
    sensitivity_level: 'internal',
    user_id: 'user_1',
    trace_id: 'trace_1',
    created_at: '2026-04-24T13:00:00Z',
    updated_at: '2026-04-24T13:10:00Z',
    ...overrides,
  }
}
