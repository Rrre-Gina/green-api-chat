import type { Credentials, InstanceState } from '../types'

export class GreenApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'GreenApiError'
    this.status = status
  }
}

export interface Settings {
  wid?: string
  webhookUrl?: string
  incomingWebhook?: 'yes' | 'no'
  outgoingMessageWebhook?: 'yes' | 'no'
  outgoingAPIMessageWebhook?: 'yes' | 'no'
}

export interface QrResponse {
  type: 'qrCode' | 'timeout' | 'error' | 'passkeyRequired' | 'alreadyLogged'
  message: string
}

export interface NotificationBody {
  typeWebhook: string
  timestamp: number
  idMessage?: string
  senderData?: {
    chatId: string
    sender?: string
    senderName?: string
    senderContactName?: string
    chatName?: string
  }
  messageData?: {
    typeMessage: string
    textMessageData?: { textMessage: string }
    extendedTextMessageData?: { text: string }
  }
}

export interface Notification {
  receiptId: number
  body: NotificationBody
}

export function defaultApiUrl(idInstance: string): string {
  const prefix = idInstance.trim().slice(0, 4)
  return prefix.length === 4 ? `https://${prefix}.api.green-api.com` : ''
}

function buildUrl({ apiUrl, idInstance, apiTokenInstance }: Credentials, method: string, suffix = '') {
  const base = apiUrl.trim().replace(/\/+$/, '')
  return `${base}/waInstance${idInstance.trim()}/${method}/${apiTokenInstance.trim()}${suffix}`
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  let response: Response
  try {
    response = await fetch(url, init)
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new GreenApiError('Нет связи с GREEN-API. Проверьте интернет', 0)
  }

  if (!response.ok) {
    const message =
      response.status === 401 || response.status === 403
        ? 'Неверный idInstance или apiTokenInstance'
        : response.status === 429
          ? 'Слишком много запросов, попробуйте чуть позже'
          : response.status === 466
            ? 'Достигнут лимит тарифа GREEN-API'
            : `Ошибка GREEN-API (${response.status})`
    throw new GreenApiError(message, response.status)
  }

  const text = await response.text()
  return (text ? JSON.parse(text) : null) as T
}

export async function getStateInstance(credentials: Credentials): Promise<InstanceState> {
  const data = await request<{ stateInstance: InstanceState }>(buildUrl(credentials, 'getStateInstance'))
  return data.stateInstance
}

export function getQr(credentials: Credentials): Promise<QrResponse> {
  return request<QrResponse>(buildUrl(credentials, 'qr'))
}

export function getSettings(credentials: Credentials): Promise<Settings> {
  return request<Settings>(buildUrl(credentials, 'getSettings'))
}

export function enableChatNotifications(credentials: Credentials): Promise<{ saveSettings: boolean }> {
  return request(buildUrl(credentials, 'setSettings'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      incomingWebhook: 'yes',
      outgoingMessageWebhook: 'yes',
      outgoingAPIMessageWebhook: 'yes',
    }),
  })
}

export async function sendMessage(credentials: Credentials, chatId: string, message: string): Promise<string> {
  const data = await request<{ idMessage: string }>(buildUrl(credentials, 'sendMessage'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chatId, message }),
  })
  return data.idMessage
}

export interface ContactInfo {
  avatar?: string
  name?: string
  contactName?: string
}

export function getContactInfo(credentials: Credentials, chatId: string): Promise<ContactInfo> {
  return request<ContactInfo>(buildUrl(credentials, 'getContactInfo'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chatId }),
  })
}

export function receiveNotification(
  credentials: Credentials,
  signal?: AbortSignal,
  receiveTimeout = 20,
): Promise<Notification | null> {
  return request<Notification | null>(
    buildUrl(credentials, 'receiveNotification', `?receiveTimeout=${receiveTimeout}`),
    { signal },
  )
}

export function deleteNotification(credentials: Credentials, receiptId: number, signal?: AbortSignal) {
  return request<{ result: boolean }>(buildUrl(credentials, 'deleteNotification', `/${receiptId}`), {
    method: 'DELETE',
    signal,
  })
}
