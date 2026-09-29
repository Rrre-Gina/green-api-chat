import { useCallback, useEffect, useRef, useState } from 'react'
import { enableChatNotifications, getContactInfo, getSettings, sendMessage, type Notification } from '../api/greenApi'
import { useChats } from '../hooks/useChats'
import { useNotificationPolling } from '../hooks/useNotificationPolling'
import type { Credentials, Message } from '../types'
import { parseTextMessage } from '../utils/notifications'
import { chatTitle, formatPhone, phoneToChatId } from '../utils/phone'
import { ChatList } from './ChatList'
import { ChatWindow } from './ChatWindow'
import { ChatsIcon, LogoutIcon, PlusIcon, SearchIcon } from './Icons'
import { NewChatForm } from './NewChatForm'
import './Messenger.css'

interface Props {
  credentials: Credentials
  remember: boolean
  onLogout: () => void
}

type SettingsProblem = 'notificationsOff' | 'webhookUrlSet' | null

const STATUS_TEXT = { connecting: 'Подключение…', online: 'В сети', error: 'Нет связи' }

export function Messenger({ credentials, remember, onLogout }: Props) {
  const { chats, openChat, addMessage, markRead, setContact, updateMessage } = useChats(credentials.idInstance, remember)
  const [activeChatId, setActiveChatId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [query, setQuery] = useState('')
  const [wid, setWid] = useState<string | null>(null)
  const [settingsLoaded, setSettingsLoaded] = useState(false)
  const [settingsProblem, setSettingsProblem] = useState<SettingsProblem>(null)
  const [settingsSaved, setSettingsSaved] = useState(false)

  const activeChatIdRef = useRef(activeChatId)
  useEffect(() => {
    activeChatIdRef.current = activeChatId
  })

  useEffect(() => {
    getSettings(credentials)
      .then((settings) => {
        setWid(settings.wid ?? null)
        setSettingsLoaded(true)
        if (settings.webhookUrl) setSettingsProblem('webhookUrlSet')
        else if (settings.incomingWebhook !== 'yes') setSettingsProblem('notificationsOff')
      })
      .catch(() => {})
  }, [credentials])

  const handleNotification = useCallback(
    ({ body }: Notification) => {
      const message = parseTextMessage(body)
      if (!message) return
      const name =
        message.direction === 'in' ? body.senderData?.senderContactName || body.senderData?.senderName : undefined
      addMessage(message, message.chatId === activeChatIdRef.current, name)
    },
    [addMessage],
  )

  const polling = useNotificationPolling(credentials, handleNotification)
  // Первый long polling может длиться до 20 с, а успешный getSettings уже подтверждает связь
  const status = polling.status === 'connecting' && settingsLoaded ? 'online' : polling.status
  const error = polling.error

  const selectChat = (chatId: string) => {
    setActiveChatId(chatId)
    markRead(chatId)
    setCreating(false)
  }

  const createChat = (phone: string) => {
    const chatId = phoneToChatId(phone)
    const exists = chats.some((c) => c.chatId === chatId)
    openChat(chatId)
    selectChat(chatId)
    setQuery('')
    if (!exists) {
      getContactInfo(credentials, chatId)
        .then((info) => setContact(chatId, info.contactName || info.name, info.avatar))
        .catch(() => {})
    }
  }

  const deliver = async (chatId: string, localId: string, text: string) => {
    try {
      const idMessage = await sendMessage(credentials, chatId, text)
      updateMessage(chatId, localId, { id: idMessage, status: undefined, error: undefined })
    } catch (sendError) {
      const message = sendError instanceof Error ? sendError.message : 'Не удалось отправить сообщение'
      updateMessage(chatId, localId, { status: 'failed', error: message })
    }
  }

  const handleSend = (text: string) => {
    if (!activeChatId) return
    const localId = `local-${crypto.randomUUID()}`
    addMessage(
      {
        id: localId,
        chatId: activeChatId,
        text,
        direction: 'out',
        timestamp: Math.floor(Date.now() / 1000),
        status: 'sending',
      },
      true,
    )
    void deliver(activeChatId, localId, text)
  }

  const handleRetry = (message: Message) => {
    updateMessage(message.chatId, message.id, { status: 'sending', error: undefined })
    void deliver(message.chatId, message.id, message.text)
  }

  const handleEnableNotifications = async () => {
    try {
      await enableChatNotifications(credentials)
      setSettingsSaved(true)
    } catch {
      setSettingsSaved(false)
    }
  }

  const search = query.trim().toLowerCase()
  const digits = search.replace(/\D/g, '')
  const visibleChats = search
    ? chats.filter((c) => chatTitle(c).toLowerCase().includes(search) || (digits && c.phone.includes(digits)))
    : chats
  const activeChat = chats.find((c) => c.chatId === activeChatId) ?? null
  const totalUnread = chats.reduce((sum, c) => sum + c.unread, 0)

  const logoutButton = (className: string) => (
    <button className={className} type="button" onClick={onLogout} title="Выйти" aria-label="Выйти">
      <LogoutIcon />
      <span>Выйти</span>
    </button>
  )

  return (
    <div className={`messenger${activeChat ? ' messenger--chat-open' : ''}`}>
      <nav className="rail">
        <div className="rail__item rail__item--active">
          <span className="rail__icon">
            <ChatsIcon />
            {totalUnread > 0 && <span className="badge rail__badge">{totalUnread}</span>}
          </span>
          <span>Чаты</span>
        </div>
        {logoutButton('rail__item rail__item--bottom')}
      </nav>

      <aside className="sidebar">
        <header className="sidebar__header">
          <div>
            <h1 className="sidebar__title">Чаты</h1>
            <div className="sidebar__meta">
              <span className="wa-badge">WhatsApp</span>
              <span className={`status status--${status}`} title={error ?? undefined}>
                {STATUS_TEXT[status]}
                {wid && ` · ${formatPhone(wid.replace(/@.*$/, ''))}`}
              </span>
            </div>
          </div>
          <div className="sidebar__actions">
            {logoutButton('icon-button sidebar__logout')}
            <button
              className={`square-button${creating ? ' square-button--active' : ''}`}
              type="button"
              onClick={() => setCreating((v) => !v)}
              title="Новый чат"
              aria-label="Новый чат"
              aria-expanded={creating}
            >
              <PlusIcon />
            </button>
          </div>
        </header>

        {creating ? (
          <NewChatForm onCreate={createChat} onCancel={() => setCreating(false)} />
        ) : (
          <label className="search">
            <SearchIcon className="search__icon" />
            <input
              className="search__input"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Поиск"
              aria-label="Поиск по чатам"
            />
          </label>
        )}

        {settingsProblem && (
          <div className="notice">
            {settingsProblem === 'webhookUrlSet' ? (
              'В настройках инстанса указан URL для уведомлений. Пока он задан, сообщения не будут приходить: очистите его в консоли GREEN-API.'
            ) : settingsSaved ? (
              'Готово! Инстанс перезапускается, входящие сообщения начнут приходить в течение ~5 минут.'
            ) : (
              <>
                У инстанса выключены уведомления о входящих сообщениях, поэтому ответы не будут приходить.
                <button className="button button--primary button--small" type="button" onClick={handleEnableNotifications}>
                  Включить
                </button>
              </>
            )}
          </div>
        )}

        <ChatList
          chats={visibleChats}
          activeChatId={activeChatId}
          onSelect={selectChat}
          emptyText={search ? 'Ничего не найдено' : 'Чатов пока нет. Нажмите «+», чтобы написать по номеру.'}
        />
      </aside>

      <main className="main pattern">
        {activeChat ? (
          <ChatWindow
            key={activeChat.chatId}
            chat={activeChat}
            onSend={handleSend}
            onRetry={handleRetry}
            onBack={() => setActiveChatId(null)}
          />
        ) : (
          <div className="main__placeholder">
            <span>Выберите чат WhatsApp или создайте новый</span>
          </div>
        )}
      </main>
    </div>
  )
}
