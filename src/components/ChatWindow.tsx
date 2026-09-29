import { Fragment, useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import type { Chat, Message } from '../types'
import { chatTitle, formatPhone } from '../utils/phone'
import { formatClock, formatDay } from '../utils/time'
import { Avatar } from './Avatar'
import { EmojiPicker } from './EmojiPicker'
import { AlertIcon, BackIcon, ClockIcon, SendIcon } from './Icons'
import './ChatWindow.css'

interface Props {
  chat: Chat
  onSend: (text: string) => void
  onRetry: (message: Message) => void
  onBack: () => void
}

export function ChatWindow({ chat, onSend, onRetry, onBack }: Props) {
  const [text, setText] = useState('')
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight })
  }, [chat.messages.length, chat.chatId])

  const submit = (event?: FormEvent) => {
    event?.preventDefault()
    const message = text.trim()
    if (!message) return
    onSend(message)
    setText('')
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault()
      submit()
    }
  }

  const insertEmoji = (emoji: string) => {
    const input = inputRef.current
    const start = input?.selectionStart ?? text.length
    const end = input?.selectionEnd ?? text.length
    setText(text.slice(0, start) + emoji + text.slice(end))
    requestAnimationFrame(() => {
      input?.focus()
      input?.setSelectionRange(start + emoji.length, start + emoji.length)
    })
  }

  return (
    <section className="chat">
      <header className="chat__header">
        <button className="icon-button chat__back" type="button" onClick={onBack} aria-label="Назад к чатам">
          <BackIcon />
        </button>
        <Avatar seed={chat.chatId} label={chatTitle(chat)} src={chat.avatar} size={40} />
        <div className="chat__heading">
          <div className="chat__title">{chatTitle(chat)}</div>
          <div className="chat__subtitle">{chat.name ? formatPhone(chat.phone) : 'WhatsApp'}</div>
        </div>
      </header>

      <div className="chat__messages" ref={listRef}>
        {chat.messages.length === 0 && (
          <div className="chat__empty">
            <b>Сообщений пока нет</b>
            <span>Напишите сообщение, и получатель увидит его в WhatsApp</span>
          </div>
        )}
        {chat.messages.map((message, index) => {
          const previous = chat.messages[index - 1]
          const newDay = !previous || formatDay(previous.timestamp) !== formatDay(message.timestamp)
          return (
            <Fragment key={message.id}>
              {newDay && <div className="chat__day">{formatDay(message.timestamp)}</div>}
              <div className={`bubble bubble--${message.direction}${message.status ? ` bubble--${message.status}` : ''}`}>
                <span className="bubble__text">{message.text}</span>
                <span className="bubble__time">
                  {formatClock(message.timestamp)}
                  {message.status === 'sending' && <ClockIcon className="bubble__status" role="img" aria-hidden={false} aria-label="Отправляется" />}
                  {message.status === 'failed' && <AlertIcon className="bubble__status" role="img" aria-hidden={false} aria-label="Не отправлено" />}
                </span>
              </div>
              {message.status === 'failed' && (
                <div className="bubble__failed" role="alert">
                  {message.error ?? 'Не отправлено'}
                  <button className="link-button" type="button" onClick={() => onRetry(message)}>
                    Повторить
                  </button>
                </div>
              )}
            </Fragment>
          )
        })}
      </div>

      <form className="composer" onSubmit={submit}>
        <div className="composer__bar">
          <textarea
            ref={inputRef}
            className="composer__input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Сообщение"
            rows={1}
            maxLength={20000}
            aria-label="Текст сообщения"
          />
          <EmojiPicker onSelect={insertEmoji} />
          <button className="composer__send" type="submit" disabled={!text.trim()} aria-label="Отправить">
            <SendIcon width={20} height={20} strokeWidth={2.4} />
          </button>
        </div>
      </form>
    </section>
  )
}
