import { useState, type FormEvent } from 'react'
import { defaultApiUrl, getStateInstance, GreenApiError } from '../api/greenApi'
import type { Credentials } from '../types'
import { QrAuth } from './QrAuth'
import './LoginScreen.css'

interface Props {
  onLogin: (credentials: Credentials, remember: boolean) => void
}

const STATE_ERRORS: Record<string, string> = {
  blocked: 'Аккаунт WhatsApp заблокирован',
  suspended: 'На аккаунт наложены временные ограничения',
  yellowCard: 'На аккаунт наложены временные ограничения',
  starting: 'Инстанс запускается, попробуйте через пару минут',
  sleepMode: 'Телефон выключен или не в сети, попробуйте через пару минут',
}

export function LoginScreen({ onLogin }: Props) {
  const [idInstance, setIdInstance] = useState('')
  const [apiTokenInstance, setApiTokenInstance] = useState('')
  const [remember, setRemember] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pendingQr, setPendingQr] = useState<Credentials | null>(null)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    const id = idInstance.trim()
    if (!/^\d{4,}$/.test(id)) {
      setError('idInstance должен состоять только из цифр')
      return
    }

    const credentials: Credentials = {
      apiUrl: defaultApiUrl(id),
      idInstance: id,
      apiTokenInstance: apiTokenInstance.trim(),
    }
    setLoading(true)
    try {
      const state = await getStateInstance(credentials)
      if (state === 'authorized') onLogin(credentials, remember)
      else if (state === 'notAuthorized') setPendingQr(credentials)
      else setError(STATE_ERRORS[state] ?? `Инстанс в состоянии «${state}»`)
    } catch (loginError) {
      setError(loginError instanceof GreenApiError ? loginError.message : 'Не удалось войти')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth pattern">
      {pendingQr ? (
        <QrAuth
          credentials={pendingQr}
          onAuthorized={() => onLogin(pendingQr, remember)}
          onCancel={() => setPendingQr(null)}
        />
      ) : (
        <form className="auth__card" onSubmit={handleSubmit}>
          <div className="auth__head">
            <div className="auth__logo" aria-hidden>
              <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="#fff" strokeWidth="2.4">
                <circle cx="12" cy="12" r="7.5" />
                <path d="M6.5 17.5 5 21l3.8-1.2" strokeLinejoin="round" />
              </svg>
            </div>
            <h1 className="auth__title">Войдите в чат</h1>
            <span className="wa-badge">WhatsApp</span>
            <p className="auth__hint">
              Введите данные инстанса из{' '}
              <a href="https://console.green-api.com" target="_blank" rel="noreferrer">
                консоли GREEN-API
              </a>
            </p>
          </div>

          <label className="field">
            <span className="field__label">idInstance</span>
            <input
              className="field__input"
              value={idInstance}
              onChange={(e) => setIdInstance(e.target.value)}
              inputMode="numeric"
              autoComplete="username"
              placeholder="1101000001"
              required
            />
          </label>

          <label className="field">
            <span className="field__label">apiTokenInstance</span>
            <input
              className="field__input"
              type="password"
              value={apiTokenInstance}
              onChange={(e) => setApiTokenInstance(e.target.value)}
              autoComplete="current-password"
              required
            />
          </label>

          <label className="checkbox">
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
            Запомнить меня на этом устройстве
          </label>

          {error && (
            <p className="error-text" role="alert">
              {error}
            </p>
          )}

          <button className="button button--primary" type="submit" disabled={loading}>
            {loading ? 'Проверяем…' : 'Войти'}
          </button>
        </form>
      )}
    </div>
  )
}
