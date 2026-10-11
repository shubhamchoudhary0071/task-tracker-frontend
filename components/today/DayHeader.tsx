'use client'

import { format, parseISO } from 'date-fns'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'

import type { DaySummary } from '@/lib/types'
import { cn } from '@/lib/utils'

export default function DayHeader({
  selectedDate,
  today,
  summary,
  onMove,
  onSelectDate,
  onCreate,
}: {
  selectedDate: string
  today: string
  summary: DaySummary
  onMove: (delta: number) => void
  onSelectDate: (date: string) => void
  onCreate: () => void
}) {
  const isToday = selectedDate === today

  return (
    <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
          {isToday ? 'Live day' : 'Past day'}
        </p>
        <h1 className="mt-1 truncate text-3xl font-semibold tracking-tight">
          {isToday ? 'Today' : format(parseISO(selectedDate), 'EEEE')}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {format(parseISO(selectedDate), 'MMMM d, yyyy')} · {summary.done} of {summary.total} done
          {summary.pending > 0 ? ` · ${summary.pending} still open` : ''}
        </p>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="flex items-center rounded-xl border border-border bg-card">
          <button
            type="button"
            aria-label="Previous day"
            onClick={() => onMove(-1)}
            className="inline-flex size-11 items-center justify-center"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={() => onSelectDate(today)}
            className={cn(
              'inline-flex min-h-11 items-center px-3 text-sm',
              isToday ? 'text-primary' : 'text-muted-foreground',
            )}
          >
            Today
          </button>
          <button
            type="button"
            aria-label="Next day"
            disabled={isToday}
            onClick={() => onMove(1)}
            className="inline-flex size-11 items-center justify-center disabled:opacity-40"
          >
            <ChevronRight size={16} />
          </button>
        </div>
        <label className="sr-only" htmlFor="jump-date">
          Jump to date
        </label>
        <input
          id="jump-date"
          type="date"
          max={today}
          value={selectedDate}
          onChange={(event) => {
            if (event.target.value && event.target.value <= today) onSelectDate(event.target.value)
          }}
          className="min-h-11 w-full max-w-full rounded-xl border border-border bg-card px-3 text-sm sm:w-auto"
        />
        <button
          type="button"
          onClick={onCreate}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground"
        >
          <Plus size={15} />
          New task
        </button>
      </div>
    </div>
  )
}
