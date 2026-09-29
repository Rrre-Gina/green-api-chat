import { describe, expect, it } from 'vitest'
import type { NotificationBody } from '../api/greenApi'
import { parseTextMessage } from './notifications'

const base: NotificationBody = {
  typeWebhook: 'incomingMessageReceived',
  timestamp: 1588091580,
  idMessage: 'F7AEC1B7086ECDC7E6E45923F5EDB825',
  senderData: { chatId: '77001234567@c.us', senderName: 'Айгерим' },
  messageData: { typeMessage: 'textMessage', textMessageData: { textMessage: 'Привет!' } },
}

describe('parseTextMessage', () => {
  it('разбирает входящее текстовое сообщение', () => {
    expect(parseTextMessage(base)).toEqual({
      id: 'F7AEC1B7086ECDC7E6E45923F5EDB825',
      chatId: '77001234567@c.us',
      text: 'Привет!',
      direction: 'in',
      timestamp: 1588091580,
    })
  })

  it('разбирает сообщение со ссылкой (extendedTextMessage)', () => {
    const body = {
      ...base,
      messageData: { typeMessage: 'extendedTextMessage', extendedTextMessageData: { text: 'https://green-api.com' } },
    }
    expect(parseTextMessage(body)?.text).toBe('https://green-api.com')
  })

  it('помечает отправленные через API сообщения как исходящие', () => {
    expect(parseTextMessage({ ...base, typeWebhook: 'outgoingAPIMessageReceived' })?.direction).toBe('out')
  })

  it('игнорирует статусы, файлы и группы', () => {
    expect(parseTextMessage({ ...base, typeWebhook: 'outgoingMessageStatus' })).toBeNull()
    expect(parseTextMessage({ ...base, messageData: { typeMessage: 'imageMessage' } })).toBeNull()
    expect(parseTextMessage({ ...base, senderData: { chatId: '120363043968066561@g.us' } })).toBeNull()
  })
})
