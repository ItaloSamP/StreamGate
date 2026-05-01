import type { UploadContentType } from '@/lib/streamgate-api'

export function inferUploadContentType(file: File): UploadContentType | null {
  const lowerName = file.name.toLowerCase()
  const normalizedType = file.type.toLowerCase().trim()

  if (lowerName.endsWith('.zip') || normalizedType === 'application/zip' || normalizedType === 'application/x-zip-compressed') {
    return 'application/zip'
  }

  if (lowerName.endsWith('.csv') || normalizedType === 'text/csv' || normalizedType === 'application/csv') {
    return 'text/csv'
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

export function createPublicLinkIdempotencyKey() {
  const random = typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`

  return `public-link-${random}`
}
