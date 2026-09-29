export interface Credentials {
  apiUrl: string
  idInstance: string
  apiTokenInstance: string
}

export type InstanceState =
  | 'notAuthorized'
  | 'authorized'
  | 'blocked'
  | 'sleepMode'
  | 'starting'
  | 'yellowCard'
  | 'suspended'

export type MessageDirection = 'in' | 'out'

export interface Message {
  id: string
  chatId: string
  text: string
  direction: MessageDirection
  timestamp: number
  status?: 'sending' | 'failed'
  error?: string
}

export interface Chat {
  chatId: string
  phone: string
  name?: string
  avatar?: string
  messages: Message[]
  unread: number
}
