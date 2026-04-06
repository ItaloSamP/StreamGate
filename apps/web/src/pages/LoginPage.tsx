import { useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import { AuthShell } from '@/components/app/auth-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/features/auth/auth-context'
import { ApiClientError } from '@/lib/api-client'
import { showSingletonToast } from '@/lib/toast'
import { validateLoginInput } from '@/lib/validation'

type LoginErrors = Partial<Record<'email' | 'password', string>>

type LoginRouteState = {
  from?: string
  email?: string
  reason?: string
}

function resolveLoginErrorMessage(error: unknown) {
  if (!(error instanceof ApiClientError)) {
    return 'Nao foi possivel autenticar agora. Tente novamente.'
  }

  if (error.code === 'invalid_credentials') {
    return 'Credenciais invalidas. Revise e-mail e senha.'
  }

  if (error.code === 'access_denied') {
    return 'Seu acesso foi negado para este recurso.'
  }

  if (error.code === 'validation_failed') {
    return error.details[0]?.reason ?? 'Revise os dados e tente novamente.'
  }

  return error.message
}

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  const routeState = (location.state ?? null) as LoginRouteState | null

  const [email, setEmail] = useState(routeState?.email ?? '')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<LoginErrors>({})

  const redirectTo = routeState?.from ?? '/dashboard'
  const helperCopy = useMemo(() => {
    if (routeState?.reason === 'session_expired') {
      return 'Sua sessao anterior nao esta mais valida. Faca login novamente para voltar ao workspace.'
    }

    if (routeState?.from) {
      return 'Faca login para liberar a dashboard protegida e continuar de onde voce parou.'
    }

    return 'Use suas credenciais para entrar no ambiente protegido do StreamGate.'
  }, [routeState?.from, routeState?.reason])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const validationErrors = validateLoginInput({ email, password })
    const nextErrors: LoginErrors = {
      email:
        !email || validationErrors.includes('Informe um e-mail valido.')
          ? 'Informe um e-mail valido.'
          : undefined,
      password: !password.trim() ? 'Informe sua senha.' : undefined,
    }

    setErrors(nextErrors)

    if (validationErrors.length > 0) {
      showSingletonToast('error', validationErrors[0] ?? 'Revise seus dados e tente novamente.')
      return
    }

    setIsSubmitting(true)

    try {
      await login({
        email: email.trim(),
        password,
        remember,
      })

      showSingletonToast('success', 'Login realizado. Sua dashboard ja esta liberada.')
      navigate(redirectTo, { replace: true })
    } catch (error) {
      const message = resolveLoginErrorMessage(error)

      if (error instanceof ApiClientError && error.code === 'invalid_credentials') {
        setErrors((current) => ({ ...current, password: message }))
      }

      showSingletonToast('error', message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthShell
      eyebrow="Login"
      title="Entrar no workspace."
      description={helperCopy}
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-[var(--text-dim)]">
          <span>Novo por aqui? Crie uma conta e mantenha a mesma identidade do produto.</span>
          <Button asChild variant="ghost" size="sm" className="border border-white/8 bg-white/4">
            <Link to="/register">Ir para cadastro</Link>
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">E-mail corporativo</Label>
          <Input
            id="email"
            type="email"
            placeholder="time@empresa.com"
            autoComplete="email"
            value={email}
            invalid={Boolean(errors.email)}
            onChange={(event) => setEmail(event.target.value)}
          />
          {errors.email ? <p className="text-sm text-[var(--signal-red)]">{errors.email}</p> : null}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="password">Senha</Label>
          <Input
            id="password"
            type="password"
            placeholder="Sua senha"
            autoComplete="current-password"
            value={password}
            invalid={Boolean(errors.password)}
            onChange={(event) => setPassword(event.target.value)}
          />
          {errors.password ? <p className="text-sm text-[var(--signal-red)]">{errors.password}</p> : null}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <label className="flex items-center gap-3 text-[var(--text-soft)]">
            <input
              type="checkbox"
              checked={remember}
              onChange={(event) => setRemember(event.target.checked)}
              className="size-4 rounded border border-white/10 bg-white/5 accent-[var(--signal-teal)]"
            />
            Relembrar login
          </label>

          <Link to="/reset-password" className="text-[var(--signal-teal)] transition hover:text-white">
            Redefinir senha
          </Link>
        </div>

        <Button type="submit" variant="inverted" size="xl" disabled={isSubmitting}>
          {isSubmitting ? 'Entrando...' : 'Entrar na dashboard'}
        </Button>

        <Button asChild type="button" variant="panel" size="xl">
          <Link to="/register">Criar conta</Link>
        </Button>
      </form>
    </AuthShell>
  )
}
