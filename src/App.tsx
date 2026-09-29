import { useState } from 'react'
import { LoginScreen } from './components/LoginScreen'
import { Messenger } from './components/Messenger'
import type { Credentials } from './types'
import { clearChats, clearCredentials, loadCredentials, saveCredentials } from './utils/storage'

interface Session {
  credentials: Credentials
  remember: boolean
}

export default function App() {
  const [session, setSession] = useState<Session | null>(loadCredentials)

  const handleLogin = (credentials: Credentials, remember: boolean) => {
    saveCredentials(credentials, remember)
    setSession({ credentials, remember })
  }

  const handleLogout = () => {
    if (session) clearChats(session.credentials.idInstance)
    clearCredentials()
    setSession(null)
  }

  if (!session) return <LoginScreen onLogin={handleLogin} />

  return (
    <Messenger
      key={session.credentials.idInstance}
      credentials={session.credentials}
      remember={session.remember}
      onLogout={handleLogout}
    />
  )
}
