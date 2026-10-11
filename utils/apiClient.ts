import axios from 'axios'

import { clearSession, isExpired, readToken } from '@/lib/auth'

const API_URL =
  process.env.NEXT_PUBLIC_ENV === 'development'
    ? process.env.NEXT_PUBLIC_API_URL_TEST
    : process.env.NEXT_PUBLIC_API_URL

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

const PUBLIC_AUTH_ROUTES = ['/task/auth/login', '/task/auth/register']

function isPublicAuth(url?: string): boolean {
  return PUBLIC_AUTH_ROUTES.some((route) => url?.includes(route))
}

apiClient.interceptors.request.use(
  (config) => {
    if (isPublicAuth(config.url) || typeof window === 'undefined') return config

    const token = readToken()
    if (!token) return config

    if (isExpired(token)) {
      clearSession()
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login?reason=expired'
      }
      return Promise.reject(new axios.CanceledError('Session expired'))
    }

    config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (error) => Promise.reject(error),
)

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status
    const url = error?.config?.url as string | undefined

    if (status === 401 && typeof window !== 'undefined' && !isPublicAuth(url)) {
      clearSession()
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login?reason=expired'
      }
    }

    return Promise.reject(error)
  },
)

export default apiClient
