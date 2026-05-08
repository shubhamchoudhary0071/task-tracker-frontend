import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, parseISO } from 'date-fns'

export type Status = 'done' | 'partial' | 'not_done' | 'pending'

export type StatusColor = {
  text: string
  bg: string
  border: string
  dot: string
}

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

export function getStatusColor(status: Status | string): StatusColor {
  switch (status) {
    case 'done':
      return {
        text: 'text-emerald-400',
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/20',
        dot: 'bg-emerald-400',
      }

    case 'partial':
      return {
        text: 'text-amber-400',
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/20',
        dot: 'bg-amber-400',
      }

    case 'not_done':
      return {
        text: 'text-rose-400',
        bg: 'bg-rose-500/10',
        border: 'border-rose-500/20',
        dot: 'bg-rose-400',
      }

    default:
      return {
        text: 'text-zinc-500',
        bg: 'bg-zinc-500/10',
        border: 'border-zinc-500/20',
        dot: 'bg-zinc-500',
      }
  }
}

export function getStatusLabel(status: Status | string): string {
  switch (status) {
    case 'done':
      return 'Done'

    case 'partial':
      return 'Partial'

    case 'not_done':
      return 'Not Done'

    default:
      return 'Pending'
  }
}

export function getCompletionPercent(completed: number, target: number): number {
  if (!target || target <= 0) return 0

  return Math.min(100, Math.round((completed / target) * 100))
}

export function formatDate(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'MMM d, yyyy')
  } catch {
    return dateStr
  }
}

export function today(): string {
  return format(new Date(), 'yyyy-MM-dd')
}