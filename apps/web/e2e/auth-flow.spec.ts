import { expect, test, type Page, type TestInfo } from '@playwright/test'
import { readFileSync } from 'node:fs'

const seededOperatorEmail = 'operator@streamgate.local'
const seededOperatorPassword =
  process.env.SEED_OPERATOR_PASSWORD ?? readRootDotEnvValue('SEED_OPERATOR_PASSWORD') ?? 'ChangeMe123!'

type EphemeralCredentials = {
  fullName: string
  email: string
  password: string
}

test.describe('auth e2e flow', () => {
  test('registers a new user, reaches dashboard, logs out, and blocks protected route access', async ({
    page,
  }, testInfo) => {
    const credentials = buildEphemeralCredentials('register', testInfo)

    await page.goto('/register')
    await fillRegistrationForm(page, credentials)
    await page.getByTestId('register-submit').click()

    await expectDashboard(page)

    await logoutFromDashboard(page)
    await expect(page).toHaveURL(/\/$/)

    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login$/)
    await expect(page.getByTestId('login-helper-copy')).toContainText(
      'Sua sessao anterior nao esta mais valida',
    )
  })

  test('logs in with seeded operator and unlocks protected dashboard', async ({ page }) => {
    await page.goto('/login')
    await page.getByTestId('login-email').fill(seededOperatorEmail)
    await page.getByTestId('login-password').fill(seededOperatorPassword)
    await page.getByTestId('login-submit').click()

    await expectDashboard(page)
  })

  test('resets password for an ephemeral account and signs in with the new password', async ({
    page,
  }, testInfo) => {
    const credentials = buildEphemeralCredentials('reset', testInfo)
    const newPassword = 'EvenStrongerPass123!'

    await page.goto('/register')
    await fillRegistrationForm(page, credentials)
    await page.getByTestId('register-submit').click()

    await expectDashboard(page)
    await logoutFromDashboard(page)

    await page.goto('/reset-password')
    await page.getByTestId('reset-email').fill(credentials.email)
    await page.getByTestId('reset-request-submit').click()

    const tokenField = page.getByTestId('reset-token')
    await expect(tokenField).toBeVisible()
    await expect(tokenField).not.toHaveValue('')

    await page.getByTestId('reset-password').fill(newPassword)
    await page.getByTestId('reset-confirm-password').fill(newPassword)
    await page.getByTestId('reset-confirm-submit').click()

    await expect(page).toHaveURL(/\/login$/)
    await expect(page.getByTestId('login-email')).toHaveValue(credentials.email)

    await page.getByTestId('login-password').fill(newPassword)
    await page.getByTestId('login-submit').click()

    await expectDashboard(page)
  })

  test('redirects to login when local storage contains an expired session', async ({ page }) => {
    await page.addInitScript((sessionPayload) => {
      window.localStorage.setItem('streamgate.auth.session', JSON.stringify(sessionPayload))
    }, buildExpiredStoredSession())

    await page.goto('/dashboard')

    await expect(page).toHaveURL(/\/login$/)
    await expect(page.getByTestId('login-helper-copy')).toContainText(
      'Sua sessao anterior nao esta mais valida',
    )

    await expect
      .poll(async () => page.evaluate(() => window.localStorage.getItem('streamgate.auth.session')))
      .toBeNull()
  })
})

async function fillRegistrationForm(page: Page, credentials: EphemeralCredentials) {
  await page.getByTestId('register-name').fill(credentials.fullName)
  await page.getByTestId('register-birthdate').fill('1995-05-20')
  await page.getByTestId('register-email').fill(credentials.email)
  await page.getByTestId('register-password').fill(credentials.password)
  await page.getByTestId('register-confirm-password').fill(credentials.password)
}

async function logoutFromDashboard(page: Page) {
  await page.getByTestId('dashboard-user-menu-toggle').click()
  const logoutAction = page.getByTestId('dashboard-logout-action')
  await expect(logoutAction).toBeVisible()
  await expect(logoutAction).toBeEnabled()
  await Promise.all([page.waitForURL(/\/$/), logoutAction.click()])
}

async function expectDashboard(page: Page) {
  await expect(page).toHaveURL(/\/dashboard$/, { timeout: 45_000 })
  await expect(page.locator('.dash-topbar-title')).toHaveText('Dashboard')
  await expect(page.getByTestId('dashboard-user-menu-toggle')).toBeVisible()
  await expect(page.getByRole('link', { name: '+ Upload' })).toBeVisible()
}

function buildEphemeralCredentials(prefix: string, testInfo: TestInfo): EphemeralCredentials {
  const nonce = `${Date.now()}-${testInfo.project.name}-${Math.random().toString(36).slice(2, 8)}`

  return {
    fullName: `E2E ${prefix} ${nonce}`,
    email: `${prefix}-${nonce}@streamgate.local`,
    password: 'StrongPass123!',
  }
}

function buildExpiredStoredSession() {
  const now = Date.now()

  return {
    remember: true,
    createdAt: new Date(now - 60_000).toISOString(),
    user: {
      id: 'expired-user',
      email: 'expired@streamgate.local',
      full_name: 'Expired Session User',
      role: 'operator',
      status: 'active',
    },
    session: {
      id: 'expired-session',
      token_type: 'Bearer',
      access_token: 'expired-access-token',
      expires_at: new Date(now - 30_000).toISOString(),
    },
  }
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
