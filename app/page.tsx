'use client'

import { useEffect, useMemo, useState } from 'react'
import { format, parseISO, subDays } from 'date-fns'
import { toast } from 'sonner'
import { CalendarPlus, ChevronLeft, ChevronRight, Plus, Search } from 'lucide-react'

import AppShell from '@/components/app-shell'
import DailyChart from '@/components/charts/DailyChart'
import TaskCard from '@/components/TaskCard'
import { CATEGORIES } from '@/lib/sampleData'
import { apiMessage } from '@/lib/api-error'
import type { DisplayStatus, SortKey, StatusFilter, Task } from '@/lib/types'
import {
  daySummary,
  displayStatus,
  fillDailyStats,
  logFor,
  sortTasks,
  taskExistedOn,
  todayKey,
} from '@/lib/tasks'
import { cn, getStatusLabel } from '@/lib/utils'
import { usePreferences } from '@/store/preferences'
import { useTaskStore } from '@/store/taskStore'

const FILTERS: Array<{ key: StatusFilter; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Open' },
  { key: 'partial', label: 'Partial' },
  { key: 'done', label: 'Done' },
  { key: 'not_done', label: 'Missed' },
]

const SORTS: Array<{ key: SortKey; label: string }> = [
  { key: 'attention', label: 'Needs attention' },
  { key: 'title', label: 'Name' },
  { key: 'category', label: 'Category' },
  { key: 'newest', label: 'Newest' },
  { key: 'progress', label: 'Most complete' },
]

export default function TodayPage() {
  const tasks = useTaskStore((state) => state.tasks)
  const logs = useTaskStore((state) => state.logs)
  const loadedDates = useTaskStore((state) => state.loadedDates)
  const tasksLoading = useTaskStore((state) => state.tasksLoading)
  const tasksError = useTaskStore((state) => state.tasksError)
  const logsError = useTaskStore((state) => state.logsError)
  const report = useTaskStore((state) => state.report)
  const reportRange = useTaskStore((state) => state.reportRange)
  const reportLoading = useTaskStore((state) => state.reportLoading)
  const reportError = useTaskStore((state) => state.reportError)
  const selectedDate = useTaskStore((state) => state.selectedDate)
  const setSelectedDate = useTaskStore((state) => state.setSelectedDate)
  const fetchTasks = useTaskStore((state) => state.fetchTasks)
  const fetchLogsForDate = useTaskStore((state) => state.fetchLogsForDate)
  const fetchReport = useTaskStore((state) => state.fetchReport)
  const createTask = useTaskStore((state) => state.createTask)
  const setDialog = usePreferences((state) => state.setDialog)
  const query = usePreferences((state) => state.query)
  const setQuery = usePreferences((state) => state.setQuery)
  const status = usePreferences((state) => state.status)
  const setStatus = usePreferences((state) => state.setStatus)
  const category = usePreferences((state) => state.category)
  const setCategory = usePreferences((state) => state.setCategory)
  const sort = usePreferences((state) => state.sort)
  const setSort = usePreferences((state) => state.setSort)
  const showArchived = usePreferences((state) => state.showArchived)
  const setShowArchived = usePreferences((state) => state.setShowArchived)

  const today = todayKey()
  const chartStart = format(subDays(parseISO(today), 13), 'yyyy-MM-dd')
  const logsReady = loadedDates.includes(selectedDate)
  const isToday = selectedDate === today

  useEffect(() => {
    void fetchTasks()
  }, [fetchTasks])

  useEffect(() => {
    void fetchLogsForDate(selectedDate)
  }, [fetchLogsForDate, selectedDate])

  useEffect(() => {
    void fetchReport(chartStart, today)
  }, [chartStart, fetchReport, today])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target
      if (!(target instanceof HTMLElement)) return
      if (target.closest('input, textarea, select, [contenteditable="true"]')) return
      if (event.metaKey || event.ctrlKey || event.altKey) return
      if (event.key === '/') {
        event.preventDefault()
        document.getElementById('task-search')?.focus()
      }
      if (event.key.toLowerCase() === 'n') {
        event.preventDefault()
        document.getElementById('quick-add-title')?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (!logsReady || !window.location.hash) return
    document.getElementById(window.location.hash.slice(1))?.scrollIntoView({ block: 'center' })
  }, [logsReady])

  const summary = daySummary(tasks, logs, selectedDate)
  const visible = useMemo(() => {
    const active = tasks.filter((task) => task.isActive && taskExistedOn(task, selectedDate))
    const searched = active.filter((task) => matchesQuery(task, query))
    const categorized =
      category === 'all' ? searched : searched.filter((task) => task.category === category)
    return categorized
  }, [category, query, selectedDate, tasks])

  const filtered = useMemo(() => {
    const matched =
      status === 'all'
        ? visible
        : visible.filter((task) => displayStatus(logFor(logs, task.id, selectedDate)) === status)
    return sortTasks(matched, logs, selectedDate, sort)
  }, [logs, selectedDate, sort, status, visible])

  const archived = useMemo(() => {
    if (!showArchived) return []
    return tasks.filter((task) => !task.isActive && matchesQuery(task, query))
  }, [query, showArchived, tasks])

  const counts = useMemo(() => {
    const tally: Record<StatusFilter, number> = {
      all: visible.length,
      done: 0,
      partial: 0,
      not_done: 0,
      pending: 0,
    }
    for (const task of visible) {
      const key = displayStatus(logFor(logs, task.id, selectedDate))
      tally[key] += 1
    }
    return tally
  }, [logs, selectedDate, visible])

  const chartDays =
    report && reportRange?.start === chartStart && reportRange.end === today
      ? fillDailyStats(report.dailyStats, chartStart, today)
      : []

  function moveDay(delta: number) {
    const next = format(
      new Date(parseISO(selectedDate).getFullYear(), parseISO(selectedDate).getMonth(), parseISO(selectedDate).getDate() + delta),
      'yyyy-MM-dd',
    )
    if (next > today) return
    setSelectedDate(next)
  }

  const showSkeleton = tasksLoading && tasks.length === 0

  return (
    <AppShell>
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
            <button type="button" aria-label="Previous day" onClick={() => moveDay(-1)} className="px-3 py-2">
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={() => setSelectedDate(today)}
              className={cn('px-2 py-2 text-sm', isToday ? 'text-primary' : 'text-muted-foreground')}
            >
              Today
            </button>
            <button
              type="button"
              aria-label="Next day"
              disabled={isToday}
              onClick={() => moveDay(1)}
              className="px-3 py-2 disabled:opacity-40"
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
              if (event.target.value && event.target.value <= today) setSelectedDate(event.target.value)
            }}
            className="w-full max-w-full rounded-xl border border-border bg-card px-3 py-2 text-sm sm:w-auto"
          />
          <button
            type="button"
            onClick={() => setDialog({ type: 'create' })}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            <Plus size={15} />
            New task
          </button>
        </div>
      </div>

      {tasksError ? (
        <Banner message={tasksError} onRetry={() => void fetchTasks()} />
      ) : null}
      {logsError ? (
        <Banner message={logsError} onRetry={() => void fetchLogsForDate(selectedDate)} />
      ) : null}

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        <Stat label="Active" value={summary.total} onClick={() => setStatus('all')} />
        <Stat label="Done" value={summary.done} onClick={() => setStatus('done')} />
        <Stat label="Partial" value={summary.partial} onClick={() => setStatus('partial')} />
        <Stat label="Missed" value={summary.notDone} onClick={() => setStatus('not_done')} />
        <Stat label="Open" value={summary.pending} onClick={() => setStatus('pending')} />
      </div>

      <QuickAdd
        onCreate={async (title, target) => {
          const personal = CATEGORIES.find((item) => item.value === 'Personal')
          await createTask({
            title,
            target,
            unit: 'tasks',
            category: 'Personal',
            color: personal?.color ?? '#ec4899',
            repeatType: 'daily',
          })
          toast.success('Task added')
        }}
      />

      <div className="mt-4 flex flex-col gap-3">
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative min-w-0 flex-1">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <label htmlFor="task-search" className="sr-only">
              Search tasks
            </label>
            <input
              id="task-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search tasks"
              className="w-full rounded-xl border border-border bg-card py-2.5 pl-9 pr-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
            />
          </div>
          <label className="sr-only" htmlFor="task-sort">
            Sort
          </label>
          <select
            id="task-sort"
            value={sort}
            onChange={(event) => setSort(event.target.value as SortKey)}
            className="rounded-xl border border-border bg-card px-3 py-2.5 text-sm"
          >
            {SORTS.map((item) => (
              <option key={item.key} value={item.key}>
                {item.label}
              </option>
            ))}
          </select>
          <label className="sr-only" htmlFor="task-category">
            Category
          </label>
          <select
            id="task-category"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="rounded-xl border border-border bg-card px-3 py-2.5 text-sm"
          >
            <option value="all">All categories</option>
            {CATEGORIES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {FILTERS.map((item) => (
            <button
              key={item.key}
              type="button"
              aria-pressed={status === item.key}
              onClick={() => setStatus(item.key)}
              className={cn(
                'shrink-0 rounded-full border px-3 py-1.5 text-xs',
                status === item.key
                  ? 'border-ring bg-accent text-accent-foreground'
                  : 'border-border text-muted-foreground',
              )}
            >
              {item.label} {counts[item.key]}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-2">
        {showSkeleton ? (
          Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="h-36 animate-pulse rounded-2xl border border-border bg-card" />
          ))
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border px-4 py-14 text-center xl:col-span-2">
            <CalendarPlus className="mx-auto text-muted-foreground" size={22} />
            <p className="mt-3 text-sm font-medium">
              {tasks.filter((task) => task.isActive).length === 0
                ? 'No active tasks yet'
                : `No ${status === 'all' ? '' : `${getStatusLabel(status as DisplayStatus).toLowerCase()} `}tasks match`}
            </p>
            <button
              type="button"
              onClick={() => setDialog({ type: 'create' })}
              className="mt-3 text-sm font-medium text-primary"
            >
              Create a task
            </button>
          </div>
        ) : (
          filtered.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              date={selectedDate}
              log={logFor(logs, task.id, selectedDate)}
              logsKnown={logsReady}
            />
          ))
        )}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <button
          type="button"
          aria-pressed={showArchived}
          onClick={() => setShowArchived(!showArchived)}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          {showArchived ? 'Hide archived' : 'Show archived'}
        </button>
        <p className="text-xs text-muted-foreground">
          <kbd className="font-mono">/</kbd> search · <kbd className="font-mono">N</kbd> quick add
        </p>
      </div>

      {showArchived ? (
        <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-2">
          {archived.length === 0 ? (
            <p className="text-sm text-muted-foreground">No archived tasks.</p>
          ) : (
            archived.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                date={selectedDate}
                log={logFor(logs, task.id, selectedDate)}
                logsKnown={logsReady}
              />
            ))
          )}
        </div>
      ) : null}

      <div className="mt-6">
        {reportError ? (
          <Banner message={reportError} onRetry={() => void fetchReport(chartStart, today)} />
        ) : null}
        {reportLoading && chartDays.length === 0 ? (
          <div className="h-64 animate-pulse rounded-2xl border border-border bg-card" />
        ) : (
          <DailyChart days={chartDays} />
        )}
      </div>
    </AppShell>
  )
}

function matchesQuery(task: Task, query: string): boolean {
  const needle = query.trim().toLowerCase()
  if (!needle) return true
  return `${task.title} ${task.description} ${task.category} ${task.unit}`.toLowerCase().includes(needle)
}

function Stat({ label, value, onClick }: { label: string; value: number; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-2xl border border-border bg-card px-3 py-3 text-left hover:bg-accent"
    >
      <div className="text-2xl font-semibold tabular-nums">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </button>
  )
}

function Banner({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div role="alert" className="mb-4 flex flex-col gap-2 rounded-2xl border border-rose-600/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-800 sm:flex-row sm:items-center sm:justify-between dark:text-rose-100">
      <p>{message}</p>
      <button type="button" onClick={onRetry} className="font-medium underline">
        Retry
      </button>
    </div>
  )
}

function QuickAdd({ onCreate }: { onCreate: (title: string, target: number) => Promise<void> }) {
  const [title, setTitle] = useState('')
  const [target, setTarget] = useState('1')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  return (
    <form
      className="mt-4 rounded-2xl border border-border bg-card p-3"
      onSubmit={(event) => {
        event.preventDefault()
        const name = title.trim()
        const amount = Number(target)
        if (!name) {
          setError('Name the task first.')
          return
        }
        if (!Number.isFinite(amount) || amount <= 0) {
          setError('Target must be greater than 0.')
          return
        }
        setError(null)
        setPending(true)
        void onCreate(name, amount)
          .then(() => {
            setTitle('')
            setTarget('1')
          })
          .catch((caught: unknown) => {
            toast.error(apiMessage(caught, 'Could not add that task'))
          })
          .finally(() => setPending(false))
      }}
    >
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="min-w-0 flex-1">
          <label htmlFor="quick-add-title" className="sr-only">
            Quick add task name
          </label>
          <input
            id="quick-add-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Quick add a daily task"
            maxLength={120}
            className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
          />
        </div>
        <label htmlFor="quick-add-target" className="sr-only">
          Daily target
        </label>
        <input
          id="quick-add-target"
          type="number"
          min={1}
          value={target}
          onChange={(event) => setTarget(event.target.value)}
          aria-label="Daily target"
          className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm sm:w-24"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-secondary px-4 py-2.5 text-sm font-semibold text-secondary-foreground disabled:opacity-60"
        >
          {pending ? 'Adding…' : 'Add'}
        </button>
      </div>
      {error ? <p className="mt-2 text-xs text-rose-700 dark:text-rose-300">{error}</p> : (
        <p className="mt-2 text-xs text-muted-foreground">Adds a personal task with a daily target. Use New task for category and notes.</p>
      )}
    </form>
  )
}
