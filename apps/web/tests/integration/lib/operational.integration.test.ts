import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

import { configureApiClientAuth, createApiClient } from '@/lib/api-client'
import { createStreamgateApi } from '@/lib/streamgate-api'

const integrationApiBaseUrl =
  process.env.AUTH_INTEGRATION_BASE_URL ?? process.env.VITE_API_BASE_URL ?? 'http://localhost:3000'

const seededAdminPasswords = Array.from(new Set([
  process.env.SEED_ADMIN_PASSWORD,
  readRootDotEnvValue('SEED_ADMIN_PASSWORD'),
  'TrocaNdo123!',
  'ChangeMe123!',
].filter((value): value is string => Boolean(value && value.trim()))))

const apiClient = createApiClient(integrationApiBaseUrl)
const streamgateApi = createStreamgateApi(apiClient)

let currentToken: string | null = null

describe.sequential('operational integration with real backend', () => {
  beforeEach(async () => {
    const login = await loginWithAnyPassword('admin@streamgate.local', seededAdminPasswords)

    currentToken = login.session.access_token

    configureApiClientAuth({
      getAccessToken: () => currentToken,
    })
  })

  afterEach(() => {
    currentToken = null
    configureApiClientAuth({
      getAccessToken: undefined,
      onAuthFailure: undefined,
    })
  })

  it('updates notification channels and creates a webhook test delivery', async () => {
    const settings = await streamgateApi.getNotificationSettings()

    expect(settings.data.user_id).toBeTruthy()

    const updatedSettings = await streamgateApi.updateNotificationSettings({
      inAppEnabled: true,
      emailEnabled: true,
      webhookEnabled: true,
      webhookUrl: 'https://hooks.example.test/streamgate',
    })

    expect(updatedSettings.data.webhook_enabled).toBe(true)
    expect(updatedSettings.data.webhook_url).toBe('https://hooks.example.test/streamgate')

    const delivery = await streamgateApi.testWebhookNotification({
      reason: 'Exercicio integrado da Sprint 5.',
    })

    expect(delivery.data.channel).toBe('webhook')
    expect(delivery.data.status).toBe('pending')

    const notifications = await streamgateApi.listNotifications({ status: 'active' })

    expect(Array.isArray(notifications.data)).toBe(true)
  })
})

function readRootDotEnvValue(key: string) {
  const envPath = path.resolve(import.meta.dirname, '../../../../../.env')
  if (!existsSync(envPath)) return null

  const line = readFileSync(envPath, 'utf8')
    .split(/\r?\n/u)
    .find((entry) => entry.startsWith(`${key}=`))

  if (!line) return null

  return line.slice(key.length + 1).trim()
}

async function loginWithAnyPassword(email: string, passwords: string[]) {
  let lastError: unknown = null

  for (const password of passwords) {
    try {
      return await streamgateApi.auth.login({ email, password })
    } catch (error) {
      lastError = error
    }
  }

  throw lastError ?? new Error(`Nenhuma credencial funcionou para ${email}.`)
}
