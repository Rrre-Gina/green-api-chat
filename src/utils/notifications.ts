import type { NotificationBody } from '../api/greenApi'
import type { Message } from '../types'

const DIRECTION_BY_TYPE: Record<string, Message['direction']> = {
  incomingMessageReceived: 'in',
  outgoingMessageReceived: 'out',
  outgoingAPIMessageReceived: 'out',
}

export function parseTextMessage(body: NotificationBody): Message | null {
  const direction = DIRECTION_BY_TYPE[body.typeWebhook]
  const chatId = body.senderData?.chatId
  if (!direction || !chatId || !body.idMessage || !body.messageData) return null
  if (!chatId.endsWith('@c.us')) return null

  const { typeMessage, textMessageData, extendedTextMessageData } = body.messageData
  let text: string | undefined
  if (typeMessage === 'textMessage') text = textMessageData?.textMessage
  else if (typeMessage === 'extendedTextMessage' || typeMessage === 'quotedMessage') text = extendedTextMessageData?.text
  if (!text) return null

  return { id: body.idMessage, chatId, text, direction, timestamp: body.timestamp }
}
