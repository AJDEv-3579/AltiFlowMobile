import { api, setToken, clearToken, getToken } from './api'
import type { User, AuthState } from './types'

export interface LoginResult {
  token: string
  user: User
}

export async function login(username: string, password: string): Promise<LoginResult> {
  const data = await api<{ token: string; user: User }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
    skipAuth: true,
  })
  await setToken(data.token)
  return data
}

export async function logout(): Promise<void> {
  await clearToken()
}

export async function fetchCurrentUser(): Promise<User | null> {
  try {
    const token = await getToken()
    if (!token) return null
    const data = await api<{ user: User }>('/auth/me')
    return data.user
  } catch {
    return null
  }
}

export async function changePassword(
  currentPassword: string,
  newPassword: string,
  keyFileContent?: string
): Promise<{ success: boolean; passkey_file?: { file_name: string; file_content: string } }> {
  return api('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({
      current_password: currentPassword,
      new_password: newPassword,
      key_file_content: keyFileContent,
    }),
  })
}

export const INTERNAL_ROLES = ['Super-Admin', 'Admin']
export const CLIENT_ROLES = ['Client-Admin', 'Client-User']

export function isInternal(role?: string) {
  return INTERNAL_ROLES.includes(role || '')
}
export function isClient(role?: string) {
  return CLIENT_ROLES.includes(role || '')
}
export function isSuperAdmin(role?: string) {
  return role === 'Super-Admin'
}
export function isAdmin(role?: string) {
  return role === 'Admin'
}
export function isClientAdmin(role?: string) {
  return role === 'Client-Admin'
}
export function isClientUser(role?: string) {
  return role === 'Client-User'
}
