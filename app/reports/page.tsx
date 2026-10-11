'use client'

import { useEffect, useMemo, useState } from 'react'
import { format, parseISO, subDays } from 'date-fns'
import { Award, CalendarRange, Flame, TrendingUp } from 'lucide-react'

import AppShell from '@/components/app-shell'
import CategoryChart from '@/components/charts/CategoryChart'
import DailyChart from '@/components/charts/DailyChart'
import TaskPerformanceChart from '@/components/charts/TaskPerformanceChart'
import TrendChart from '@/components/charts/TrendChart'
import { fillDailyStats, streaks, todayKey } from '@/lib/tasks'
import { cn } from '@/lib/utils'
import { useTaskStore } from '@/store/taskStore'

const RANGES = [7, 14, 30, 90]

export default function ReportsPage() {
  const [days, setDays] = useState(14)
  const report = useTaskStore((state) => state.report)
  const reportRange = useTaskStore((state) => state.reportRange)
  const reportLoading = useTaskStore((state) => state.reportLoading)
  const reportError = useTaskStore((state) => state.reportError)
  const fetchReport = useTaskStore((state) => state.fetchReport)

  const end = todayKey()
  const start = format(subDays(parseISO(end), days - 1), 'yyyy-MM-dd')
  const matches = reportRange?.start === start && reportRange.end === end && report != null

  useEffect(() => {
    void fetchReport(start, end)
  }, [end, fetchReport, start])

  const filled = useMemo(
    () => (matches && report ? fillDailyStats(report.dailyStats, start, end) : []),
    [end, matches, report, start],
  )
  const streak = streaks(filled)
  const slices = useMemo(() => {
    if (!matches || !report) return []
    const grouped = new Map<string, { name: string; value: number; color: string }>()
    for (const task of report.taskStats) {
      if (task.done <= 0) continue
      const current = grouped.get(task.category) ?? {
        name: task.category || 'Other',
        value: 0,
        color: task.color,
      }
      current.value += task.done
      grouped.set(task.category, current)
    }
    return Array.from(grouped.values()).sort((a, b) => b.value - a.value)
  }, [matches, report])

  const rows = useMemo(() => {
    if (!matches || !report) return []
    return report.taskStats
      .map((task) => {
        const recorded = task.done + task.partial + task.notDone
        const pct =
          recorded === 0 ? 0 : Math.round(((task.done + task.partial * 0.5) / recorded) * 100)
        return {
          taskId: task.taskId,
          name: task.title.length > 16 ? `${task.title.slice(0, 15)}…` : task.title,
          fullName: task.title,
          pct,
          color: task.color,
          done: task.done,
          partial: task.partial,
          notDone: task.notDone,
          totalCompleted: task.totalCompleted,
          unit: task.unit,
          category: task.category,
        }
      })
      .sort((a, b) => b.pct - a.pct)
  }, [matches, report])

  return (
    <AppShell>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Reports</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {format(parseISO(start), 'MMM d')} – {format(parseISO(end), 'MMM d, yyyy')}
          </p>
        </div>
        <div className="flex rounded-xl border border-border bg-card p-1" role="group" aria-label="Date range">
          {RANGES.map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={days === value}
              onClick={() => setDays(value)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-medium',
                days === value ? 'bg-accent text-accent-foreground' : 'text-muted-foreground',
              )}
            >
              {value}D
            </button>
          ))}
        </div>
      </div>

      {reportError ? (
        <div role="alert" className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-rose-600/30 bg-rose-500/10 px-4 py-3 text-sm">
          <p>{reportError}</p>
          <button type="button" className="font-medium underline" onClick={() => void fetchReport(start, end)}>
            Retry
          </button>
        </div>
      ) : null}

      {!matches && reportLoading ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="h-28 animate-pulse rounded-2xl border border-border bg-card" />
          ))}
        </div>
      ) : matches && report ? (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Metric icon={TrendingUp} label="Avg completion" value={`${report.summary.avgCompletionPct}%`} detail={`over ${days} days`} />
            <Metric icon={Award} label="Fully done" value={report.summary.totalDone} detail={`${report.summary.totalPartial} partial`} />
            <Metric icon={Flame} label="Current streak" value={`${streak.current}d`} detail={`best ${streak.best}d · 70%+`} />
            <Metric icon={CalendarRange} label="Active tasks" value={report.summary.activeTasks} detail="in this account" />
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
            <TrendChart days={filled} average={report.summary.avgCompletionPct} />
            <CategoryChart slices={slices} />
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
            <DailyChart days={filled} />
            <TaskPerformanceChart rows={rows} />
          </div>

          <section className="mt-4 overflow-hidden rounded-2xl border border-border bg-card">
            <div className="border-b border-border px-4 py-4 sm:px-5">
              <h2 className="text-sm font-semibold">Task breakdown</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">Counts come from the report API for this range.</p>
            </div>
            {rows.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-muted-foreground">No active tasks in this range.</p>
            ) : (
              <div className="divide-y divide-border">
                <div className="hidden grid-cols-[minmax(0,1fr)_4.5rem_4.5rem_4.5rem_6rem_4rem] gap-3 px-5 py-2 text-[11px] uppercase tracking-wide text-muted-foreground md:grid">
                  <span>Task</span>
                  <span className="text-center">Done</span>
                  <span className="text-center">Partial</span>
                  <span className="text-center">Missed</span>
                  <span className="text-right">Units</span>
                  <span className="text-right">Logged</span>
                </div>
                {rows.map((task) => (
                  <div key={task.taskId} className="px-4 py-3 md:grid md:grid-cols-[minmax(0,1fr)_4.5rem_4.5rem_4.5rem_6rem_4rem] md:items-center md:gap-3 md:px-5">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: task.color }} />
                        <span className="truncate text-sm font-medium">{task.fullName}</span>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">{task.category}</p>
                    </div>
                    <div className="mt-2 grid grid-cols-3 gap-2 text-center text-xs md:contents">
                      <span className="text-emerald-700 dark:text-emerald-300">{task.done}</span>
                      <span className="text-amber-800 dark:text-amber-300">{task.partial}</span>
                      <span className="text-rose-700 dark:text-rose-300">{task.notDone}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-sm md:mt-0 md:block md:text-right">
                      <span className="text-muted-foreground md:hidden">Units</span>
                      <span>
                        {task.totalCompleted} {task.unit}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-sm font-semibold md:mt-0 md:block md:text-right">
                      <span className="font-normal text-muted-foreground md:hidden">Logged</span>
                      <span>{task.pct}%</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">No report loaded yet.</p>
      )}
    </AppShell>
  )
}

function Metric({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: typeof TrendingUp
  label: string
  value: string | number
  detail: string
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <Icon size={16} className="text-primary" />
      <div className="mt-3 text-2xl font-semibold tabular-nums">{value}</div>
      <div className="text-sm">{label}</div>
      <div className="text-xs text-muted-foreground">{detail}</div>
    </div>
  )
}
