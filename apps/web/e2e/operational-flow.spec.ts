import { expect, test, type Page } from '@playwright/test'
import { readFileSync } from 'node:fs'

const seededAdminEmail = 'admin@streamgate.local'
const seededAdminPasswords = Array.from(new Set([
  process.env.SEED_ADMIN_PASSWORD,
  readRootDotEnvValue('SEED_ADMIN_PASSWORD'),
  'TrocaNdo123!',
  'ChangeMe123!',
].filter((value): value is string => Boolean(value && value.trim()))))

test.describe('operational e2e flow', () => {
  test('lets an admin manage notification channels and access the safe operations wizard', async ({ page }) => {
    await loginAsAdmin(page)

    await page.getByLabel(/Notificacoes/i).click()
    await expect(page).toHaveURL(/\/notifications$/, { timeout: 45_000 })
    await expect(page.getByText('Centro de notificacoes')).toBeVisible()

    await page.getByRole('button', { name: /Regras e canais/i }).click()
    await expect(page.getByText('Regras de notificacao')).toBeVisible()

    const webhookUrl = page.getByLabel('Webhook URL')
    const webhookToggle = page.locator('label', { hasText: 'Webhook' }).getByRole('checkbox')
    await webhookToggle.check()
    await webhookUrl.fill('https://hooks.example.test/streamgate/e2e')
    await page.getByLabel('Motivo do teste').fill('Validar canal operacional de operacao segura.')

    await page.getByRole('button', { name: /Salvar canais/i }).click()
    await expect(webhookUrl).toHaveValue('https://hooks.example.test/streamgate/e2e')

    await page.getByRole('button', { name: /Testar webhook/i }).click()
    await expect(page.getByRole('button', { name: /Testar webhook/i })).toBeEnabled()

    await page.getByRole('link', { name: /Operacoes Seguras/i }).click()
    await expect(page).toHaveURL(/\/operations$/, { timeout: 45_000 })
    await expect(page.getByText('Wizard admin-only')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Retry de job' })).toBeVisible()
  })
})

async function loginAsAdmin(page: Page) {
  for (const password of seededAdminPasswords) {
    await page.goto('/login')
    await page.getByTestId('login-email').fill(seededAdminEmail)
    await page.getByTestId('login-password').fill(password)
    await page.getByTestId('login-submit').click()

    try {
      await expect(page).toHaveURL(/\/dashboard$/, { timeout: 12_000 })
      await expect(page.locator('.dash-topbar-title')).toHaveText('Dashboard')
      await expect(page.getByTestId('dashboard-user-menu-toggle')).toBeVisible()
      return
    } catch {
      // Try the next known local password without failing the whole flow early.
    }
  }

  throw new Error('Nao foi possivel autenticar o admin seeded para o fluxo operacional de operacao segura.')
}

function readRootDotEnvValue(key: string) {
  try {
    const dotenv = readFileSync(new URL('../../../.env', import.meta.url), 'utf8')
    const line = dotenv
      .split(/\r?\n/)
      .map((entry) => entry.trim())
      .find((entry) => entry.startsWith(`${key}=`))

    if (!line) {
      return null
    }

    return line.slice(key.length + 1).trim().replace(/^["']|["']$/g, '')
  } catch {
    return null
  }
}
