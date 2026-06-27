import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { User } from '../lib/types'
import { login as doLogin, logout as doLogout, fetchCurrentUser } from '../lib/auth'
import { getToken } from '../lib/api'

interface AuthContextValue {
  user: User | null
  token: string | null
  loading: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    const t = await getToken()
    setToken(t)
    if (t) {
      const u = await fetchCurrentUser()
      setUser(u)
    } else {
      setUser(null)
    }
  }, [])

  useEffect(() => {
    refresh().finally(() => setLoading(false))
  }, [refresh])

  const login = async (username: string, password: string) => {
    const result = await doLogin(username, password)
    setToken(result.token)
    setUser(result.user)
  }

  const logout = async () => {
    await doLogout()
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
