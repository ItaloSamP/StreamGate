import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { AuthShell } from '@/components/app/auth-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { showSingletonToast } from '@/lib/toast'
import { validateEmail, validatePassword, validateResetPasswordInput } from '@/lib/validation'

type ResetFields = 'email' | 'password' | 'confirmPassword'
type ResetErrors = Partial<Record<ResetFields, string>>

function buildResetErrors(form: {
  email: string
  password: string
  confirmPassword: string
}): ResetErrors {
  const passwordErrors = validatePassword(form.password)

  return {
    email: !validateEmail(form.email) ? 'Informe um e-mail valido.' : undefined,
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
    password: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState<ResetErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const validationErrors = validateResetPasswordInput(form)
    setErrors(buildResetErrors(form))

    if (validationErrors.length > 0) {
      showSingletonToast('error', validationErrors[0] ?? 'Revise os dados e tente novamente.')
      return
    }

    setIsSubmitting(true)

    window.setTimeout(() => {
      showSingletonToast('success', 'Senha redefinida. Agora faca o login.')
      navigate('/login', {
        replace: true,
        state: {
          email: form.email.trim(),
        },
      })
      setIsSubmitting(false)
    }, 420)
  }

  return (
    <AuthShell
      eyebrow="Redefinicao"
      title="Atualize sua senha."
      description="Este fluxo segue exatamente a mesma regra de senha do cadastro e retorna voce para o login quando concluir."
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

        <div className="flex flex-col gap-2">
          <Label htmlFor="password">Nova senha</Label>
          <Input
            id="password"
            type="password"
            placeholder="Ate 8 caracteres"
            autoComplete="new-password"
            value={form.password}
            invalid={Boolean(errors.password)}
            onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
          />
          <p className="text-xs text-[var(--text-faint)]">
            A senha precisa ter no maximo 8 caracteres, com 1 numero e 1 letra maiuscula.
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

        <Button type="submit" variant="inverted" size="xl" disabled={isSubmitting}>
          {isSubmitting ? 'Redefinindo...' : 'Salvar nova senha'}
        </Button>
      </form>
    </AuthShell>
  )
}
