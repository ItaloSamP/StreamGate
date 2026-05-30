import {
  streamgateApi,
  type UploadContentType,
  type UploadRegisterResponse,
} from '@/lib/streamgate-api'
import type { ApiSuccessEnvelope } from '@/lib/api-client'

export type SignedUploadStep = 'signing' | 'uploading' | 'confirming'

export function inferUploadContentType(file: File): UploadContentType | null {
  const lowerName = file.name.toLowerCase()
  const normalizedType = file.type.toLowerCase().trim()

  if (lowerName.endsWith('.zip') || normalizedType === 'application/zip' || normalizedType === 'application/x-zip-compressed') {
    return 'application/zip'
  }

  if (lowerName.endsWith('.csv') || normalizedType === 'text/csv' || normalizedType === 'application/csv') {
    return 'text/csv'
  }

  if (lowerName.endsWith('.json') || normalizedType === 'application/json') {
    return 'application/json'
  }

  if (lowerName.endsWith('.ndjson') || lowerName.endsWith('.jsonl') || normalizedType === 'application/x-ndjson' || normalizedType === 'application/ndjson') {
    return 'application/x-ndjson'
  }

  if (lowerName.endsWith('.xlsx') || normalizedType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
    return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  }

  if (lowerName.endsWith('.parquet') || normalizedType === 'application/vnd.apache.parquet') {
    return 'application/vnd.apache.parquet'
  }

  return null
}

export async function computeChecksumSha256(file: File) {
  const subtle = globalThis.crypto?.subtle

  if (!subtle) {
    throw new Error('Ambiente sem suporte a SHA-256 no navegador.')
  }

  const buffer = await file.arrayBuffer()
  const hashBuffer = await subtle.digest('SHA-256', buffer)
  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

export async function sendFileToSignedUrl({
  uploadUrl,
  headers,
  file,
  contentType,
}: {
  uploadUrl: string
  headers: Record<string, string>
  file: File
  contentType: UploadContentType
}) {
  const uploadHeaders: HeadersInit = {
    ...headers,
  }

  if (!Object.keys(headers).some((key) => key.toLowerCase() === 'content-type')) {
    uploadHeaders['Content-Type'] = contentType
  }

  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: uploadHeaders,
    body: file,
  })

  if (!response.ok) {
    throw new Error(`Falha no envio para storage (${response.status}).`)
  }
}

export async function runSignedFileUpload({
  file,
  metadata,
  onStep,
}: {
  file: File
  metadata?: Record<string, unknown>
  onStep?: (step: SignedUploadStep, message: string) => void
}): Promise<ApiSuccessEnvelope<UploadRegisterResponse>> {
  const contentType = inferUploadContentType(file)
  if (!contentType) {
    throw new Error('Formato nao suportado para upload.')
  }

  onStep?.('signing', 'Assinando URL de upload.')
  const checksumSha256 = await computeChecksumSha256(file)
  const signed = await streamgateApi.requestUploadSignedUrl({
    filename: file.name,
    contentType,
    byteSize: file.size,
    checksumSha256,
  })

  onStep?.('uploading', 'Enviando arquivo ao storage.')
  await sendFileToSignedUrl({
    uploadUrl: signed.data.upload_url,
    headers: signed.data.required_headers,
    file,
    contentType,
  })

  onStep?.('confirming', 'Confirmando upload e criando job.')
  return streamgateApi.registerUpload({
    filename: file.name,
    contentType,
    byteSize: file.size,
    checksumSha256,
    storageKey: signed.data.storage_key,
    metadata,
  })
}

export function createPublicLinkIdempotencyKey() {
  const random = typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`

  return `public-link-${random}`
}

export function createConnectorIngestionIdempotencyKey() {
  const random = typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`

  return `connector-ingestion-${random}`
}
