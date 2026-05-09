'use client'

import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  format,
  parseISO,
} from 'date-fns'

import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
} from 'lucide-react'

import Sidebar from '@/components/Sidebar'
import TaskCard from '@/components/TaskCard'
import StatsOverview from '@/components/StatsOverview'
import AddTaskModal from '@/components/AddTaskModal'
import DailyChart from '@/components/charts/DailyChart'

import { useTaskStore } from '@/store/taskStore'

import { cn } from '@/lib/utils'

type TaskStatus =
  | 'done'
  | 'partial'
  | 'not_done'

type DisplayStatus =
  | TaskStatus
  | 'pending'

type FilterKey =
  | 'all'
  | DisplayStatus

type Task = {
  id: string
  title: string
  description?: string
  target: number
  unit: string
  category: string
  color: string
  isActive: boolean
  createdAt: string
}

type TaskLog = {
  id?: string
  taskId: string
  status: TaskStatus
  completed?: number
  notes?: string
}

type TodayStats = {
  total: number
  done: number
  partial: number
  notDone: number
  pending: number
}

type FilterOption = {
  key: FilterKey
  label: string
  activeClassName: string
  dotClassName: string
}

const FILTERS: FilterOption[] =
  [
    {
      key: 'all',
      label: 'All',

      activeClassName:
        'bg-zinc-500/15 border-zinc-500/25 text-zinc-300',

      dotClassName:
        'bg-zinc-500',
    },

    {
      key: 'done',
      label: 'Done',

      activeClassName:
        'bg-emerald-500/15 border-emerald-500/25 text-emerald-400',

      dotClassName:
        'bg-emerald-500',
    },

    {
      key: 'partial',
      label: 'Partial',

      activeClassName:
        'bg-amber-500/15 border-amber-500/25 text-amber-400',

      dotClassName:
        'bg-amber-500',
    },

    {
      key: 'not_done',
      label: 'Missed',

      activeClassName:
        'bg-rose-500/15 border-rose-500/25 text-rose-400',

      dotClassName:
        'bg-rose-500',
    },

    {
      key: 'pending',
      label: 'Pending',

      activeClassName:
        'bg-zinc-500/15 border-zinc-500/25 text-zinc-300',

      dotClassName:
        'bg-zinc-500',
    },
  ]

export default function TodayPage() {
  // =========================
  // STORE
  // =========================

  const {
    tasks,
    loading,

    selectedDate,

    setSelectedDate,

    getLogsForDate,
    getTodayStats,

    fetchTasks,
    fetchLogsByDate,
  } = useTaskStore()

  // =========================
  // STATE
  // =========================

  const [
    showAddModal,
    setShowAddModal,
  ] = useState<boolean>(false)

  const [filter, setFilter] =
    useState<FilterKey>(
      'all'
    )

  // =========================
  // FETCH TASKS
  // =========================

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  // =========================
  // FETCH LOGS
  // =========================

  useEffect(() => {
    fetchLogsByDate(
      selectedDate
    )
  }, [
    selectedDate,
    fetchLogsByDate,
  ])

  // =========================
  // TYPES
  // =========================

  const taskList =
    tasks as Task[]

  const logs =
    getLogsForDate(
      selectedDate
    ) as TaskLog[]

  const stats =
    getTodayStats(
      selectedDate
    ) as TodayStats

  // =========================
  // ACTIVE TASKS
  // =========================

  const activeTasks =
    useMemo(() => {
      return taskList.filter(
        (task) =>
          task.isActive
      )
    }, [taskList])

  // =========================
  // DATE
  // =========================

  const todayDate = format(
    new Date(),
    'yyyy-MM-dd'
  )

  const isCurrentDay =
    selectedDate ===
    todayDate

  function shiftDay(
    delta: number
  ): void {
    const nextDate =
      parseISO(
        selectedDate
      )

    nextDate.setDate(
      nextDate.getDate() +
        delta
    )

    if (
      nextDate >
      new Date()
    ) {
      return
    }

    setSelectedDate(
      format(
        nextDate,
        'yyyy-MM-dd'
      )
    )
  }

  // =========================
  // FILTER TASKS
  // =========================

  const filteredTasks =
    useMemo(() => {
      if (
        filter === 'all'
      ) {
        return activeTasks
      }

      return activeTasks.filter(
        (task) => {
          const log =
            logs.find(
              (
                item
              ) =>
                item.taskId ===
                task.id
            )

          const status: DisplayStatus =
            log?.status ??
            'pending'

          return (
            status ===
            filter
          )
        }
      )
    }, [
      activeTasks,
      filter,
      logs,
    ])

  // =========================
  // FILTER COUNTS
  // =========================

  const filterCounts: Record<
    FilterKey,
    number
  > = useMemo(
    () => ({
      all:
        activeTasks.length,

      done:
        stats.done,

      partial:
        stats.partial,

      not_done:
        stats.notDone,

      pending:
        stats.pending,
    }),

    [
      activeTasks.length,

      stats.done,
      stats.partial,
      stats.notDone,
      stats.pending,
    ]
  )

  // =========================
  // DISPLAY DATE
  // =========================

  const displayDate =
    isCurrentDay
      ? 'Today'
      : format(
          parseISO(
            selectedDate
          ),
          'EEEE, MMMM d'
        )

  // =========================
  // LOADING
  // =========================

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0b] text-sm text-zinc-400">
        Loading tasks...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0b]">
      <Sidebar />

      <main className="w-full px-4 pb-24 pt-20 sm:p-6 lg:ml-[220px] lg:max-w-[calc(100%-220px)] lg:pb-6 lg:pt-6">
        {/* Header */}

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-3">
              <h1 className="truncate font-syne text-2xl font-bold text-zinc-100 sm:text-3xl">
                {
                  displayDate
                }
              </h1>

              {isCurrentDay && (
                <span className="shrink-0 rounded-full border border-amber-500/20 bg-amber-500/20 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-amber-400">
                  Live
                </span>
              )}
            </div>

            <p className="mt-0.5 truncate font-body text-sm text-zinc-600">
              {format(
                parseISO(
                  selectedDate
                ),
                'MMMM d, yyyy'
              )}{' '}
              ·{' '}
              {
                activeTasks.length
              }{' '}
              tasks active
            </p>
          </div>

          {/* Actions */}

          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            {/* Date controls */}

            <div className="flex w-full items-center overflow-hidden rounded-lg border border-zinc-800 bg-[#111113] sm:w-auto">
              <button
                type="button"
                onClick={() =>
                  shiftDay(
                    -1
                  )
                }
                className="flex flex-1 justify-center p-2 transition-colors hover:bg-zinc-800 sm:flex-none"
              >
                <ChevronLeft
                  size={14}
                  className="text-zinc-400"
                />
              </button>

              <button
                type="button"
                onClick={() =>
                  setSelectedDate(
                    todayDate
                  )
                }
                className={cn(
                  'flex-1 px-3 py-1.5 font-mono text-xs transition-colors sm:flex-none',

                  isCurrentDay
                    ? 'text-amber-400'
                    : 'text-zinc-500 hover:text-zinc-300'
                )}
              >
                Today
              </button>

              <button
                type="button"
                onClick={() =>
                  shiftDay(
                    1
                  )
                }
                disabled={
                  isCurrentDay
                }
                className="flex flex-1 justify-center p-2 transition-colors hover:bg-zinc-800 disabled:opacity-30 sm:flex-none"
              >
                <ChevronRight
                  size={14}
                  className="text-zinc-400"
                />
              </button>
            </div>

            {/* Add button */}

            <button
              type="button"
              onClick={() =>
                setShowAddModal(
                  true
                )
              }
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 py-2 font-mono text-sm font-semibold text-black transition-colors hover:bg-amber-400 sm:w-auto"
            >
              <Plus
                size={14}
              />

              Add Task
            </button>
          </div>
        </div>

        {/* Stats */}

        <StatsOverview
          stats={stats}
        />

        {/* Filters */}

        <div className="-mx-4 mb-4 mt-5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
          <div className="flex min-w-max items-center gap-2">
            {FILTERS.map(
              ({
                key,
                label,
                activeClassName,
                dotClassName,
              }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() =>
                    setFilter(
                      key
                    )
                  }
                  className={cn(
                    'flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-body text-xs transition-all',

                    filter ===
                      key
                      ? activeClassName
                      : 'border-zinc-800 bg-transparent text-zinc-600 hover:border-zinc-700 hover:text-zinc-400'
                  )}
                >
                  <span
                    className={cn(
                      'inline-block h-1.5 w-1.5 rounded-full',
                      dotClassName
                    )}
                  />

                  {label}

                  <span
                    className={cn(
                      'rounded-full px-1 py-0.5 font-mono text-[10px]',

                      filter ===
                        key
                        ? 'bg-white/10'
                        : 'bg-zinc-800'
                    )}
                  >
                    {
                      filterCounts[
                        key
                      ]
                    }
                  </span>
                </button>
              )
            )}
          </div>
        </div>

        {/* Tasks */}

        <div className="mb-6 grid grid-cols-1 gap-3 xl:grid-cols-2">
          {filteredTasks.length ===
          0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-zinc-900/80 bg-zinc-950/30 px-4 py-16 text-center xl:col-span-2">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-800/50">
                <Calendar
                  size={20}
                  className="text-zinc-600"
                />
              </div>

              <div className="font-body text-sm text-zinc-500">
                No tasks in
                this filter
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowAddModal(
                    true
                  )
                }
                className="mt-3 font-mono text-xs text-amber-500 hover:text-amber-400"
              >
                + Add your
                first task
              </button>
            </div>
          ) : (
            filteredTasks.map(
              (task) => {
                const log =
                  logs.find(
                    (
                      item
                    ) =>
                      item.taskId ===
                      task.id
                  )

                return (
                  <TaskCard
                    key={
                      task.id
                    }
                    task={
                      task
                    }
                    log={
                      log
                    }
                    date={
                      selectedDate
                    }
                  />
                )
              }
            )
          )}
        </div>

        {/* Chart */}

        <DailyChart />
      </main>

      {/* Modal */}

      <AddTaskModal
        open={
          showAddModal
        }
        onClose={() =>
          setShowAddModal(
            false
          )
        }
      />
    </div>
  )
}