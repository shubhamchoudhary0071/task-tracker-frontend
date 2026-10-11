'use client'

import { useEffect, useSyncExternalStore } from 'react'
import { usePathname, useRouter } from 'next/navigation'

import { AUTH_EVENT, clearSession, isExpired, readToken } from '@/lib/auth'

const PUBLIC_ROUTES = ['/login', '/register']

type AuthStatus = 'unknown' | 'in' | 'out' | 'expired'

function subscribe(onStoreChange: () => void) {
  window.addEventListener('storage', onStoreChange)
  window.addEventListener(AUTH_EVENT, onStoreChange)
  return () => {
    window.removeEventListener('storage', onStoreChange)
    window.removeEventListener(AUTH_EVENT, onStoreChange)
  }
}

function getSnapshot(): AuthStatus {
  const token = readToken()
  if (!token) return 'out'
  if (isExpired(token)) return 'expired'
  return 'in'
}

function BootScreen() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm space-y-3" aria-hidden="true">
        <div className="mx-auto h-10 w-10 animate-pulse rounded-2xl bg-muted" />
        <div className="h-4 animate-pulse rounded-full bg-muted" />
        <div className="h-4 w-2/3 animate-pulse rounded-full bg-muted" />
      </div>
      <span className="sr-only">Loading TaskFlow</span>
    </div>
  )
}

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const status = useSyncExternalStore(subscribe, getSnapshot, () => 'unknown' as AuthStatus)
  const isPublic = PUBLIC_ROUTES.includes(pathname)

  useEffect(() => {
    if (status === 'expired') {
      clearSession()
      if (!isPublic) router.replace('/login?reason=expired')
      return
    }

    if (status === 'out' && !isPublic) {
      router.replace('/login')
    }

    if (status === 'in' && isPublic) {
      router.replace('/')
    }
  }, [isPublic, router, status])

  useEffect(() => {
    const watch = () => {
      const token = readToken()
      if (token && isExpired(token)) clearSession()
    }
    const interval = window.setInterval(watch, 30_000)
    document.addEventListener('visibilitychange', watch)
    return () => {
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', watch)
    }
  }, [])

  const waiting =
    status === 'unknown' ||
    status === 'expired' ||
    (status === 'out' && !isPublic) ||
    (status === 'in' && isPublic)

  if (waiting) return <BootScreen />

  return children
}
