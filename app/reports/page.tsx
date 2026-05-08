'use client'

import { useMemo, useState } from 'react'
import { format, subDays, parseISO } from 'date-fns'
import {
  TrendingUp,
  Award,
  Flame,
  Calendar,
  type LucideIcon,
} from 'lucide-react'

import Sidebar from '@/components/Sidebar'
import TrendChart from '@/components/charts/TrendChart'
import CategoryChart from '@/components/charts/CategoryChart'
import TaskPerformanceChart from '@/components/charts/TaskPerformanceChart'
import DailyChart from '@/components/charts/DailyChart'
import { useTaskStore } from '@/store/taskStore'
import { cn } from '@/lib/utils'

type RangeOption = {
  label: string
  days: number
}

type StatColor = 'amber' | 'emerald' | 'sky' | 'rose'

type StatCardProps = {
  icon: LucideIcon
  label: string
  value: string | number
  sub?: string
  color?: StatColor
}

type TaskStatus = 'done' | 'partial' | 'not_done'

type Task = {
  id: string
  title: string
  category: string
  color: string
  unit: string
  isActive: boolean
  createdAt: string
}

type DailyLog = {
  date: string
  taskId: string
  status: TaskStatus
  completed?: number
}

type TaskReport = Task & {
  done: number
  partial: number
  missed: number
  totalUnits: number
  avgPct: number
}

const RANGES: RangeOption[] = [
  { label: '7D', days: 7 },
  { label: '14D', days: 14 },
  { label: '30D', days: 30 },
]

const COLOR_MAP: Record<
  StatColor,
  {
    text: string
    bg: string
    border: string
  }
> = {
  amber: {
    text: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
  },
  emerald: {
    text: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
  },
  sky: {
    text: 'text-sky-400',
    bg: 'bg-sky-500/10',
    border: 'border-sky-500/20',
  },
  rose: {
    text: 'text-rose-400',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/20',
  },
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color = 'amber',
}: StatCardProps) {
  const styles = COLOR_MAP[color]

  return (
    <div
      className={cn(
        'rounded-xl border bg-[#111113] p-4 sm:p-5',
        styles.border
      )}
    >
      <div className="flex items-center gap-3 sm:block">
        <div
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl sm:mb-3',
            styles.bg
          )}
        >
          <Icon size={18} className={styles.text} />
        </div>

        <div className="min-w-0">
          <div
            className={cn(
              'font-mono text-2xl font-bold leading-none sm:text-3xl',
              styles.text
            )}
          >
            {value}
          </div>

          <div className="mt-1 font-body text-xs text-zinc-400 sm:text-sm">
            {label}
          </div>

          {sub && (
            <div className="mt-0.5 font-body text-[11px] text-zinc-600 sm:text-xs">
              {sub}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ReportsPage() {
  const [rangeDays, setRangeDays] = useState<number>(14)

  const { tasks, dailyLogs, getLogsForDateRange } = useTaskStore()

  const taskList = tasks as Task[]
  const logList = dailyLogs as DailyLog[]

  const activeTasks = useMemo(() => {
    return taskList.filter((task) => task.isActive)
  }, [taskList])

  const endDate = format(new Date(), 'yyyy-MM-dd')
  const startDate = format(subDays(new Date(), rangeDays - 1), 'yyyy-MM-dd')

  const dateRange = useMemo(
    () => ({
      start: startDate,
      end: endDate,
    }),
    [startDate, endDate]
  )

  const logs = useMemo(() => {
    return getLogsForDateRange(startDate, endDate) as DailyLog[]
  }, [getLogsForDateRange, startDate, endDate])

  const totalCompletions = logs.filter((log) => log.status === 'done').length

  const totalPartials = logs.filter((log) => log.status === 'partial').length

  const totalPossible = useMemo(() => {
    let count = 0

    for (let index = 0; index < rangeDays; index += 1) {
      const date = subDays(new Date(), index)
      const dateStr = format(date, 'yyyy-MM-dd')

      count += activeTasks.filter((task) => {
        return new Date(task.createdAt) <= parseISO(dateStr)
      }).length
    }

    return count
  }, [rangeDays, activeTasks])

  const avgPct =
    totalPossible > 0
      ? Math.round(
          ((totalCompletions + totalPartials * 0.5) / totalPossible) * 100
        )
      : 0

  const streak = useMemo(() => {
    let best = 0
    let current = 0

    for (let index = rangeDays - 1; index >= 0; index -= 1) {
      const dateStr = format(subDays(new Date(), index), 'yyyy-MM-dd')

      const dayLogs = logList.filter((log) => log.date === dateStr)

      const dayTaskCount = activeTasks.filter((task) => {
        return new Date(task.createdAt) <= parseISO(dateStr)
      }).length

      const done = dayLogs.filter((log) => log.status === 'done').length

      if (dayTaskCount > 0 && done / dayTaskCount >= 0.7) {
        current += 1
        best = Math.max(best, current)
      } else {
        current = 0
      }
    }

    return best
  }, [rangeDays, logList, activeTasks])

  const taskReport = useMemo<TaskReport[]>(() => {
    return activeTasks
      .map((task) => {
        const taskLogs = logs.filter((log) => log.taskId === task.id)

        const done = taskLogs.filter((log) => log.status === 'done').length
        const partial = taskLogs.filter(
          (log) => log.status === 'partial'
        ).length
        const missed = taskLogs.filter(
          (log) => log.status === 'not_done'
        ).length

        const totalUnits = taskLogs.reduce((sum, log) => {
          return sum + (log.completed ?? 0)
        }, 0)

        const avgPct =
          rangeDays > 0
            ? Math.round(((done + partial * 0.5) / rangeDays) * 100)
            : 0

        return {
          ...task,
          done,
          partial,
          missed,
          totalUnits,
          avgPct,
        }
      })
      .sort((a, b) => b.avgPct - a.avgPct)
  }, [activeTasks, logs, rangeDays])

  return (
    <div className="min-h-screen bg-[#0a0a0b]">
      <Sidebar />

      <main className="w-full px-4 pb-24 pt-20 sm:p-6 lg:ml-[220px] lg:max-w-[calc(100%-220px)] lg:pb-6 lg:pt-6">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="font-syne text-2xl font-bold text-zinc-100">
              Reports
            </h1>

            <p className="mt-0.5 font-body text-sm text-zinc-600">
              {format(parseISO(startDate), 'MMM d')} –{' '}
              {format(new Date(), 'MMM d, yyyy')}
            </p>
          </div>

          {/* Range selector */}
          <div className="flex w-full items-center rounded-lg border border-zinc-800 bg-[#111113] p-1 sm:w-auto">
            {RANGES.map(({ label, days }) => (
              <button
                key={days}
                type="button"
                onClick={() => setRangeDays(days)}
                className={cn(
                  'flex-1 rounded-md px-4 py-2 font-mono text-xs transition-all sm:flex-none sm:py-1.5',
                  rangeDays === days
                    ? 'border border-amber-500/20 bg-amber-500/20 text-amber-400'
                    : 'text-zinc-600 hover:text-zinc-300'
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Summary cards */}
        <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={TrendingUp}
            label="Avg Completion"
            value={`${avgPct}%`}
            sub={`over ${rangeDays} days`}
            color="amber"
          />

          <StatCard
            icon={Award}
            label="Tasks Done"
            value={totalCompletions}
            sub="fully completed"
            color="emerald"
          />

          <StatCard
            icon={Flame}
            label="Best Streak"
            value={`${streak}d`}
            sub="≥70% done"
            color="rose"
          />

          <StatCard
            icon={Calendar}
            label="Days Tracked"
            value={rangeDays}
            sub="in date range"
            color="sky"
          />
        </div>

        {/* Charts row 1 */}
        <div className="mb-4 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
          <TrendChart days={rangeDays} />
          <CategoryChart dateRange={dateRange} />
        </div>

        {/* Charts row 2 */}
        <div className="mb-5 grid grid-cols-1 gap-4 xl:grid-cols-2">
          <DailyChart />
          <TaskPerformanceChart dateRange={dateRange} />
        </div>

        {/* Task breakdown */}
        <div className="overflow-hidden rounded-xl border border-zinc-800/60 bg-[#111113]">
          <div className="border-b border-zinc-800/60 px-4 py-4 sm:px-5">
            <h3 className="font-syne text-sm font-semibold text-zinc-100">
              Task Breakdown
            </h3>

            <p className="mt-0.5 font-body text-xs text-zinc-600">
              Performance per task for this period
            </p>
          </div>

          <div className="divide-y divide-zinc-800/40">
            {/* Desktop header */}
            <div className="hidden grid-cols-[1fr,80px,80px,80px,110px,80px] gap-4 px-5 py-2.5 font-mono text-[11px] uppercase tracking-wider text-zinc-600 md:grid">
              <span>Task</span>
              <span className="text-center">Done</span>
              <span className="text-center">Partial</span>
              <span className="text-center">Missed</span>
              <span className="text-right">Total Units</span>
              <span className="text-right">Avg %</span>
            </div>

            {taskReport.length === 0 ? (
              <div className="px-4 py-10 text-center font-body text-xs text-zinc-600">
                No active tasks found
              </div>
            ) : (
              taskReport.map((task) => (
                <div
                  key={task.id}
                  className="p-4 transition-colors hover:bg-zinc-800/20 md:grid md:grid-cols-[1fr,80px,80px,80px,110px,80px] md:items-center md:gap-4 md:px-5 md:py-3"
                >
                  <div className="mb-3 flex min-w-0 items-center gap-2 md:mb-0">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: task.color }}
                    />

                    <div className="min-w-0">
                      <div className="truncate font-body text-sm text-zinc-200">
                        {task.title}
                      </div>

                      <div className="font-body text-[11px] text-zinc-600">
                        {task.category}
                      </div>
                    </div>
                  </div>

                  {/* Mobile stats */}
                  <div className="grid grid-cols-2 gap-2 md:hidden">
                    <MobileMetric label="Done" value={task.done} color="emerald" />
                    <MobileMetric
                      label="Partial"
                      value={task.partial}
                      color="amber"
                    />
                    <MobileMetric
                      label="Missed"
                      value={task.missed}
                      color="rose"
                    />
                    <MobileMetric
                      label="Units"
                      value={`${task.totalUnits} ${task.unit}`}
                      color="zinc"
                    />
                  </div>

                  <div className="hidden text-center font-mono text-sm text-emerald-400 md:block">
                    {task.done}
                  </div>

                  <div className="hidden text-center font-mono text-sm text-amber-400 md:block">
                    {task.partial}
                  </div>

                  <div className="hidden text-center font-mono text-sm text-rose-400 md:block">
                    {task.missed}
                  </div>

                  <div className="hidden text-right font-mono text-sm text-zinc-300 md:block">
                    {task.totalUnits} {task.unit}
                  </div>

                  <div className="mt-3 flex items-center justify-between md:mt-0 md:block md:text-right">
                    <span className="font-body text-[11px] text-zinc-600 md:hidden">
                      Avg %
                    </span>

                    <span
                      className={cn(
                        'font-mono text-sm font-semibold',
                        task.avgPct >= 70
                          ? 'text-emerald-400'
                          : task.avgPct >= 40
                            ? 'text-amber-400'
                            : 'text-rose-400'
                      )}
                    >
                      {task.avgPct}%
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

type MobileMetricProps = {
  label: string
  value: string | number
  color: 'emerald' | 'amber' | 'rose' | 'zinc'
}

function MobileMetric({ label, value, color }: MobileMetricProps) {
  const colorClass: Record<MobileMetricProps['color'], string> = {
    emerald: 'text-emerald-400',
    amber: 'text-amber-400',
    rose: 'text-rose-400',
    zinc: 'text-zinc-300',
  }

  return (
    <div className="rounded-lg border border-zinc-800/60 bg-zinc-900/30 p-2">
      <div className="font-body text-[10px] text-zinc-600">{label}</div>

      <div className={cn('mt-0.5 font-mono text-xs', colorClass[color])}>
        {value}
      </div>
    </div>
  )
}