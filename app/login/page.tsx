'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Zap, Loader2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import apiClient from '@/utils/apiClient'

type FormState = {
  username: string
  password: string
}

type FieldError = {
  username?: string
  password?: string
}

export default function LoginPage() {
  const router = useRouter()

  const [form, setForm] = useState<FormState>({ username: '', password: '' })
  const [errors, setErrors] = useState<FieldError>({})
  const [apiError, setApiError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  function validate(): boolean {
    const newErrors: FieldError = {}
    if (!form.username.trim()) newErrors.username = 'Username is required'
    else if (form.username.trim().length < 3) newErrors.username = 'At least 3 characters'
    if (!form.password) newErrors.password = 'Password is required'
    else if (form.password.length < 6) newErrors.password = 'At least 6 characters'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    setIsLoading(true)
    setApiError(null)

    try {
      const res = await apiClient.post('/task/auth/login', {
          username: form.username.trim(),
          password: form.password,
        })

      const {data:response} =  res;

      const {data} = response;

      console.log("data",data);

      // Store token if returned
      if (data?.token) {
        localStorage.setItem('taskflow_token', data.token)
      }

      router.push('/')
    } catch {
      setApiError('Unable to connect. Check your internet and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  function handleField(key: keyof FormState, value: string) {
    setForm((p) => ({ ...p, [key]: value }))
    if (errors[key]) setErrors((p) => ({ ...p, [key]: undefined }))
    if (apiError) setApiError(null)
  }

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#0a0a0b] px-4">

      {/* ── Background grid lines ── */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            'linear-gradient(#a1a1aa 1px, transparent 1px), linear-gradient(90deg, #a1a1aa 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* ── Amber glow blob ── */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="h-[480px] w-[480px] rounded-full bg-amber-500/5 blur-[120px]" />
      </div>

      {/* ── Card ── */}
      <div className="relative z-10 w-full max-w-sm animate-slide-up">

        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500 shadow-lg shadow-amber-500/25">
            <Zap size={22} className="fill-black text-black" />
          </div>
          <div className="text-center">
            <h1 className="font-syne text-2xl font-bold tracking-tight text-zinc-100">
              TaskFlow
            </h1>
            <p className="mt-1 font-body text-sm text-zinc-500">
              Sign in to your workspace
            </p>
          </div>
        </div>

        {/* Form card */}
        <div className="rounded-2xl border border-zinc-800/80 bg-[#111113] p-6 shadow-2xl">

          {/* API error banner */}
          {apiError && (
            <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3.5 py-3 animate-fade-in">
              <AlertCircle size={14} className="mt-px shrink-0 text-rose-400" />
              <p className="font-body text-xs leading-relaxed text-rose-300">{apiError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">

            {/* Username */}
            <div className="space-y-1.5">
              <label
                htmlFor="username"
                className="block font-mono text-[11px] uppercase tracking-widest text-zinc-500"
              >
                Username
              </label>
              <input
                id="username"
                type="text"
                autoComplete="username"
                autoFocus
                value={form.username}
                disabled={isLoading}
                onChange={(e) => handleField('username', e.target.value)}
                placeholder="your_username"
                className={cn(
                  'w-full rounded-xl border bg-zinc-800/50 px-4 py-3 font-mono text-sm text-zinc-200 placeholder-zinc-600 outline-none transition-all duration-150',
                  'focus:ring-1',
                  errors.username
                    ? 'border-rose-500/50 focus:border-rose-500/70 focus:ring-rose-500/20'
                    : 'border-zinc-700/50 focus:border-amber-500/50 focus:ring-amber-500/20',
                  isLoading && 'cursor-not-allowed opacity-50'
                )}
              />
              {errors.username && (
                <p className="font-body text-[11px] text-rose-400">{errors.username}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="block font-mono text-[11px] uppercase tracking-widest text-zinc-500"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={form.password}
                  disabled={isLoading}
                  onChange={(e) => handleField('password', e.target.value)}
                  placeholder="••••••••"
                  className={cn(
                    'w-full rounded-xl border bg-zinc-800/50 px-4 py-3 pr-11 font-mono text-sm text-zinc-200 placeholder-zinc-600 outline-none transition-all duration-150',
                    'focus:ring-1',
                    errors.password
                      ? 'border-rose-500/50 focus:border-rose-500/70 focus:ring-rose-500/20'
                      : 'border-zinc-700/50 focus:border-amber-500/50 focus:ring-amber-500/20',
                    isLoading && 'cursor-not-allowed opacity-50'
                  )}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 transition-colors hover:text-zinc-400"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.password && (
                <p className="font-body text-[11px] text-rose-400">{errors.password}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className={cn(
                'mt-2 flex w-full items-center justify-center gap-2 rounded-xl py-3 font-mono text-sm font-semibold transition-all duration-150',
                'bg-amber-500 text-black hover:bg-amber-400',
                'shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30',
                'disabled:cursor-not-allowed disabled:opacity-50'
              )}
            >
              {isLoading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Signing in…
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-zinc-800" />
            <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-600">or</span>
            <div className="h-px flex-1 bg-zinc-800" />
          </div>

          {/* Sign up link */}
          <p className="text-center font-body text-xs text-zinc-600">
            Don&apos;t have an account?{' '}
            <a
              href="/register"
              className="font-medium text-amber-500 transition-colors hover:text-amber-400 hover:underline"
            >
              Create one
            </a>
          </p>
        </div>

        {/* Footer note */}
        <p className="mt-6 text-center font-mono text-[10px] text-zinc-700">
          Your tasks reset daily · Progress tracked forever
        </p>
      </div>
    </div>
  )
}