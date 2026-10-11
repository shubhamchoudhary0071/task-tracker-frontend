import axios from 'axios'

export function apiMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const message = (error.response?.data as { message?: unknown } | undefined)?.message
    if (typeof message === 'string' && message.trim()) return message
    if (!error.response) {
      return 'Unable to reach the server. Check your connection and try again.'
    }
  }
  return fallback
}

type AuthPayload = {
  token?: string
  user?: { username?: string }
}

export function readAuthPayload(body: unknown): AuthPayload {
  if (!body || typeof body !== 'object') return {}
  const record = body as { data?: AuthPayload; token?: string; user?: { username?: string } }
  if (record.data && typeof record.data === 'object') return record.data
  return { token: record.token, user: record.user }
}
