'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useSyncExternalStore } from 'react'
import { useTheme } from 'next-themes'
import { format } from 'date-fns'
import {
  BarChart3,
  Check,
  History,
  LayoutDashboard,
  LogOut,
  Moon,
  Search,
  Sun,
} from 'lucide-react'

import TaskDialogs from '@/components/task-dialogs'
import { AUTH_EVENT, clearSession, readUsername } from '@/lib/auth'
import { cn } from '@/lib/utils'
import { daySummary, todayKey } from '@/lib/tasks'
import { useTaskStore } from '@/store/taskStore'

const NAV = [
  { href: '/', label: 'Today', icon: LayoutDashboard },
  { href: '/history', label: 'History', icon: History },
  { href: '/reports', label: 'Reports', icon: BarChart3 },
]

function useUsername() {
  return useSyncExternalStore(
    (onChange) => {
      window.addEventListener(AUTH_EVENT, onChange)
      window.addEventListener('storage', onChange)
      return () => {
        window.removeEventListener(AUTH_EVENT, onChange)
        window.removeEventListener('storage', onChange)
      }
    },
    () => readUsername() ?? 'Signed in',
    () => 'Signed in',
  )
}

function useMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  )
}

function ThemeButton({ className }: { className?: string }) {
  const mounted = useMounted()
  const { resolvedTheme, setTheme } = useTheme()
  const dark = resolvedTheme !== 'light'
  const label = dark ? 'Switch to light theme' : 'Switch to dark theme'

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={() => setTheme(dark ? 'light' : 'dark')}
      className={cn(
        'inline-flex size-11 items-center justify-center rounded-xl border border-border bg-card text-foreground hover:bg-accent',
        className,
      )}
    >
      {mounted ? (dark ? <Sun size={16} /> : <Moon size={16} />) : <span className="size-4" />}
    </button>
  )
}

function openCommandMenu() {
  window.dispatchEvent(new Event('taskflow:command'))
}

function logout() {
  clearSession()
  window.location.href = '/login'
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const username = useUsername()
  const tasks = useTaskStore((state) => state.tasks)
  const logs = useTaskStore((state) => state.logs)
  const fetchTasks = useTaskStore((state) => state.fetchTasks)
  const fetchLogsForDate = useTaskStore((state) => state.fetchLogsForDate)
  const summary = daySummary(tasks, logs, todayKey())

  useEffect(() => {
    void fetchTasks()
    void fetchLogsForDate(todayKey())
  }, [fetchLogsForDate, fetchTasks])
  const todayLabel = format(new Date(), 'EEE, MMM d')

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-card focus:px-3 focus:py-2"
      >
        Skip to content
      </a>

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
        <div className="border-b border-sidebar-border px-5 py-5">
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Check size={16} strokeWidth={2.5} />
            </span>
            <div>
              <div className="text-sm font-semibold tracking-tight">TaskFlow</div>
              <div className="text-xs text-muted-foreground">{todayLabel}</div>
            </div>
          </div>
        </div>

        <div className="border-b border-sidebar-border px-5 py-4">
          <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Today
          </div>
          <div className="mt-3 flex items-center gap-3">
            <ProgressRing value={summary.score} />
            <div className="min-w-0 space-y-1 text-xs">
              <div className="flex justify-between gap-3">
                <span className="text-emerald-700 dark:text-emerald-300">{summary.done} done</span>
                <span className="text-amber-800 dark:text-amber-300">{summary.partial} partial</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-rose-700 dark:text-rose-300">{summary.notDone} missed</span>
                <span className="text-muted-foreground">{summary.pending} open</span>
              </div>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-3" aria-label="Primary">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm',
                  active
                    ? 'bg-accent font-medium text-accent-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                <Icon size={16} />
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="space-y-3 border-t border-sidebar-border p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="truncate text-sm font-medium">{username}</div>
              <div className="text-xs text-muted-foreground">{summary.total} active tasks</div>
            </div>
            <ThemeButton />
          </div>
          <button
            type="button"
            onClick={logout}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-border px-3 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-border bg-background/90 px-4 py-3 backdrop-blur lg:hidden">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Check size={15} strokeWidth={2.5} />
              </span>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold">TaskFlow</div>
                <div className="text-[11px] text-muted-foreground">
                  {todayLabel} · {summary.score}%
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={openCommandMenu}
                aria-label="Open command menu"
                className="inline-flex size-11 items-center justify-center rounded-xl border border-border bg-card"
              >
                <Search size={16} />
              </button>
              <ThemeButton />
            </div>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-[width]"
              style={{ width: `${summary.score}%` }}
            />
          </div>
        </header>

        <main id="main" className="mx-auto w-full max-w-6xl px-4 pb-28 pt-5 sm:px-6 lg:px-8 lg:pb-10 lg:pt-8">
          {children}
        </main>
      </div>

      <nav
        className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 px-2 pt-2 backdrop-blur lg:hidden"
        style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
        aria-label="Primary"
      >
        <div className="grid grid-cols-3 gap-1">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex min-h-11 flex-col items-center justify-center gap-1 rounded-xl px-2 py-1.5 text-[11px]',
                  active ? 'bg-accent text-accent-foreground' : 'text-muted-foreground',
                )}
              >
                <Icon size={16} />
                {label}
              </Link>
            )
          })}
        </div>
      </nav>

      <TaskDialogs />
    </div>
  )
}

function ProgressRing({ value }: { value: number }) {
  const radius = 16
  const circumference = 2 * Math.PI * radius
  const dash = (Math.max(0, Math.min(100, value)) / 100) * circumference

  return (
    <div className="relative size-12 shrink-0" aria-hidden="true">
      <svg viewBox="0 0 40 40" className="size-full -rotate-90">
        <circle cx="20" cy="20" r={radius} fill="none" className="stroke-muted" strokeWidth="4" />
        <circle
          cx="20"
          cy="20"
          r={radius}
          fill="none"
          className="stroke-primary"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold">
        {value}%
      </span>
    </div>
  )
}
