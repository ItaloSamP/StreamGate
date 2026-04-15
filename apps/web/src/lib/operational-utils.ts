import { ApiClientError } from '@/lib/api-client'

export const DEFAULT_OPERATIONAL_PRESET = 'last_7d'
export const DEFAULT_OPERATIONAL_TIMEZONE = 'UTC'
export const DEFAULT_OPERATIONAL_PAGE = 1
export const DEFAULT_OPERATIONAL_PER_PAGE = 20
export const DEFAULT_STALE_MINUTES = 5

const SENSITIVE_KEY_PATTERN = /(password|token|secret|credential|authorization|cookie|cpf|ssn|document|email|phone)/i

export type OperationalQueryState = {
  preset: string
  from?: string
  to?: string
  timezone: string
  page: number
  per_page: number
  sort_by?: string
  sort_order: 'asc' | 'desc'
  search?: string
}

export function readOperationalQueryState(params: URLSearchParams): OperationalQueryState {
  return {
    preset: readString(params, 'preset') ?? DEFAULT_OPERATIONAL_PRESET,
    from: readString(params, 'from'),
    to: readString(params, 'to'),
    timezone: readString(params, 'timezone') ?? DEFAULT_OPERATIONAL_TIMEZONE,
    page: readPositiveInteger(params, 'page', DEFAULT_OPERATIONAL_PAGE),
    per_page: readPositiveInteger(params, 'per_page', DEFAULT_OPERATIONAL_PER_PAGE),
    sort_by: readString(params, 'sort_by'),
    sort_order: readSortOrder(params.get('sort_order')),
    search: readString(params, 'search'),
  }
}

export function buildOperationalQuery<T extends Record<string, string | number | boolean | null | undefined>>(query: T) {
  return Object.fromEntries(
    Object.entries(query).filter(([, value]) => value !== undefined && value !== null && value !== ''),
  ) as Partial<T>
}

export function writeOperationalQueryState(
  current: URLSearchParams,
  next: Partial<OperationalQueryState> & Record<string, string | number | undefined | null>,
) {
  const params = new URLSearchParams(current)

  Object.entries(next).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '' || (key === 'page' && value === 1)) {
      params.delete(key)
      return
    }

    params.set(key, String(value))
  })

  return params
}

export function maskOperationalPayload(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => maskOperationalPayload(entry))
  }

  if (!value || typeof value !== 'object') {
    return value
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
      key,
      SENSITIVE_KEY_PATTERN.test(key) ? '[masked]' : maskOperationalPayload(entry),
    ]),
  )
}

export function buildCsv(rows: Record<string, unknown>[], headers: string[]) {
  const headerLine = headers.map(escapeCsvCell).join(',')
  const bodyLines = rows.map((row) =>
    headers
      .map((header) => {
        const masked = maskOperationalPayload({ [header]: row[header] }) as Record<string, unknown>
        return escapeCsvCell(masked[header])
      })
      .join(','),
  )

  return [headerLine, ...bodyLines].join('\r\n')
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export async function copyText(value: string) {
  if (!navigator.clipboard) {
    throw new Error('Clipboard indisponivel neste navegador.')
  }

  await navigator.clipboard.writeText(value)
}

export function shouldMarkStale(lastUpdatedAt: Date | null, staleMinutes = DEFAULT_STALE_MINUTES) {
  if (!lastUpdatedAt) return false

  return Date.now() - lastUpdatedAt.getTime() > staleMinutes * 60 * 1000
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return '--'

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return '--'

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(parsed)
}

export function formatNumber(value: number | null | undefined) {
  return new Intl.NumberFormat('pt-BR').format(value ?? 0)
}

export function humanizeOperationalError(error: unknown, fallback: string) {
  if (error instanceof ApiClientError) {
    const details = error.details
      .map((detail) => `${detail.field ? `${detail.field}: ` : ''}${detail.reason}`)
      .join('; ')

    return `${error.message} (${error.code})${details ? ` ${details}` : ''}`
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message
  }

  return fallback
}

function readString(params: URLSearchParams, key: string) {
  const value = params.get(key)?.trim()
  return value && value.length > 0 ? value : undefined
}

function readPositiveInteger(params: URLSearchParams, key: string, fallback: number) {
  const parsed = Number.parseInt(params.get(key) ?? '', 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function readSortOrder(value: string | null): 'asc' | 'desc' {
  return value === 'asc' ? 'asc' : 'desc'
}

function escapeCsvCell(value: unknown) {
  const text = value === undefined || value === null ? '' : typeof value === 'object' ? JSON.stringify(value) : String(value)
  const escaped = text.replaceAll('"', '""')

  return /[",\r\n]/.test(escaped) ? `"${escaped}"` : escaped
}
