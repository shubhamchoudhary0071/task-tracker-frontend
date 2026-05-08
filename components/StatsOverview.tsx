'use client'

import {
  CheckCircle2,
  Minus,
  XCircle,
  Clock,
  Target,
  type LucideIcon,
} from 'lucide-react'

import { cn } from '@/lib/utils'

type Stats = {
  total: number
  done: number
  partial: number
  notDone: number
  pending: number
}

type StatsOverviewProps = {
  stats: Stats
}

type StatCard = {
  label: string
  value: number
  icon: LucideIcon
  color: string
  bgColor: string
  borderColor: string
}

export default function StatsOverview({ stats }: StatsOverviewProps) {
  const cards: StatCard[] = [
    {
      label: 'Total Tasks',
      value: stats.total,
      icon: Target,
      color: 'text-zinc-400',
      bgColor: 'bg-zinc-500/10',
      borderColor: 'border-zinc-500/20',
    },
    {
      label: 'Completed',
      value: stats.done,
      icon: CheckCircle2,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20',
    },
    {
      label: 'Partial',
      value: stats.partial,
      icon: Minus,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/20',
    },
    {
      label: 'Missed',
      value: stats.notDone,
      icon: XCircle,
      color: 'text-rose-400',
      bgColor: 'bg-rose-500/10',
      borderColor: 'border-rose-500/20',
    },
    {
      label: 'Pending',
      value: stats.pending,
      icon: Clock,
      color: 'text-zinc-500',
      bgColor: 'bg-zinc-500/10',
      borderColor: 'border-zinc-500/20',
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5 lg:gap-3">
      {cards.map((card) => {
        const Icon = card.icon

        return (
          <div
            key={card.label}
            className={cn(
              'min-w-0 rounded-xl border bg-[#111113] p-3 transition-colors sm:p-3.5',
              card.borderColor
            )}
          >
            <div className="flex items-center gap-3 lg:block">
              <div
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg lg:h-7 lg:w-7',
                  card.bgColor
                )}
              >
                <Icon size={14} className={card.color} />
              </div>

              <div className="min-w-0 lg:mt-2">
                <div
                  className={cn(
                    'font-mono text-xl font-semibold leading-none sm:text-2xl',
                    card.color
                  )}
                >
                  {card.value}
                </div>

                <div className="mt-1 truncate font-body text-[11px] text-zinc-600">
                  {card.label}
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}