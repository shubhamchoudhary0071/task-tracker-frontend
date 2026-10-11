export const TOKEN_KEY = 'taskflow_token'
export const USER_KEY = 'taskflow_username'
export const AUTH_EVENT = 'taskflow-auth'

type JwtPayload = {
  exp?: number
}

export function readToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TOKEN_KEY)
}

export function readUsername(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(USER_KEY)
}

export function notifyAuthChange(): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(AUTH_EVENT))
}

export function saveSession(token: string, username?: string): void {
  localStorage.setItem(TOKEN_KEY, token)
  if (username) localStorage.setItem(USER_KEY, username)
  notifyAuthChange()
}

export function clearSession(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
  notifyAuthChange()
}

export function jwtExp(token: string): number | null {
  try {
    const part = token.split('.')[1]
    if (!part) return null
    const base64 = part.replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=')
    const payload = JSON.parse(atob(padded)) as JwtPayload
    return typeof payload.exp === 'number' ? payload.exp : null
  } catch {
    return null
  }
}

export function isExpired(token: string): boolean {
  const exp = jwtExp(token)
  if (exp == null) return false
  return exp * 1000 <= Date.now() + 5_000
}

export function safeNextPath(value: string | null): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/'
  return value
}
