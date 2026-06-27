import * as SecureStore from 'expo-secure-store'

const TOKEN_KEY = 'altiflow_jwt'

// The base URL of the AltiFlow Next.js API
// Set EXPO_PUBLIC_API_BASE in .env to your deployment URL
export const API_BASE = (process.env.EXPO_PUBLIC_API_BASE || 'http://localhost:3000/api').replace(/\/+$/, '')

export async function getToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY)
  } catch {
    return null
  }
}

export async function setToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token)
}

export async function clearToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY)
}

export async function api<T = any>(
  path: string,
  opts: RequestInit & { skipAuth?: boolean } = {}
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(opts.headers as Record<string, string> || {}),
  }

  if (!opts.skipAuth) {
    const token = await getToken()
    if (token) headers['Authorization'] = `Bearer ${token}`
  }

  const url = `${API_BASE}${path}`
  const res = await fetch(url, {
    cache: 'no-store',
    ...opts,
    headers,
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error((data as any)?.error || `HTTP ${res.status}`)
  }
  return data as T
}
