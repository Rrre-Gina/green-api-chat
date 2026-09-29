import { useEffect, useRef, useState } from 'react'
import { getQr, GreenApiError } from '../api/greenApi'
import type { Credentials } from '../types'

interface Props {
  credentials: Credentials
  onAuthorized: () => void
  onCancel: () => void
}

const QR_REFRESH_MS = 3000

export function QrAuth({ credentials, onAuthorized, onCancel }: Props) {
  const [qr, setQr] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const onAuthorizedRef = useRef(onAuthorized)
  useEffect(() => {
    onAuthorizedRef.current = onAuthorized
  })

  useEffect(() => {
    let cancelled = false
    let timer: ReturnType<typeof setTimeout>

    const tick = async () => {
      try {
        const response = await getQr(credentials)
        if (cancelled) return
        if (response.type === 'alreadyLogged') {
          onAuthorizedRef.current()
          return
        }
        if (response.type === 'qrCode') {
          setQr(`data:image/png;base64,${response.message}`)
          setError(null)
        } else if (response.type === 'error') {
          setError(response.message)
        }
      } catch (qrError) {
        if (!cancelled) setError(qrError instanceof GreenApiError ? qrError.message : 'Не удалось получить QR-код')
      }
      if (!cancelled) timer = setTimeout(tick, QR_REFRESH_MS)
    }

    void tick()
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [credentials])

  return (
    <div className="auth__card auth__card--qr">
      <div className="qr__image">
        {qr ? <img src={qr} alt="QR-код для входа в WhatsApp" /> : <div className="spinner" aria-label="Загрузка" />}
      </div>
      <h1 className="auth__title">Привяжите WhatsApp по QR-коду</h1>
      <p className="auth__hint">
        В WhatsApp откройте «Настройки» → «Связанные устройства» → «Привязка устройства» и наведите камеру на код
      </p>
      {error && (
        <p className="error-text" role="alert">
          {error}
        </p>
      )}
      <button className="link-button" type="button" onClick={onCancel}>
        Войти с другими данными
      </button>
    </div>
  )
}
