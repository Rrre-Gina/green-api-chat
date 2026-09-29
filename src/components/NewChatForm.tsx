import { useState, type FormEvent } from 'react'
import { normalizePhone } from '../utils/phone'
import { PhoneIcon } from './Icons'

interface Props {
  onCreate: (phone: string) => void
  onCancel: () => void
}

export function NewChatForm({ onCreate, onCancel }: Props) {
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const phone = normalizePhone(value)
    if (!phone) {
      setError('Введите номер с кодом страны, например +7 700 123 45 67')
      return
    }
    onCreate(phone)
  }

  return (
    <form className="new-chat" onSubmit={handleSubmit}>
      <div className="new-chat__title">
        <PhoneIcon width={18} height={18} />
        Найти по номеру
      </div>
      <input
        className="field__input"
        type="tel"
        value={value}
        onChange={(e) => {
          setValue(e.target.value)
          setError(null)
        }}
        onKeyDown={(e) => e.key === 'Escape' && onCancel()}
        placeholder="+7 700 123 45 67"
        aria-label="Номер WhatsApp получателя"
        autoFocus
      />
      {error && (
        <p className="error-text" role="alert">
          {error}
        </p>
      )}
      <div className="new-chat__actions">
        <button className="button button--ghost button--small" type="button" onClick={onCancel}>
          Отмена
        </button>
        <button className="button button--primary button--small" type="submit">
          Начать общение
        </button>
      </div>
    </form>
  )
}
