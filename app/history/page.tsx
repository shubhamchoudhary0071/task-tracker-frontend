'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  eachDayOfInterval,
  endOfMonth,
  format,
  isSameMonth,
  isToday,
  parseISO,
  startOfMonth,
} from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import AppShell from '@/components/app-shell'
import { historyTasks, logFor, summarizeTasks, todayKey } from '@/lib/tasks'
import { cn, getStatusColor, getStatusLabel } from '@/lib/utils'
import { useTaskStore } from '@/store/taskStore'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function HistoryPage() {
  const tasks = useTaskStore((state) => state.tasks)
  const logs = useTaskStore((state) => state.logs)
  const tasksLoading = useTaskStore((state) => state.tasksLoading)
  const logsError = useTaskStore((state) => state.logsError)
  const selectedDate = useTaskStore((state) => state.selectedDate)
  const setSelectedDate = useTaskStore((state) => state.setSelectedDate)
  const fetchTasks = useTaskStore((state) => state.fetchTasks)
  const fetchLogsInRange = useTaskStore((state) => state.fetchLogsInRange)
  const loadedDates = useTaskStore((state) => state.loadedDates)
  const [month, setMonth] = useState(() => startOfMonth(parseISO(selectedDate)))

  const start = format(startOfMonth(month), 'yyyy-MM-dd')
  const end = format(endOfMonth(month), 'yyyy-MM-dd')
  const today = todayKey()

  useEffect(() => {
    void fetchTasks()
  }, [fetchTasks])

  useEffect(() => {
    void fetchLogsInRange(start, end)
  }, [end, fetchLogsInRange, start])

  const days = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) })
  const leading = startOfMonth(month).getDay()
  const monthReady = loadedDates.includes(start)
  const dayTasks = useMemo(
    () => historyTasks(tasks, logs, selectedDate),
    [logs, selectedDate, tasks],
  )
  const selectedSummary = summarizeTasks(dayTasks, logs, selectedDate)

  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight">History</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pick a day to see what was logged. Future days stay closed.
        </p>
      </div>

      {logsError ? (
        <p role="alert" className="mb-4 rounded-2xl border border-rose-600/30 bg-rose-500/10 px-4 py-3 text-sm">
          {logsError}
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <section className="rounded-2xl border border-border bg-card p-4 sm:p-5">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold">{format(month, 'MMMM yyyy')}</h2>
            <div className="flex items-center rounded-xl border border-border">
              <button type="button" aria-label="Previous month" onClick={() => setMonth((value) => new Date(value.getFullYear(), value.getMonth() - 1, 1))} className="px-3 py-2">
                <ChevronLeft size={16} />
              </button>
              <button type="button" onClick={() => setMonth(startOfMonth(new Date()))} className="px-3 py-2 text-sm text-muted-foreground">
                This month
              </button>
              <button
                type="button"
                aria-label="Next month"
                disabled={isSameMonth(month, new Date())}
                onClick={() => setMonth((value) => new Date(value.getFullYear(), value.getMonth() + 1, 1))}
                className="px-3 py-2 disabled:opacity-40"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {WEEKDAYS.map((day) => (
              <div key={day} className="py-1 text-center text-[11px] text-muted-foreground">
                {day}
              </div>
            ))}
            {Array.from({ length: leading }, (_, index) => (
              <div key={`empty-${index}`} />
            ))}
            {days.map((day) => {
              const date = format(day, 'yyyy-MM-dd')
              const future = date > today
              const summary = summarizeTasks(historyTasks(tasks, logs, date), logs, date)
              const selected = date === selectedDate
              return (
                <button
                  key={date}
                  type="button"
                  disabled={future}
                  onClick={() => setSelectedDate(date)}
                  aria-pressed={selected}
                  aria-label={format(day, 'MMMM d')}
                  className={cn(
                    'flex aspect-square flex-col items-center justify-center rounded-xl border text-xs',
                    future && 'cursor-not-allowed opacity-30',
                    selected ? 'border-ring bg-accent' : 'border-transparent hover:bg-muted',
                    isToday(day) && !selected && 'border-border',
                  )}
                >
                  <span>{format(day, 'd')}</span>
                  {summary.total > 0 ? (
                    <span
                      className="mt-1 h-1 w-4 rounded-full"
                      style={{
                        backgroundColor:
                          summary.score >= 80 ? '#10b981' : summary.score >= 40 ? '#d97706' : '#e11d48',
                      }}
                    />
                  ) : null}
                </button>
              )
            })}
          </div>
          {!monthReady && tasksLoading ? (
            <p className="mt-4 text-sm text-muted-foreground">Loading this month…</p>
          ) : null}
        </section>

        <section className="rounded-2xl border border-border bg-card p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold">
                {selectedDate === today ? 'Today' : format(parseISO(selectedDate), 'MMM d, yyyy')}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {selectedSummary.total === 0
                  ? 'Nothing to track'
                  : `${selectedSummary.done}/${selectedSummary.total} done · ${selectedSummary.score}%`}
              </p>
            </div>
            <Link href="/" className="shrink-0 text-sm font-medium text-primary">
              Open day
            </Link>
          </div>

          <div className="mt-4 space-y-2">
            {dayTasks.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No tasks for this day.</p>
            ) : (
              dayTasks.map((task) => {
                const log = logFor(logs, task.id, selectedDate)
                const status = log?.status ?? 'pending'
                const colors = getStatusColor(status)
                return (
                  <div key={task.id} className={cn('rounded-xl border p-3', colors.border, colors.bg)}>
                    <div className="flex items-center justify-between gap-2">
                      <p className="min-w-0 truncate text-sm font-medium">{task.title}</p>
                      <span className={cn('shrink-0 text-xs', colors.text)}>{getStatusLabel(status)}</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {log?.completed ?? 0}/{task.target} {task.unit}
                      {log?.notes ? ` · ${log.notes}` : ''}
                    </p>
                  </div>
                )
              })
            )}
          </div>
        </section>
      </div>
    </AppShell>
  )
}
