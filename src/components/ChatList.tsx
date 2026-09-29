import type { Chat } from '../types'
import { chatTitle } from '../utils/phone'
import { formatTime } from '../utils/time'
import { Avatar } from './Avatar'

interface Props {
  chats: Chat[]
  activeChatId: string | null
  onSelect: (chatId: string) => void
  emptyText: string
}

export function ChatList({ chats, activeChatId, onSelect, emptyText }: Props) {
  if (chats.length === 0) {
    return <p className="chat-list__empty">{emptyText}</p>
  }

  return (
    <ul className="chat-list">
      {chats.map((chat) => {
        const last = chat.messages.at(-1)
        return (
          <li key={chat.chatId}>
            <button
              type="button"
              className={`chat-item${chat.chatId === activeChatId ? ' chat-item--active' : ''}`}
              onClick={() => onSelect(chat.chatId)}
            >
              <Avatar seed={chat.chatId} label={chatTitle(chat)} src={chat.avatar} />
              <div className="chat-item__body">
                <div className="chat-item__row">
                  <span className="chat-item__title">{chatTitle(chat)}</span>
                  {last && <span className="chat-item__time">{formatTime(last.timestamp)}</span>}
                </div>
                <div className="chat-item__row">
                  <span className="chat-item__preview">
                    {last ? `${last.direction === 'out' ? 'Вы: ' : ''}${last.text}` : 'Нет сообщений'}
                  </span>
                  {chat.unread > 0 && <span className="badge">{chat.unread}</span>}
                </div>
              </div>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
