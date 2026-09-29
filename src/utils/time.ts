const timeFormat = new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' })
const shortDateFormat = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' })
const longDateFormat = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })

const toDate = (timestamp: number) => new Date(timestamp * 1000)
const isToday = (date: Date) => date.toDateString() === new Date().toDateString()

export function formatTime(timestamp: number): string {
  const date = toDate(timestamp)
  return isToday(date) ? timeFormat.format(date) : shortDateFormat.format(date)
}

export const formatClock = (timestamp: number) => timeFormat.format(toDate(timestamp))

export function formatDay(timestamp: number): string {
  const date = toDate(timestamp)
  if (isToday(date)) return 'Сегодня'
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  if (date.toDateString() === yesterday.toDateString()) return 'Вчера'
  return longDateFormat.format(date)
}
