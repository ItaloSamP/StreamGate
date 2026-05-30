import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { AuthShell } from '@/features/auth/components/auth-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/features/auth/auth-context'
import { ApiClientError } from '@/lib/api-client'
import { showSingletonToast } from '@/lib/toast'
import { validateEmail, validatePassword, validateRegistrationInput } from '@/lib/validation'

type RegisterFields = 'name' | 'birthDate' | 'email' | 'password' | 'confirmPassword'
type RegisterErrors = Partial<Record<RegisterFields, string>>

function buildRegisterErrors(form: {
  name: string
  birthDate: string
  email: string
  password: string
  confirmPassword: string
}): RegisterErrors {
  const passwordErrors = validatePassword(form.password)

  return {
    name: !form.name.trim() ? 'Informe seu nome completo.' : undefined,
    birthDate: !form.birthDate.trim() ? 'Informe sua data de nascimento.' : undefined,
    email: !validateEmail(form.email) ? 'Informe um e-mail valido.' : undefined,
    password: passwordErrors[0],
    confirmPassword:
      form.confirmPassword !== form.password
        ? 'A confirmacao de senha deve ser igual a senha.'
        : undefined,
  }
}

export function RegisterPage() {
  const navigate = useNavigate()
  const { register } = useAuth()
  const [form, setForm] = useState({
    name: '',
    birthDate: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState<RegisterErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [remember, setRemember] = useState(true)

  function handleChange(field: RegisterFields, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const validationErrors = validateRegistrationInput(form)
    setErrors(buildRegisterErrors(form))

    if (validationErrors.length > 0) {
      showSingletonToast('error', validationErrors[0] ?? 'Revise os dados do cadastro.')
      return
    }

    setIsSubmitting(true)

    try {
      await register({
        fullName: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        passwordConfirmation: form.confirmPassword,
        remember,
      })

      showSingletonToast('success', 'Cadastro concluido. Sua sessao ja esta ativa.')
      navigate('/dashboard', { replace: true })
    } catch (error) {
      const fallback = 'Nao foi possivel concluir seu cadastro agora.'

      if (error instanceof ApiClientError && error.code === 'validation_failed') {
        const nextErrors: RegisterErrors = { ...errors }

        error.details.forEach((detail) => {
          if (!detail.field) {
            return
          }

          if (detail.field === 'full_name') {
            nextErrors.name = 'Informe seu nome completo.'
          }

          if (detail.field === 'email' && detail.reason === 'taken') {
            nextErrors.email = 'Este e-mail ja esta em uso.'
          }

          if (detail.field === 'password') {
            nextErrors.password = 'A senha nao atende a politica de seguranca.'
          }

          if (detail.field === 'password_confirmation') {
            nextErrors.confirmPassword = 'A confirmacao de senha deve ser igual a senha.'
          }
        })

        setErrors(nextErrors)
      }

      showSingletonToast('error', error instanceof ApiClientError ? error.message : fallback)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthShell
      eyebrow="Cadastro"
      title="Crie sua entrada."
      description="Cadastre sua conta para preparar o acesso ao workspace. As regras de senha seguem a politica real da plataforma."
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-[var(--text-dim)]">
          <span>Ja tem conta? Retorne para o login sem perder o contexto da interface.</span>
          <Button asChild variant="ghost" size="sm" className="border border-white/8 bg-white/4">
            <Link to="/login">Voltar para login</Link>
          </Button>
        </div>
      }
    >
      <form data-testid="register-form" onSubmit={handleSubmit} className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-2 sm:col-span-2">
          <Label htmlFor="name">Nome completo</Label>
          <Input
            data-testid="register-name"
            id="name"
            placeholder="Ana Costa"
            autoComplete="name"
            value={form.name}
            invalid={Boolean(errors.name)}
            onChange={(event) => handleChange('name', event.target.value)}
          />
          {errors.name ? <p className="text-sm text-[var(--signal-red)]">{errors.name}</p> : null}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="birthDate">Data de nascimento</Label>
          <Input
            data-testid="register-birthdate"
            id="birthDate"
            type="date"
            value={form.birthDate}
            invalid={Boolean(errors.birthDate)}
            onChange={(event) => handleChange('birthDate', event.target.value)}
          />
          {errors.birthDate ? <p className="text-sm text-[var(--signal-red)]">{errors.birthDate}</p> : null}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="email">E-mail corporativo</Label>
          <Input
            data-testid="register-email"
            id="email"
            type="email"
            placeholder="time@empresa.com"
            autoComplete="email"
            value={form.email}
            invalid={Boolean(errors.email)}
            onChange={(event) => handleChange('email', event.target.value)}
          />
          {errors.email ? <p className="text-sm text-[var(--signal-red)]">{errors.email}</p> : null}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="password">Senha</Label>
          <Input
            data-testid="register-password"
            id="password"
            type="password"
            placeholder="Senha forte"
            autoComplete="new-password"
            value={form.password}
            invalid={Boolean(errors.password)}
            onChange={(event) => handleChange('password', event.target.value)}
          />
          <p className="text-xs text-[var(--text-faint)]">
            Use entre 12 e 128 caracteres com maiuscula, minuscula, numero e simbolo.
          </p>
          {errors.password ? <p className="text-sm text-[var(--signal-red)]">{errors.password}</p> : null}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="confirmPassword">Confirmar senha</Label>
          <Input
            data-testid="register-confirm-password"
            id="confirmPassword"
            type="password"
            placeholder="Repita sua senha"
            autoComplete="new-password"
            value={form.confirmPassword}
            invalid={Boolean(errors.confirmPassword)}
            onChange={(event) => handleChange('confirmPassword', event.target.value)}
          />
          {errors.confirmPassword ? (
            <p className="text-sm text-[var(--signal-red)]">{errors.confirmPassword}</p>
          ) : null}
        </div>

        <div className="sm:col-span-2 flex items-center gap-3 text-sm text-[var(--text-soft)]">
          <input
            data-testid="register-remember"
            id="remember"
            type="checkbox"
            checked={remember}
            onChange={(event) => setRemember(event.target.checked)}
            className="size-4 rounded border border-white/10 bg-white/5 accent-[var(--signal-teal)]"
          />
          <Label htmlFor="remember" className="cursor-pointer">Relembrar login neste dispositivo</Label>
        </div>

        <div className="sm:col-span-2 flex flex-col gap-3 pt-2">
          <Button data-testid="register-submit" type="submit" variant="inverted" size="xl" disabled={isSubmitting}>
            {isSubmitting ? 'Criando acesso...' : 'Concluir cadastro'}
          </Button>
          <Button data-testid="register-login-link" asChild type="button" variant="panel" size="xl">
            <Link to="/login">Ja tenho conta</Link>
          </Button>
        </div>
      </form>
    </AuthShell>
  )
}
