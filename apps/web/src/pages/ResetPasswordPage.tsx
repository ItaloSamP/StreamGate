import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { AuthShell } from '@/components/app/auth-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ApiClientError } from '@/lib/api-client'
import { streamgateApi } from '@/lib/streamgate-api'
import { showSingletonToast } from '@/lib/toast'
import { validateEmail, validatePassword, validateResetPasswordInput } from '@/lib/validation'

type ResetMode = 'request' | 'confirm'
type ResetFields = 'email' | 'token' | 'password' | 'confirmPassword'
type ResetErrors = Partial<Record<ResetFields, string>>

function buildResetErrors(form: {
  email: string
  token: string
  password: string
  confirmPassword: string
}): ResetErrors {
  const passwordErrors = validatePassword(form.password)

  return {
    email: !validateEmail(form.email) ? 'Informe um e-mail valido.' : undefined,
    token: !form.token.trim() ? 'Informe o token de redefinicao.' : undefined,
    password: passwordErrors[0],
    confirmPassword:
      form.confirmPassword !== form.password
        ? 'A confirmacao de senha deve ser igual a senha.'
        : undefined,
  }
}

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    email: '',
    token: '',
    password: '',
    confirmPassword: '',
  })
  const [mode, setMode] = useState<ResetMode>('request')
  const [errors, setErrors] = useState<ResetErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const description = useMemo(() => {
    if (mode === 'request') {
      return 'Solicite o token de redefinicao. Em ambiente de desenvolvimento, o token e exibido automaticamente.'
    }

    return 'Com o token em maos, defina sua nova senha seguindo a politica real da plataforma.'
  }, [mode])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (mode === 'request') {
      if (!validateEmail(form.email)) {
        setErrors({ email: 'Informe um e-mail valido.' })
        showSingletonToast('error', 'Informe um e-mail valido.')
        return
      }

      setIsSubmitting(true)

      try {
        const payload = await streamgateApi.auth.requestPasswordReset({ email: form.email.trim() })

        setMode('confirm')
        setErrors({})

        if (payload.debug_reset_token) {
          setForm((current) => ({ ...current, token: payload.debug_reset_token ?? '' }))
          showSingletonToast('success', 'Token gerado no ambiente local. Defina sua nova senha para concluir.')
        } else {
          showSingletonToast('success', payload.message ?? 'Token solicitado. Confira seu e-mail para continuar.')
        }
      } catch (error) {
        showSingletonToast(
          'error',
          error instanceof ApiClientError ? error.message : 'Nao foi possivel solicitar a redefinicao.',
        )
      } finally {
        setIsSubmitting(false)
      }

      return
    }

    const validationErrors = validateResetPasswordInput({
      email: form.email,
      password: form.password,
      confirmPassword: form.confirmPassword,
    })

    const nextErrors = buildResetErrors(form)
    setErrors(nextErrors)

    if (validationErrors.length > 0 || !form.token.trim()) {
      showSingletonToast('error', validationErrors[0] ?? nextErrors.token ?? 'Revise os dados e tente novamente.')
      return
    }

    setIsSubmitting(true)

    try {
      await streamgateApi.auth.confirmPasswordReset({
        token: form.token.trim(),
        password: form.password,
        passwordConfirmation: form.confirmPassword,
      })

      showSingletonToast('success', 'Senha redefinida. Agora faca o login.')
      navigate('/login', {
        replace: true,
        state: {
          email: form.email.trim(),
        },
      })
    } catch (error) {
      showSingletonToast(
        'error',
        error instanceof ApiClientError ? error.message : 'Nao foi possivel redefinir a senha agora.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthShell
      eyebrow="Redefinicao"
      title="Atualize sua senha."
      description={description}
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-[var(--text-dim)]">
          <span>Se lembrou da senha atual, volte para o login e entre normalmente.</span>
          <Button asChild variant="ghost" size="sm" className="border border-white/8 bg-white/4">
            <Link to="/login">Voltar para login</Link>
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
            value={form.email}
            invalid={Boolean(errors.email)}
            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
          />
          {errors.email ? <p className="text-sm text-[var(--signal-red)]">{errors.email}</p> : null}
        </div>

        {mode === 'confirm' ? (
          <>
            <div className="flex flex-col gap-2">
              <Label htmlFor="token">Token de redefinicao</Label>
              <Input
                id="token"
                placeholder="Cole o token recebido"
                value={form.token}
                invalid={Boolean(errors.token)}
                onChange={(event) => setForm((current) => ({ ...current, token: event.target.value }))}
              />
              {errors.token ? <p className="text-sm text-[var(--signal-red)]">{errors.token}</p> : null}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Nova senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="Senha forte"
                autoComplete="new-password"
                value={form.password}
                invalid={Boolean(errors.password)}
                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
              />
              <p className="text-xs text-[var(--text-faint)]">
                Use entre 12 e 128 caracteres com maiuscula, minuscula, numero e simbolo.
              </p>
              {errors.password ? <p className="text-sm text-[var(--signal-red)]">{errors.password}</p> : null}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Repita sua nova senha"
                autoComplete="new-password"
                value={form.confirmPassword}
                invalid={Boolean(errors.confirmPassword)}
                onChange={(event) =>
                  setForm((current) => ({ ...current, confirmPassword: event.target.value }))
                }
              />
              {errors.confirmPassword ? (
                <p className="text-sm text-[var(--signal-red)]">{errors.confirmPassword}</p>
              ) : null}
            </div>
          </>
        ) : null}

        <Button type="submit" variant="inverted" size="xl" disabled={isSubmitting}>
          {isSubmitting
            ? mode === 'request'
              ? 'Solicitando token...'
              : 'Redefinindo...'
            : mode === 'request'
              ? 'Solicitar token de redefinicao'
              : 'Salvar nova senha'}
        </Button>

        {mode === 'confirm' ? (
          <Button
            type="button"
            variant="panel"
            size="xl"
            onClick={() => {
              setMode('request')
              setErrors({})
              setForm((current) => ({ ...current, token: '' }))
            }}
          >
            Solicitar novo token
          </Button>
        ) : null}
      </form>
    </AuthShell>
  )
}
