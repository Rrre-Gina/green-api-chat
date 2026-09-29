import { useEffect, useRef, useState } from 'react'
import { deleteNotification, GreenApiError, receiveNotification, type Notification } from '../api/greenApi'
import type { Credentials } from '../types'

export type PollingStatus = 'connecting' | 'online' | 'error'

const sleep = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve) => {
    const timer = setTimeout(resolve, ms)
    signal.addEventListener('abort', () => {
      clearTimeout(timer)
      resolve()
    }, { once: true })
  })

export function useNotificationPolling(
  credentials: Credentials | null,
  onNotification: (notification: Notification) => void,
) {
  const [status, setStatus] = useState<PollingStatus>('connecting')
  const [error, setError] = useState<string | null>(null)

  const handlerRef = useRef(onNotification)
  useEffect(() => {
    handlerRef.current = onNotification
  })

  useEffect(() => {
    if (!credentials) return
    const controller = new AbortController()
    const { signal } = controller

    const loop = async () => {
      let retryDelay = 1000
      setStatus('connecting')
      while (!signal.aborted) {
        try {
          const notification = await receiveNotification(credentials, signal)
          setStatus('online')
          setError(null)
          retryDelay = 1000
          if (!notification) continue

          try {
            handlerRef.current(notification)
          } catch (handlerError) {
            console.error('Не удалось обработать уведомление', handlerError)
          }
          await deleteNotification(credentials, notification.receiptId, signal)
        } catch (pollError) {
          if (signal.aborted) return
          const rateLimited = pollError instanceof GreenApiError && pollError.status === 429
          if (!rateLimited) {
            setStatus('error')
            setError(pollError instanceof GreenApiError ? pollError.message : 'Ошибка получения сообщений')
          }
          await sleep(retryDelay, signal)
          retryDelay = Math.min(retryDelay * 2, 30_000)
        }
      }
    }

    void loop()
    return () => controller.abort()
  }, [credentials])

  return { status, error }
}
