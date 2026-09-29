import { describe, expect, it } from 'vitest'
import { formatPhone, normalizePhone } from './phone'

describe('normalizePhone', () => {
  it.each([
    ['+7 (916) 123-45-67', '79161234567'],
    ['8 916 123 45 67', '79161234567'],
    ['916 123 45 67', '79161234567'],
    ['+7 700 123 45 67', '77001234567'],
    ['8 (700) 123-45-67', '77001234567'],
    ['700 123 45 67', '77001234567'],
    ['+375 29 123 45 67', '375291234567'],
    ['+49 151 23456789', '4915123456789'],
  ])('%s → %s', (input, expected) => {
    expect(normalizePhone(input)).toBe(expected)
  })

  it('не дописывает код страны к номеру, введённому с «+»', () => {
    expect(normalizePhone('+961 3 123 456')).toBe('9613123456')
  })

  it('отклоняет некорректные номера', () => {
    expect(normalizePhone('12345')).toBeNull()
    expect(normalizePhone('1234567890123456')).toBeNull()
    expect(normalizePhone('+7 916 123 45')).toBeNull()
    expect(normalizePhone('+7 916 123 45 678')).toBeNull()
  })
})

describe('formatPhone', () => {
  it('форматирует номера с кодом +7', () => {
    expect(formatPhone('79161234567')).toBe('+7 916 123 45 67')
  })

  it('добавляет «+» к остальным номерам', () => {
    expect(formatPhone('375291234567')).toBe('+375291234567')
  })
})
