import {
  validateEmail,
  validateLoginInput,
  validatePassword,
  validateRegistrationInput,
  validateResetPasswordInput,
} from '@/lib/validation'

describe('password validation', () => {
  it('accepts passwords with min length and required complexity', () => {
    expect(validatePassword('StrongPass123!')).toEqual([])
    expect(validatePassword('UltraSecure456@')).toEqual([])
  })

  it('rejects passwords shorter than 12 characters', () => {
    expect(validatePassword('Abc123!')).toContain('A senha deve ter entre 12 e 128 caracteres.')
  })

  it('rejects passwords without uppercase letters', () => {
    expect(validatePassword('strongpass123!')).toContain(
      'A senha deve incluir letra maiuscula, minuscula, numero e simbolo.',
    )
  })

  it('rejects passwords without lowercase letters', () => {
    expect(validatePassword('STRONGPASS123!')).toContain(
      'A senha deve incluir letra maiuscula, minuscula, numero e simbolo.',
    )
  })

  it('rejects passwords without numbers', () => {
    expect(validatePassword('StrongPassOnly!')).toContain(
      'A senha deve incluir letra maiuscula, minuscula, numero e simbolo.',
    )
  })

  it('rejects passwords without symbols', () => {
    expect(validatePassword('StrongPass1234')).toContain(
      'A senha deve incluir letra maiuscula, minuscula, numero e simbolo.',
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
    password: 'StrongPass123!',
    confirmPassword: 'StrongPass123!',
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
      'A senha deve ter entre 12 e 128 caracteres.',
      'A senha deve incluir letra maiuscula, minuscula, numero e simbolo.',
      'A confirmacao de senha deve ser igual a senha.',
    ])
  })
})

describe('reset password validation', () => {
  it('uses the same password validation and requires matching confirmation', () => {
    expect(
      validateResetPasswordInput({
        email: 'operacao@empresa.com',
        password: 'StrongPass123!',
        confirmPassword: 'StrongPass999!',
      }),
    ).toEqual(['A confirmacao de senha deve ser igual a senha.'])
  })
})
