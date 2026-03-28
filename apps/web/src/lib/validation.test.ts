import {
  validateEmail,
  validateLoginInput,
  validatePassword,
  validateRegistrationInput,
  validateResetPasswordInput,
} from '@/lib/validation'

describe('password validation', () => {
  it('accepts passwords with at least one uppercase letter, one number, and up to 8 chars', () => {
    expect(validatePassword('Abc123')).toEqual([])
    expect(validatePassword('A1b2c3d4')).toEqual([])
  })

  it('rejects passwords longer than 8 characters', () => {
    expect(validatePassword('Abcd12345')).toContain(
      'A senha deve ter no maximo 8 caracteres.',
    )
  })

  it('rejects passwords without uppercase letters', () => {
    expect(validatePassword('abc123')).toContain(
      'A senha deve conter pelo menos 1 letra maiuscula.',
    )
  })

  it('rejects passwords without numbers', () => {
    expect(validatePassword('Abcdef')).toContain(
      'A senha deve conter pelo menos 1 numero.',
    )
  })
})

describe('email validation', () => {
  it('accepts valid e-mail addresses', () => {
    expect(validateEmail('time@empresa.com')).toBe(true)
  })

  it('rejects invalid e-mail addresses', () => {
    expect(validateEmail('time@empresa')).toBe(false)
    expect(validateEmail('empresa.com')).toBe(false)
  })
})

describe('login validation', () => {
  it('returns errors for missing fields', () => {
    expect(validateLoginInput({ email: '', password: '' })).toEqual([
      'Informe um e-mail valido.',
      'Informe sua senha.',
    ])
  })
})

describe('registration validation', () => {
  const baseInput = {
    name: 'Ana Costa',
    birthDate: '1994-04-02',
    email: 'ana@empresa.com',
    password: 'Abc123',
    confirmPassword: 'Abc123',
  }

  it('returns no errors for valid registration input', () => {
    expect(validateRegistrationInput(baseInput)).toEqual([])
  })

  it('reports all invalid fields in order', () => {
    expect(
      validateRegistrationInput({
        name: '',
        birthDate: '',
        email: 'anaempresa.com',
        password: 'abcdefghi',
        confirmPassword: 'zzz',
      }),
    ).toEqual([
      'Informe seu nome completo.',
      'Informe sua data de nascimento.',
      'Informe um e-mail valido.',
      'A senha deve ter no maximo 8 caracteres.',
      'A senha deve conter pelo menos 1 numero.',
      'A senha deve conter pelo menos 1 letra maiuscula.',
      'A confirmacao de senha deve ser igual a senha.',
    ])
  })
})

describe('reset password validation', () => {
  it('uses the same password validation and requires matching confirmation', () => {
    expect(
      validateResetPasswordInput({
        email: 'operacao@empresa.com',
        password: 'Abc123',
        confirmPassword: 'Abc999',
      }),
    ).toEqual(['A confirmacao de senha deve ser igual a senha.'])
  })
})
