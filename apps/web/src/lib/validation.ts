const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export type LoginInput = {
  email: string
  password: string
}

export type RegistrationInput = {
  name: string
  birthDate: string
  email: string
  password: string
  confirmPassword: string
}

export type ResetPasswordInput = {
  email: string
  password: string
  confirmPassword: string
}

export function validateEmail(email: string) {
  return EMAIL_PATTERN.test(email.trim())
}

export function validatePassword(password: string) {
  const errors: string[] = []

  if (password.length > 8) {
    errors.push('A senha deve ter no maximo 8 caracteres.')
  }

  if (!/\d/.test(password)) {
    errors.push('A senha deve conter pelo menos 1 numero.')
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('A senha deve conter pelo menos 1 letra maiuscula.')
  }

  return errors
}

export function validateLoginInput(input: LoginInput) {
  const errors: string[] = []

  if (!validateEmail(input.email)) {
    errors.push('Informe um e-mail valido.')
  }

  if (!input.password.trim()) {
    errors.push('Informe sua senha.')
  }

  return errors
}

export function validateRegistrationInput(input: RegistrationInput) {
  const errors: string[] = []

  if (!input.name.trim()) {
    errors.push('Informe seu nome completo.')
  }

  if (!input.birthDate.trim()) {
    errors.push('Informe sua data de nascimento.')
  }

  if (!validateEmail(input.email)) {
    errors.push('Informe um e-mail valido.')
  }

  errors.push(...validatePassword(input.password))

  if (input.confirmPassword !== input.password) {
    errors.push('A confirmacao de senha deve ser igual a senha.')
  }

  return errors
}

export function validateResetPasswordInput(input: ResetPasswordInput) {
  const errors: string[] = []

  if (!validateEmail(input.email)) {
    errors.push('Informe um e-mail valido.')
  }

  errors.push(...validatePassword(input.password))

  if (input.confirmPassword !== input.password) {
    errors.push('A confirmacao de senha deve ser igual a senha.')
  }

  return errors
}
