import type { Chat, Credentials } from '../types'

const CREDENTIALS_KEY = 'green-chat:credentials'
const chatsKey = (idInstance: string) => `green-chat:chats:${idInstance}`

function safe<T>(fn: () => T, fallback: T): T {
  try {
    return fn()
  } catch {
    return fallback
  }
}

function storages(): Storage[] {
  return safe(() => [sessionStorage, localStorage], [])
}

export function loadCredentials(): { credentials: Credentials; remember: boolean } | null {
  return safe(() => {
    const fromSession = sessionStorage.getItem(CREDENTIALS_KEY)
    if (fromSession) return { credentials: JSON.parse(fromSession) as Credentials, remember: false }
    const fromLocal = localStorage.getItem(CREDENTIALS_KEY)
    if (fromLocal) return { credentials: JSON.parse(fromLocal) as Credentials, remember: true }
    return null
  }, null)
}

export function saveCredentials(credentials: Credentials, remember: boolean) {
  safe(() => {
    clearCredentials()
    ;(remember ? localStorage : sessionStorage).setItem(CREDENTIALS_KEY, JSON.stringify(credentials))
  }, undefined)
}

export function clearCredentials() {
  for (const storage of storages()) safe(() => storage.removeItem(CREDENTIALS_KEY), undefined)
}

export function loadChats(idInstance: string, remember: boolean): Chat[] {
  return safe(() => {
    const raw = (remember ? localStorage : sessionStorage).getItem(chatsKey(idInstance))
    return raw ? (JSON.parse(raw) as Chat[]) : []
  }, [])
}

export function saveChats(idInstance: string, remember: boolean, chats: Chat[]) {
  safe(() => (remember ? localStorage : sessionStorage).setItem(chatsKey(idInstance), JSON.stringify(chats)), undefined)
}

export function clearChats(idInstance: string) {
  for (const storage of storages()) safe(() => storage.removeItem(chatsKey(idInstance)), undefined)
}
