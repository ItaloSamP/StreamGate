
import type { JobSummary, UploadSummary } from '@/lib/streamgate-api'

export type UploadMode = 'file' | 'public_link' | 'connector'
export type UploadFlowState = 'idle' | 'signing' | 'uploading' | 'confirming' | 'requesting_link' | 'requesting_connector' | 'success' | 'error'

export type ListState<T> = {
  status: 'loading' | 'success' | 'empty' | 'error'
  rows: T[]
  pagination: {
    page: number
    per_page: number
    total_count: number
    total_pages: number
  }
  errorMessage: string | null
}
