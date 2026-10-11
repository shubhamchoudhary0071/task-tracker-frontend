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
        text: 'text-emerald-700 dark:text-emerald-300',
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-600/25 dark:border-emerald-400/25',
        dot: 'bg-emerald-500',
      }

    case 'partial':
      return {
        text: 'text-amber-800 dark:text-amber-300',
        bg: 'bg-amber-500/10',
        border: 'border-amber-600/25 dark:border-amber-400/25',
        dot: 'bg-amber-500',
      }

    case 'not_done':
      return {
        text: 'text-rose-700 dark:text-rose-300',
        bg: 'bg-rose-500/10',
        border: 'border-rose-600/25 dark:border-rose-400/25',
        dot: 'bg-rose-500',
      }

    default:
      return {
        text: 'text-muted-foreground',
        bg: 'bg-muted',
        border: 'border-border',
        dot: 'bg-muted-foreground',
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
      return 'Missed'

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