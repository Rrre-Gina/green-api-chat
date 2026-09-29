import { useCallback, useEffect, useReducer } from 'react'
import type { Chat, Message } from '../types'
import { chatIdToPhone } from '../utils/phone'
import { loadChats, saveChats } from '../utils/storage'

type Action =
  | { type: 'openChat'; chatId: string }
  | { type: 'addMessage'; message: Message; name?: string; active: boolean }
  | { type: 'markRead'; chatId: string }
  | { type: 'setContact'; chatId: string; name?: string; avatar?: string }
  | { type: 'updateMessage'; chatId: string; id: string; patch: Partial<Message> }

export function chatsReducer(chats: Chat[], action: Action): Chat[] {
  switch (action.type) {
    case 'openChat': {
      if (chats.some((c) => c.chatId === action.chatId)) return chats
      const chat: Chat = { chatId: action.chatId, phone: chatIdToPhone(action.chatId), messages: [], unread: 0 }
      return [chat, ...chats]
    }
    case 'addMessage': {
      const { message, name, active } = action
      const chat = chats.find((c) => c.chatId === message.chatId)
      if (!chat) return chats
      // Отправленное сообщение приходит ещё и уведомлением
      if (chat.messages.some((m) => m.id === message.id)) return chats

      const messages = [...chat.messages, message].sort((a, b) => a.timestamp - b.timestamp)
      const updated: Chat = {
        ...chat,
        name: chat.name ?? name,
        messages,
        unread: message.direction === 'in' && !active ? chat.unread + 1 : chat.unread,
      }
      return [updated, ...chats.filter((c) => c.chatId !== chat.chatId)]
    }
    case 'markRead':
      return chats.map((c) => (c.chatId === action.chatId && c.unread ? { ...c, unread: 0 } : c))
    case 'setContact':
      return chats.map((c) =>
        c.chatId === action.chatId
          ? { ...c, name: action.name || c.name, avatar: action.avatar || c.avatar }
          : c,
      )
    case 'updateMessage': {
      const { chatId, id, patch } = action
      return chats.map((c) => {
        if (c.chatId !== chatId) return c
        // Уведомление о сообщении могло прийти раньше ответа sendMessage
        if (patch.id && patch.id !== id && c.messages.some((m) => m.id === patch.id)) {
          return { ...c, messages: c.messages.filter((m) => m.id !== id) }
        }
        return { ...c, messages: c.messages.map((m) => (m.id === id ? { ...m, ...patch } : m)) }
      })
    }
  }
}

const failInterrupted = (chats: Chat[]): Chat[] =>
  chats.map((c) => ({
    ...c,
    messages: c.messages.map((m) => (m.status === 'sending' ? { ...m, status: 'failed' } : m)),
  }))

export function useChats(idInstance: string, remember: boolean) {
  const [chats, dispatch] = useReducer(chatsReducer, undefined, () =>
    failInterrupted(loadChats(idInstance, remember)),
  )

  useEffect(() => {
    saveChats(idInstance, remember, chats)
  }, [idInstance, remember, chats])

  const openChat = useCallback((chatId: string) => dispatch({ type: 'openChat', chatId }), [])
  const addMessage = useCallback(
    (message: Message, active: boolean, name?: string) => dispatch({ type: 'addMessage', message, name, active }),
    [],
  )
  const markRead = useCallback((chatId: string) => dispatch({ type: 'markRead', chatId }), [])
  const setContact = useCallback(
    (chatId: string, name?: string, avatar?: string) => dispatch({ type: 'setContact', chatId, name, avatar }),
    [],
  )

  const updateMessage = useCallback(
    (chatId: string, id: string, patch: Partial<Message>) => dispatch({ type: 'updateMessage', chatId, id, patch }),
    [],
  )

  return { chats, openChat, addMessage, markRead, setContact, updateMessage }
}
