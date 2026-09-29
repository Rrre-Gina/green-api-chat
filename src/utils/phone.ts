export function normalizePhone(input: string): string | null {
  const international = input.trim().startsWith('+')
  let digits = input.replace(/\D/g, '')
  if (!international) {
    if (digits.length === 11 && digits.startsWith('8')) digits = `7${digits.slice(1)}`
    else if (digits.length === 10 && /^[79]/.test(digits)) digits = `7${digits}`
  }
  if (digits.startsWith('7') && digits.length !== 11) return null
  if (digits.length < 10 || digits.length > 15) return null
  return digits
}

export const phoneToChatId = (phone: string) => `${phone}@c.us`

export const chatIdToPhone = (chatId: string) => chatId.replace(/@.*$/, '')

export function formatPhone(phone: string): string {
  const m = phone.match(/^7(\d{3})(\d{3})(\d{2})(\d{2})$/)
  return m ? `+7 ${m[1]} ${m[2]} ${m[3]} ${m[4]}` : `+${phone}`
}

export const chatTitle = (chat: { name?: string; phone: string }) => chat.name || formatPhone(chat.phone)
