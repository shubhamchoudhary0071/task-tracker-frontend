'use client'

import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isToday,
} from 'date-fns'

import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Minus,
  XCircle,
  Circle,
} from 'lucide-react'

import Sidebar from '@/components/Sidebar'

import { useTaskStore } from '@/store/taskStore'

import {
  cn,
  getStatusColor,
  getCompletionPercent,
} from '@/lib/utils'

type TaskStatus =
  | 'done'
  | 'partial'
  | 'not_done'

type DisplayStatus =
  | TaskStatus
  | 'pending'

type Task = {
  id: string
  title: string
  category: string
  color: string
  target: number
  unit: string
  isActive: boolean
  createdAt: string
}

type DailyLog = {
  id?: string
  date: string
  taskId: string
  status: TaskStatus
  completed?: number
  notes?: string
}

type DayStats = {
  done: number
  partial: number
  notDone: number
  total: number
  pct: number
}

const statusIcons: Record<
  DisplayStatus,
  ReactNode
> = {
  done: (
    <CheckCircle2
      size={11}
      className="text-emerald-400"
    />
  ),

  partial: (
    <Minus
      size={11}
      className="text-amber-400"
    />
  ),

  not_done: (
    <XCircle
      size={11}
      className="text-rose-400"
    />
  ),

  pending: (
    <Circle
      size={11}
      className="text-zinc-600"
    />
  ),
}

const LEGEND_ITEMS = [
  {
    color: '#10b981',
    label: 'Done',
  },

  {
    color: '#f59e0b',
    label: 'Partial',
  },

  {
    color: '#f43f5e',
    label: 'Missed',
  },
]

export default function HistoryPage() {
  const {
    tasks,
    dailyLogs,
    loading,
    getLogsForDate,
    fetchTasks,
    fetchLogsInRange,
  } = useTaskStore()

  const [currentMonth, setCurrentMonth] =
    useState<Date>(new Date())

  const [selectedDate, setSelectedDate] =
    useState<string>(
      format(new Date(), 'yyyy-MM-dd')
    )

  // =========================
  // FETCH TASKS
  // =========================

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  // =========================
  // FETCH MONTH LOGS
  // =========================

  useEffect(() => {
    const start = format(
      startOfMonth(currentMonth),
      'yyyy-MM-dd'
    )

    const end = format(
      endOfMonth(currentMonth),
      'yyyy-MM-dd'
    )

    fetchLogsInRange(start, end)
  }, [currentMonth, fetchLogsInRange])

  const taskList = tasks as Task[]

  const activeTasks = useMemo(() => {
    return taskList.filter(
      (task) => task.isActive
    )
  }, [taskList])

  const logs =
    getLogsForDate(selectedDate) as DailyLog[]

  const monthStart =
    startOfMonth(currentMonth)

  const monthEnd =
    endOfMonth(currentMonth)

  const days = eachDayOfInterval({
    start: monthStart,
    end: monthEnd,
  })

  const firstDayOfWeek =
    monthStart.getDay()

  const todayDate = format(
    new Date(),
    'yyyy-MM-dd'
  )

  function getDayStats(
    dateStr: string
  ): DayStats | null {
    const dayLogs = dailyLogs.filter(
      (log) => log.date === dateStr
    )

    const total = activeTasks.filter(
      (task) => {
        return (
          new Date(task.createdAt) <=
          parseISO(dateStr)
        )
      }
    ).length

    if (total === 0) return null

    const done = dayLogs.filter(
      (log) => log.status === 'done'
    ).length

    const partial = dayLogs.filter(
      (log) => log.status === 'partial'
    ).length

    const notDone = dayLogs.filter(
      (log) => log.status === 'not_done'
    ).length

    const pct = Math.round(
      ((done + partial * 0.5) / total) *
        100
    )

    return {
      done,
      partial,
      notDone,
      total,
      pct,
    }
  }

  function goToPreviousMonth(): void {
    setCurrentMonth((month) => {
      const nextMonth = new Date(month)

      nextMonth.setMonth(
        nextMonth.getMonth() - 1
      )

      return nextMonth
    })
  }

  function goToNextMonth(): void {
    setCurrentMonth((month) => {
      const nextMonth = new Date(month)

      nextMonth.setMonth(
        nextMonth.getMonth() + 1
      )

      return nextMonth
    })
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0b] text-sm text-zinc-400">
        Loading history...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0b]">
      <Sidebar />

      <main className="w-full px-4 pb-24 pt-20 sm:p-6 lg:ml-[220px] lg:max-w-[calc(100%-220px)] lg:pb-6 lg:pt-6">
        {/* Header */}

        <div className="mb-6">
          <h1 className="font-syne text-2xl font-bold text-zinc-100">
            History
          </h1>

          <p className="mt-0.5 font-body text-sm text-zinc-600">
            Your task log over time
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          {/* Calendar */}

          <div className="rounded-xl border border-zinc-800/60 bg-[#111113] p-4 sm:p-5">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="font-syne font-semibold text-zinc-100">
                {format(
                  currentMonth,
                  'MMMM yyyy'
                )}
              </h2>

              <div className="flex w-full items-center rounded-lg border border-zinc-800 bg-zinc-950/40 p-1 sm:w-auto sm:border-0 sm:bg-transparent sm:p-0">
                <button
                  type="button"
                  onClick={goToPreviousMonth}
                  className="flex flex-1 justify-center rounded-lg p-2 transition-colors hover:bg-zinc-800 sm:flex-none sm:p-1.5"
                >
                  <ChevronLeft
                    size={14}
                    className="text-zinc-400"
                  />
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setCurrentMonth(
                      new Date()
                    )
                  }
                  className="flex-1 rounded-md px-3 py-2 font-mono text-xs text-zinc-500 transition-colors hover:text-zinc-300 sm:flex-none sm:py-1"
                >
                  Now
                </button>

                <button
                  type="button"
                  onClick={goToNextMonth}
                  disabled={isSameMonth(
                    currentMonth,
                    new Date()
                  )}
                  className="flex flex-1 justify-center rounded-lg p-2 transition-colors hover:bg-zinc-800 disabled:opacity-30 sm:flex-none sm:p-1.5"
                >
                  <ChevronRight
                    size={14}
                    className="text-zinc-400"
                  />
                </button>
              </div>
            </div>

            {/* Day names */}

            <div className="mb-2 grid grid-cols-7">
              {[
                'Sun',
                'Mon',
                'Tue',
                'Wed',
                'Thu',
                'Fri',
                'Sat',
              ].map((day) => (
                <div
                  key={day}
                  className="py-1 text-center font-mono text-[10px] text-zinc-600 sm:text-[11px]"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}

            <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
              {Array.from({
                length: firstDayOfWeek,
              }).map((_, index) => (
                <div
                  key={`empty-${index}`}
                />
              ))}

              {days.map((day) => {
                const dateStr = format(
                  day,
                  'yyyy-MM-dd'
                )

                const isFuture =
                  day > new Date()

                const selected =
                  selectedDate === dateStr

                const stats =
                  getDayStats(dateStr)

                const today =
                  isToday(day)

                return (
                  <button
                    key={dateStr}
                    type="button"
                    onClick={() => {
                      if (!isFuture) {
                        setSelectedDate(
                          dateStr
                        )
                      }
                    }}
                    disabled={isFuture}
                    className={cn(
                      'relative flex aspect-square flex-col items-center justify-start rounded-lg border pt-1.5 text-xs transition-all sm:pt-2',

                      isFuture
                        ? 'cursor-not-allowed opacity-25'
                        : 'cursor-pointer hover:bg-zinc-800/50',

                      selected
                        ? 'border-amber-500/30 bg-amber-500/15'
                        : 'border-transparent',

                      today &&
                        !selected
                        ? 'border-zinc-700'
                        : ''
                    )}
                  >
                    <span
                      className={cn(
                        'font-mono text-[10px] sm:text-[11px]',

                        selected
                          ? 'text-amber-400'
                          : today
                            ? 'text-zinc-200'
                            : 'text-zinc-500'
                      )}
                    >
                      {format(day, 'd')}
                    </span>

                    {stats && (
                      <div className="mt-1 flex gap-px">
                        {stats.done >
                          0 && (
                          <span className="h-1 w-1 rounded-full bg-emerald-400" />
                        )}

                        {stats.partial >
                          0 && (
                          <span className="h-1 w-1 rounded-full bg-amber-400" />
                        )}

                        {stats.notDone >
                          0 && (
                          <span className="h-1 w-1 rounded-full bg-rose-500" />
                        )}
                      </div>
                    )}

                    {stats && (
                      <span
                        className="absolute bottom-1 left-1/2 h-0.5 w-[60%] -translate-x-1/2 rounded-full opacity-60"
                        style={{
                          backgroundColor:
                            stats.pct >=
                            80
                              ? '#10b981'
                              : stats.pct >=
                                  50
                                ? '#f59e0b'
                                : '#f43f5e',
                        }}
                      />
                    )}
                  </button>
                )
              })}
            </div>

            {/* Legend */}

            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-zinc-800/60 pt-4">
              {LEGEND_ITEMS.map(
                (item) => (
                  <div
                    key={item.label}
                    className="flex items-center gap-1.5"
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{
                        backgroundColor:
                          item.color,
                      }}
                    />

                    <span className="font-body text-[11px] text-zinc-600">
                      {item.label}
                    </span>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Day detail */}

          <div className="rounded-xl border border-zinc-800/60 bg-[#111113] p-4 sm:p-5">
            <div className="mb-4">
              <h3 className="font-syne text-sm font-semibold text-zinc-100">
                {selectedDate ===
                todayDate
                  ? 'Today'
                  : format(
                      parseISO(
                        selectedDate
                      ),
                      'MMM d, yyyy'
                    )}
              </h3>

              {(() => {
                const stats =
                  getDayStats(
                    selectedDate
                  )

                if (!stats) {
                  return (
                    <p className="mt-0.5 font-body text-xs text-zinc-600">
                      No data
                    </p>
                  )
                }

                return (
                  <p className="mt-0.5 font-body text-xs text-zinc-600">
                    {stats.done}/
                    {stats.total}{' '}
                    completed ·{' '}
                    {stats.pct}%
                  </p>
                )
              })()}
            </div>

            <div className="space-y-2">
              {activeTasks.length ===
              0 ? (
                <div className="py-8 text-center font-body text-xs text-zinc-600">
                  No tasks yet
                </div>
              ) : (
                activeTasks.map(
                  (task) => {
                    const log =
                      logs.find(
                        (item) =>
                          item.taskId ===
                          task.id
                      )

                    const status: DisplayStatus =
                      log?.status ??
                      'pending'

                    const colors =
                      getStatusColor(
                        status
                      )

                    const pct =
                      getCompletionPercent(
                        log?.completed ??
                          0,
                        task.target
                      )

                    return (
                      <div
                        key={task.id}
                        className={cn(
                          'rounded-lg border p-3',
                          colors.bg,
                          colors.border
                        )}
                      >
                        <div className="mb-1.5 flex items-center gap-2">
                          <span
                            className="h-1.5 w-1.5 shrink-0 rounded-full"
                            style={{
                              backgroundColor:
                                task.color,
                            }}
                          />

                          <span className="min-w-0 flex-1 truncate font-body text-xs text-zinc-300">
                            {
                              task.title
                            }
                          </span>

                          {
                            statusIcons[
                              status
                            ]
                          }
                        </div>

                        <div className="h-1 overflow-hidden rounded-full bg-black/20">
                          <div
                            className={cn(
                              'h-full rounded-full',
                              {
                                'bg-emerald-400':
                                  status ===
                                  'done',

                                'bg-amber-400':
                                  status ===
                                  'partial',

                                'bg-rose-500':
                                  status ===
                                  'not_done',

                                'bg-zinc-700':
                                  status ===
                                  'pending',
                              }
                            )}
                            style={{
                              width: `${pct}%`,
                            }}
                          />
                        </div>

                        <div className="mt-1 flex items-start justify-between gap-2">
                          <span className="line-clamp-2 font-body text-[10px] text-zinc-600">
                            {log?.notes ??
                              ''}
                          </span>

                          <span
                            className={cn(
                              'shrink-0 font-mono text-[10px]',
                              colors.text
                            )}
                          >
                            {log?.completed ??
                              0}
                            /
                            {
                              task.target
                            }{' '}
                            {
                              task.unit
                            }
                          </span>
                        </div>
                      </div>
                    )
                  }
                )
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}