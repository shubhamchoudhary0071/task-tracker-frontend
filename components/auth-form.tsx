'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Check, Eye, EyeOff, Loader2 } from 'lucide-react'

import { apiMessage, readAuthPayload } from '@/lib/api-error'
import { safeNextPath, saveSession } from '@/lib/auth'
import { cn } from '@/lib/utils'
import apiClient from '@/utils/apiClient'

type Mode = 'login' | 'register'

export default function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter()
  const params = useSearchParams()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<{ username?: string; password?: string }>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const expired = params.get('reason') === 'expired'
  const isRegister = mode === 'register'

  function validate() {
    const next: { username?: string; password?: string } = {}
    const name = username.trim()
    if (!name) next.username = 'Username is required.'
    else if (name.length < 3) next.username = 'Use at least 3 characters.'
    else if (!/^[a-zA-Z0-9_]+$/.test(name)) next.username = 'Use letters, numbers, and underscores only.'
    if (!password) next.password = 'Password is required.'
    else if (password.length < 6) next.password = 'Use at least 6 characters.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Check size={22} strokeWidth={2.5} />
          </span>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight">
            {isRegister ? 'Create your account' : 'Welcome back'}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isRegister ? 'A username and password is all this workspace needs.' : 'Sign in to log today’s tasks.'}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
          {expired && !isRegister ? (
            <p role="status" className="mb-4 rounded-xl border border-amber-600/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-900 dark:text-amber-100">
              Your session expired. Sign in again to continue.
            </p>
          ) : null}
          {formError ? (
            <p role="alert" className="mb-4 rounded-xl border border-rose-600/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-800 dark:text-rose-100">
              {formError}
            </p>
          ) : null}

          <form
            className="space-y-4"
            noValidate
            onSubmit={(event) => {
              event.preventDefault()
              if (!validate()) return
              setPending(true)
              setFormError(null)
              const path = isRegister ? '/task/auth/register' : '/task/auth/login'
              void apiClient
                .post(path, { username: username.trim(), password })
                .then((response) => {
                  const payload = readAuthPayload(response.data)
                  if (!payload.token) {
                    setFormError('The server did not return a session. Try again.')
                    setPending(false)
                    return
                  }
                  saveSession(payload.token, payload.user?.username ?? username.trim())
                  router.replace(safeNextPath(params.get('next')))
                })
                .catch((error: unknown) => {
                  setFormError(apiMessage(error, isRegister ? 'Could not create that account.' : 'Could not sign in.'))
                  setPending(false)
                })
            }}
          >
            <Field
              id="username"
              label="Username"
              autoComplete="username"
              value={username}
              error={errors.username}
              disabled={pending}
              hint={isRegister ? 'Letters, numbers, and underscores.' : undefined}
              onChange={(value) => {
                setUsername(value)
                setErrors((current) => ({ ...current, username: undefined }))
              }}
            />
            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={isRegister ? 'new-password' : 'current-password'}
                  value={password}
                  disabled={pending}
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={errors.password ? 'password-error' : undefined}
                  onChange={(event) => {
                    setPassword(event.target.value)
                    setErrors((current) => ({ ...current, password: undefined }))
                  }}
                  className={cn(
                    'min-h-11 w-full rounded-xl border bg-background px-3 py-2.5 pr-14 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
                    errors.password ? 'border-rose-600' : 'border-input focus-visible:border-ring',
                  )}
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-1 top-1/2 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password ? (
                <p id="password-error" className="mt-1 text-xs text-rose-700 dark:text-rose-300">
                  {errors.password}
                </p>
              ) : null}
            </div>
            <button
              type="submit"
              disabled={pending}
              className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-60"
            >
              {pending ? <Loader2 size={16} className="animate-spin" /> : null}
              {pending ? 'Please wait…' : isRegister ? 'Create account' : 'Sign in'}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-muted-foreground">
            {isRegister ? 'Already have an account?' : 'Need an account?'}{' '}
            <Link
              href={isRegister ? '/login' : '/register'}
              className="inline-flex min-h-11 items-center px-1 font-medium text-primary"
            >
              {isRegister ? 'Sign in' : 'Create one'}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

function Field({
  id,
  label,
  value,
  onChange,
  error,
  disabled,
  hint,
  autoComplete,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  error?: string
  disabled: boolean
  hint?: string
  autoComplete: string
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        value={value}
        disabled={disabled}
        autoComplete={autoComplete}
        autoFocus={id === 'username'}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          'min-h-11 w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
          error ? 'border-rose-600' : 'border-input focus-visible:border-ring',
        )}
      />
      {error ? (
        <p id={`${id}-error`} className="mt-1 text-xs text-rose-700 dark:text-rose-300">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1 text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  )
}
