'use client'

import {
  useEffect,
  useState,
  type ReactNode,
} from 'react'

import {
  CheckCircle2,
  Circle,
  MinusCircle,
  ChevronDown,
  ChevronUp,
  Trash2,
} from 'lucide-react'

import {
  cn,
  getStatusColor,
  getCompletionPercent,
} from '@/lib/utils'

import { useTaskStore } from '@/store/taskStore'

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
  description?: string
  target: number
  unit: string
  category: string
  color: string
}

type TaskLog = {
  id?: string
  taskId: string
  completed?: number
  status: TaskStatus
  notes?: string
}

type TaskCardProps = {
  task: Task
  log?: TaskLog ;
  date: string
}

const statusIcons: Record<
  DisplayStatus,
  ReactNode
> = {
  done: (
    <CheckCircle2
      size={14}
      className="text-emerald-400"
    />
  ),

  partial: (
    <MinusCircle
      size={14}
      className="text-amber-400"
    />
  ),

  not_done: (
    <Circle
      size={14}
      className="text-rose-400"
    />
  ),

  pending: (
    <Circle
      size={14}
      className="text-zinc-600"
    />
  ),
}

export default function TaskCard({
  task,
  log,
  date,
}: TaskCardProps) {
  // =========================
  // STORE
  // =========================

  const {
    upsertLog,
    deleteTask,
  } = useTaskStore()

  // =========================
  // STATE
  // =========================

  const [expanded, setExpanded] =
    useState<boolean>(false)

  const [inputVal, setInputVal] =
    useState<string>(
      log?.completed?.toString() ??
        ''
    )

  const [notes, setNotes] =
    useState<string>(
      log?.notes ?? ''
    )

  const [saving, setSaving] =
    useState<boolean>(false)

  // =========================
  // SYNC LOG
  // =========================

  useEffect(() => {
    setInputVal(
      log?.completed?.toString() ??
        ''
    )

    setNotes(
      log?.notes ?? ''
    )
  }, [
    log?.completed,
    log?.notes,
  ])

  // =========================
  // VALUES
  // =========================

  const completed =
    log?.completed ?? 0

  const pct =
    getCompletionPercent(
      completed,
      task.target
    )

  const status: DisplayStatus =
    log?.status ?? 'pending'

  const colors =
    getStatusColor(status)

  // =========================
  // SAVE
  // =========================

  async function handleSave(): Promise<void> {
    try {
      setSaving(true)

      const completedValue =
        Number.parseFloat(
          inputVal
        ) || 0

      await upsertLog(
        task.id,
        date,
        {
          completed:
            completedValue,

          notes:
            notes.trim(),
        }
      )

      setExpanded(false)
    } catch (error) {
      console.error(error)
    } finally {
      setSaving(false)
    }
  }

  // =========================
  // QUICK SET
  // =========================

  async function handleQuickSet(
    value: number
  ): Promise<void> {
    try {
      setInputVal(
        value.toString()
      )

      await upsertLog(
        task.id,
        date,
        {
          completed: value,

          notes:
            notes.trim(),
        }
      )
    } catch (error) {
      console.error(error)
    }
  }

  // =========================
  // DELETE
  // =========================

  async function handleDelete(): Promise<void> {
    try {
      await deleteTask(
        task.id
      )
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <div
      className={cn(
        'rounded-xl border bg-[#111113] transition-all duration-200 hover:bg-[#141416]',

        expanded
          ? 'border-zinc-700'
          : 'border-zinc-800/60 hover:border-zinc-700/60'
      )}
    >
      {/* Header */}

      <button
        type="button"
        onClick={() =>
          setExpanded(
            (
              current
            ) => !current
          )
        }
        aria-expanded={
          expanded
        }
        className="block w-full cursor-pointer p-3 text-left sm:p-4"
      >
        <div className="flex items-start gap-3">
          {/* Category dot */}

          <span
            className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
            style={{
              backgroundColor:
                task.color,
            }}
          />

          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="min-w-0 truncate font-syne text-sm font-medium text-zinc-100">
                {task.title}
              </h3>

              <div className="flex shrink-0 items-center justify-between gap-2 sm:justify-end">
                <div className="flex items-center gap-1.5">
                  {
                    statusIcons[
                      status
                    ]
                  }

                  <span
                    className={cn(
                      'font-mono text-xs font-medium',
                      colors.text
                    )}
                  >
                    <span className="font-semibold">
                      {
                        completed
                      }
                    </span>

                    <span className="text-zinc-600">
                      /
                      {
                        task.target
                      }
                    </span>

                    <span className="ml-0.5 text-zinc-600">
                      {
                        task.unit
                      }
                    </span>
                  </span>
                </div>

                {expanded ? (
                  <ChevronUp
                    size={13}
                    className="text-zinc-600"
                  />
                ) : (
                  <ChevronDown
                    size={13}
                    className="text-zinc-600"
                  />
                )}
              </div>
            </div>

            {/* Progress */}

            <div className="h-1.5 overflow-hidden rounded-full bg-zinc-800">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-500',

                  {
                    'bg-emerald-500':
                      status ===
                      'done',

                    'bg-amber-500':
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

            <div className="mt-1 flex items-center justify-between gap-3">
              <span className="truncate font-body text-[11px] text-zinc-600">
                {
                  task.category
                }
              </span>

              <span className="shrink-0 font-mono text-[11px] text-zinc-600">
                {pct}%
              </span>
            </div>
          </div>
        </div>
      </button>

      {/* Expanded */}

      {expanded && (
        <div className="animate-slide-up border-t border-zinc-800/60 px-3 pb-3 pt-3 sm:px-4 sm:pb-4">
          {task.description && (
            <div className="mb-3 font-body text-xs leading-relaxed text-zinc-500">
              {
                task.description
              }
            </div>
          )}

          {/* Quick Buttons */}

          <div className="mb-3 flex flex-wrap items-center gap-1.5">
            <span className="mr-1 font-body text-[11px] text-zinc-600">
              Quick:
            </span>

            {[
              0,
              Math.floor(
                task.target /
                  2
              ),
              task.target,
            ].map(
              (
                value
              ) => (
                <button
                  key={
                    value
                  }
                  type="button"
                  onClick={() =>
                    handleQuickSet(
                      value
                    )
                  }
                  className={cn(
                    'rounded-md border px-2.5 py-1 font-mono text-[11px] transition-colors',

                    Number.parseFloat(
                      inputVal
                    ) ===
                      value
                      ? 'border-amber-500/30 bg-amber-500/20 text-amber-300'
                      : 'border-zinc-700/50 bg-zinc-800/50 text-zinc-400 hover:border-zinc-600'
                  )}
                >
                  {value}
                </button>
              )
            )}
          </div>

          {/* Input */}

          <div className="mb-2 flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <input
                type="number"
                min={0}
                max={
                  task.target *
                  2
                }
                value={
                  inputVal
                }
                onChange={(
                  event
                ) =>
                  setInputVal(
                    event
                      .target
                      .value
                  )
                }
                className="w-full rounded-lg border border-zinc-700/50 bg-zinc-800/60 px-3 py-2 pr-24 font-mono text-sm text-zinc-200 placeholder-zinc-600 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
                placeholder={`0-${task.target}`}
              />

              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 truncate font-mono text-[11px] text-zinc-600">
                /
                {
                  task.target
                }{' '}
                {
                  task.unit
                }
              </span>
            </div>

            <button
              type="button"
              onClick={
                handleSave
              }
              disabled={
                saving
              }
              className="w-full rounded-lg bg-amber-500 px-4 py-2 font-mono text-xs font-semibold text-black transition-colors hover:bg-amber-400 disabled:opacity-50 sm:w-auto"
            >
              {saving
                ? 'Saving...'
                : 'Save'}
            </button>
          </div>

          {/* Notes */}

          <textarea
            value={notes}
            onChange={(
              event
            ) =>
              setNotes(
                event
                  .target
                  .value
              )
            }
            placeholder="Add a note (optional)..."
            rows={2}
            className="w-full resize-none rounded-lg border border-zinc-700/40 bg-zinc-800/40 px-3 py-2 font-body text-xs text-zinc-400 placeholder-zinc-600 focus:border-zinc-600 focus:outline-none"
          />

          {/* Delete */}

          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={
                handleDelete
              }
              className="flex items-center gap-1 rounded-md px-2 py-1 font-body text-[11px] text-zinc-600 transition-colors hover:bg-rose-500/10 hover:text-rose-400"
            >
              <Trash2
                size={11}
              />

              Delete task
            </button>
          </div>
        </div>
      )}
    </div>
  )
}