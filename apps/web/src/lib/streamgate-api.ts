import { apiClient } from '@/lib/api-client'

export type HealthResponse = {
  status: string
}

export type JobSummary = {
  id: string
  upload_id: string
  requested_by_id: string
  source_type: string
  status: string
  error_code: string | null
  error_category: string | null
  quarantined_records_count: number
  trace_id: string
  created_at: string | null
  updated_at: string | null
}

export type UploadSummary = {
  id: string
  filename: string
  content_type: string
  byte_size: number
  checksum_sha256: string
  storage_key: string
  status: string
  sensitivity_level: string
  user_id: string
  trace_id: string
  created_at: string | null
  updated_at: string | null
}

export const streamgateApi = {
  health: () => apiClient.get<HealthResponse>('/up'),
  listJobs: (query?: Record<string, string | number | boolean | null | undefined>) =>
    apiClient.get<JobSummary[]>('/jobs', { query }),
  listUploads: (query?: Record<string, string | number | boolean | null | undefined>) =>
    apiClient.get<UploadSummary[]>('/uploads', { query }),
}
