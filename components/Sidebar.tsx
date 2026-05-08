'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  BarChart3,
  History,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import { format } from 'date-fns'

import { cn } from '@/lib/utils'
import { useTaskStore } from '@/store/taskStore'

type NavItem = {
  href: string
  icon: LucideIcon
  label: string
}

const navItems: NavItem[] = [
  { href: '/', icon: LayoutDashboard, label: 'Today' },
  { href: '/history', icon: History, label: 'History' },
  { href: '/reports', icon: BarChart3, label: 'Reports' },
]

const CIRCLE_RADIUS = 14
const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * CIRCLE_RADIUS

export default function Sidebar() {
  const pathname = usePathname()
  const { getTodayStats } = useTaskStore()

  const stats = getTodayStats()
  const todayLabel = format(new Date(), 'EEE, MMM d')

  const completionPct =
    stats.total > 0
      ? Math.round(((stats.done + stats.partial * 0.5) / stats.total) * 100)
      : 0

  const progressStroke =
    completionPct >= 80
      ? '#10b981'
      : completionPct >= 40
        ? '#f59e0b'
        : '#f43f5e'

  return (
    <>
      {/* Mobile Top Bar */}
      <header className="fixed left-0 right-0 top-0 z-50 border-b border-zinc-800/60 bg-[#111113]/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500">
              <Zap size={15} className="fill-black text-black" />
            </div>

            <div className="min-w-0">
              <div className="truncate font-syne text-sm font-bold tracking-tight text-zinc-100">
                TaskFlow
              </div>
              <div className="font-mono text-[11px] text-zinc-500">
                {todayLabel}
              </div>
            </div>
          </div>

          <div className="shrink-0 text-right">
            <div className="font-mono text-xs font-semibold text-zinc-100">
              {completionPct}%
            </div>
            <div className="font-mono text-[10px] text-zinc-500">
              {stats.total} tasks
            </div>
          </div>
        </div>

        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-zinc-800">
          <div
            className="h-full rounded-full bg-amber-500 transition-all duration-500"
            style={{ width: `${completionPct}%` }}
          />
        </div>
      </header>

      {/* Desktop Sidebar */}
      <aside className="fixed left-0 top-0 z-50 hidden h-screen w-[220px] flex-col border-r border-zinc-800/60 bg-[#111113] lg:flex">
        {/* Logo */}
        <div className="border-b border-zinc-800/60 p-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500">
              <Zap size={14} className="fill-black text-black" />
            </div>

            <span className="font-syne text-[15px] font-bold tracking-tight text-zinc-100">
              TaskFlow
            </span>
          </div>

          <div className="mt-3 font-mono text-xs text-zinc-500">
            {todayLabel}
          </div>
        </div>

        {/* Today's Progress */}
        <div className="border-b border-zinc-800/60 px-5 py-4">
          <div className="mb-2 font-mono text-[11px] uppercase tracking-widest text-zinc-500">
            Today&apos;s Progress
          </div>

          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10">
              <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
                <circle
                  cx="18"
                  cy="18"
                  r={CIRCLE_RADIUS}
                  fill="none"
                  stroke="#27272a"
                  strokeWidth="3.5"
                />

                <circle
                  cx="18"
                  cy="18"
                  r={CIRCLE_RADIUS}
                  fill="none"
                  stroke={progressStroke}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeDasharray={`${
                    (completionPct / 100) * CIRCLE_CIRCUMFERENCE
                  } ${CIRCLE_CIRCUMFERENCE}`}
                  className="transition-all duration-500"
                />
              </svg>

              <span className="absolute inset-0 flex items-center justify-center font-mono text-[9px] font-semibold text-zinc-200">
                {completionPct}%
              </span>
            </div>

            <div className="flex-1 space-y-1">
              <div className="flex justify-between font-mono text-[11px]">
                <span className="text-emerald-400">{stats.done} done</span>
                <span className="text-amber-400">
                  {stats.partial} partial
                </span>
              </div>

              <div className="flex justify-between font-mono text-[11px]">
                <span className="text-rose-400">{stats.notDone} missed</span>
                <span className="text-zinc-500">{stats.pending} left</span>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Nav */}
        <nav className="flex-1 space-y-0.5 px-3 py-3">
          {navItems.map(({ href, icon: Icon, label }) => {
            const active = pathname === href

            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-all duration-150',
                  active
                    ? 'bg-amber-500/10 font-medium text-amber-400'
                    : 'text-zinc-500 hover:bg-zinc-800/50 hover:text-zinc-200'
                )}
              >
                <Icon size={15} />

                <span className="font-body">{label}</span>

                {active && (
                  <span className="ml-auto h-1 w-1 rounded-full bg-amber-400" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Bottom Stats */}
        <div className="border-t border-zinc-800/60 p-5">
          <div className="font-mono text-[11px] text-zinc-600">
            {stats.total} active tasks
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-800/60 bg-[#111113]/95 px-2 pb-[env(safe-area-inset-bottom)] pt-2 backdrop-blur lg:hidden">
        <div className="grid grid-cols-3 gap-1">
          {navItems.map(({ href, icon: Icon, label }) => {
            const active = pathname === href

            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[11px] transition-all',
                  active
                    ? 'bg-amber-500/10 text-amber-400'
                    : 'text-zinc-500 hover:bg-zinc-800/60 hover:text-zinc-300'
                )}
              >
                <Icon size={17} />

                <span className="font-body">{label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}