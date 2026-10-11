'use client'

import { useEffect, useMemo } from 'react'
import { format, parseISO, subDays } from 'date-fns'
import { toast } from 'sonner'
import { CalendarPlus } from 'lucide-react'

import AppShell from '@/components/app-shell'
import DailyChart from '@/components/charts/DailyChart'
import TaskCard from '@/components/TaskCard'
import ArchivedList from '@/components/today/ArchivedList'
import DayHeader from '@/components/today/DayHeader'
import QuickAdd from '@/components/today/QuickAdd'
import StatsGrid from '@/components/today/StatsGrid'
import TaskFilters from '@/components/today/TaskFilters'
import { CATEGORIES } from '@/lib/sampleData'
import type { DisplayStatus, StatusFilter, Task } from '@/lib/types'
import {
  daySummary,
  displayStatus,
  fillDailyStats,
  logFor,
  sortTasks,
  taskExistedOn,
  todayKey,
} from '@/lib/tasks'
import { getStatusLabel } from '@/lib/utils'
import { usePreferences } from '@/store/preferences'
import { useTaskStore } from '@/store/taskStore'

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
    return category === 'all' ? searched : searched.filter((task) => task.category === category)
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
      tally[displayStatus(logFor(logs, task.id, selectedDate))] += 1
    }
    return tally
  }, [logs, selectedDate, visible])

  const chartDays =
    report && reportRange?.start === chartStart && reportRange.end === today
      ? fillDailyStats(report.dailyStats, chartStart, today)
      : []

  function moveDay(delta: number) {
    const current = parseISO(selectedDate)
    const next = format(new Date(current.getFullYear(), current.getMonth(), current.getDate() + delta), 'yyyy-MM-dd')
    if (next > today) return
    setSelectedDate(next)
  }

  const showSkeleton = tasksLoading && tasks.length === 0

  return (
    <AppShell>
      <DayHeader
        selectedDate={selectedDate}
        today={today}
        summary={summary}
        onMove={moveDay}
        onSelectDate={setSelectedDate}
        onCreate={() => setDialog({ type: 'create' })}
      />

      {tasksError ? <Banner message={tasksError} onRetry={() => void fetchTasks()} /> : null}
      {logsError ? <Banner message={logsError} onRetry={() => void fetchLogsForDate(selectedDate)} /> : null}

      <StatsGrid summary={summary} onFilter={setStatus} />

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

      <TaskFilters
        query={query}
        sort={sort}
        category={category}
        status={status}
        counts={counts}
        onQuery={setQuery}
        onSort={setSort}
        onCategory={setCategory}
        onStatus={setStatus}
      />

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
              className="mt-3 inline-flex min-h-11 items-center text-sm font-medium text-primary"
            >
              Create a task
            </button>
          </div>
        ) : (
          filtered.map((task) => (
            <TaskCard
              key={task.clientKey ?? task.id}
              task={task}
              date={selectedDate}
              log={logFor(logs, task.id, selectedDate)}
              logsKnown={logsReady}
            />
          ))
        )}
      </div>

      <ArchivedList
        open={showArchived}
        tasks={archived}
        date={selectedDate}
        logs={logs}
        logsReady={logsReady}
        onToggle={() => setShowArchived(!showArchived)}
      />

      <div className="mt-6">
        {reportError ? <Banner message={reportError} onRetry={() => void fetchReport(chartStart, today)} /> : null}
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

function Banner({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div
      role="alert"
      className="mb-4 flex flex-col gap-2 rounded-2xl border border-rose-600/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-800 sm:flex-row sm:items-center sm:justify-between dark:text-rose-100"
    >
      <p>{message}</p>
      <button type="button" onClick={onRetry} className="inline-flex min-h-11 items-center font-medium underline">
        Retry
      </button>
    </div>
  )
}
