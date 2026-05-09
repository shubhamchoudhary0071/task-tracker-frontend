'use client'

import { useState } from 'react'

import {
  X,
  Plus,
  AlertCircle,
  Loader2,
} from 'lucide-react'

import { cn } from '@/lib/utils'

import { useTaskStore } from '@/store/taskStore'

import { CATEGORIES } from '@/lib/sampleData'

const UNITS = [
  'questions',
  'problems',
  'pages',
  'topics',
  'km',
  'miles',
  'minutes',
  'hours',
  'tasks',
  'sessions',
  'chapters',
  'articles',
] as const

type Unit =
  (typeof UNITS)[number]

type AddTaskModalProps = {
  open: boolean
  onClose: () => void
}

type TaskForm = {
  title: string
  description: string
  target: string
  unit: Unit
  category: string
  color: string
}

const INITIAL_FORM: TaskForm = {
  title: '',
  description: '',
  target: '',
  unit: 'questions',
  category: 'Programming',
  color: '#8b5cf6',
}

export default function AddTaskModal({
  open,
  onClose,
}: AddTaskModalProps) {
  // =========================
  // STORE
  // =========================

  const { createTask } =
    useTaskStore()

  // =========================
  // STATE
  // =========================

  const [form, setForm] =
    useState<TaskForm>(
      INITIAL_FORM
    )

  const [isLoading, setIsLoading] =
    useState<boolean>(false)

  const [error, setError] =
    useState<string | null>(
      null
    )

  // =========================
  // CATEGORY
  // =========================

  function handleCategoryChange(
    category: string
  ): void {
    const found =
      CATEGORIES.find(
        (item) =>
          item.value ===
          category
      )

    setForm((prev) => ({
      ...prev,
      category,

      color:
        found?.color ??
        prev.color,
    }))
  }

  // =========================
  // SUBMIT
  // =========================

  async function handleSubmit(): Promise<void> {
    const target =
      Number.parseFloat(
        form.target
      )

    if (
      !form.title.trim() ||
      Number.isNaN(target) ||
      target <= 0
    ) {
      return
    }

    try {
      setIsLoading(true)

      setError(null)

      await createTask({
        title:
          form.title.trim(),

        description:
          form.description.trim(),

        target,

        unit: form.unit,

        category:
          form.category,

        color: form.color,

        repeatType:
          'daily',
      })

      // reset

      setForm(
        INITIAL_FORM
      )

      onClose()
    } catch (
      err: unknown
    ) {
      const message =
        (
          err as {
            response?: {
              data?: {
                message?: string
              }
            }
          }
        )?.response?.data
          ?.message ??
        'Something went wrong. Please try again.'

      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  // =========================
  // CLOSE
  // =========================

  function handleClose(): void {
    if (isLoading)
      return

    setError(null)

    setForm(
      INITIAL_FORM
    )

    onClose()
  }

  // =========================
  // HIDE
  // =========================

  if (!open)
    return null

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4">
      {/* Backdrop */}

      <button
        type="button"
        aria-label="Close modal"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={
          handleClose
        }
      />

      {/* Modal */}

      <div className="relative max-h-[92dvh] w-full overflow-hidden rounded-t-2xl border border-zinc-800 bg-[#141416] shadow-2xl animate-slide-up sm:max-w-md sm:rounded-2xl">
        {/* Header */}

        <div className="flex items-center justify-between border-b border-zinc-800 p-4 sm:p-5">
          <div className="min-w-0">
            <h2 className="font-syne text-[15px] font-bold text-zinc-100">
              New Task
            </h2>

            <p className="mt-0.5 font-body text-xs text-zinc-600">
              This task
              will repeat
              daily
            </p>
          </div>

          <button
            type="button"
            onClick={
              handleClose
            }
            disabled={
              isLoading
            }
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-800 transition-colors hover:bg-zinc-700 disabled:opacity-50"
          >
            <X
              size={14}
              className="text-zinc-400"
            />
          </button>
        </div>

        {/* Form */}

        <div className="max-h-[calc(92dvh-132px)] space-y-4 overflow-y-auto p-4 sm:p-5">
          {/* Error */}

          {error && (
            <div className="flex items-start gap-2.5 rounded-lg border border-rose-500/20 bg-rose-500/10 px-3.5 py-3">
              <AlertCircle
                size={14}
                className="mt-px shrink-0 text-rose-400"
              />

              <p className="font-body text-xs text-rose-300">
                {error}
              </p>
            </div>
          )}

          {/* Title */}

          <div>
            <label className="mb-1.5 block font-mono text-xs text-zinc-500">
              Task Name *
            </label>

            <input
              type="text"
              value={
                form.title
              }
              disabled={
                isLoading
              }
              onChange={(
                event
              ) =>
                setForm(
                  (
                    previous
                  ) => ({
                    ...previous,

                    title:
                      event
                        .target
                        .value,
                  })
                )
              }
              placeholder="e.g. DSA Practice"
              className="w-full rounded-lg border border-zinc-700/50 bg-zinc-800/60 px-3 py-2.5 font-body text-sm text-zinc-200 placeholder-zinc-600 focus:border-amber-500/50 focus:outline-none disabled:opacity-50"
            />
          </div>

          {/* Description */}

          <div>
            <label className="mb-1.5 block font-mono text-xs text-zinc-500">
              Description
            </label>

            <input
              type="text"
              value={
                form.description
              }
              disabled={
                isLoading
              }
              onChange={(
                event
              ) =>
                setForm(
                  (
                    previous
                  ) => ({
                    ...previous,

                    description:
                      event
                        .target
                        .value,
                  })
                )
              }
              placeholder="What does this task involve?"
              className="w-full rounded-lg border border-zinc-700/50 bg-zinc-800/60 px-3 py-2.5 font-body text-sm text-zinc-200 placeholder-zinc-600 focus:border-amber-500/50 focus:outline-none disabled:opacity-50"
            />
          </div>

          {/* Target + Unit */}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[112px_1fr]">
            <div>
              <label className="mb-1.5 block font-mono text-xs text-zinc-500">
                Daily
                Target *
              </label>

              <input
                type="number"
                min={1}
                value={
                  form.target
                }
                disabled={
                  isLoading
                }
                onChange={(
                  event
                ) =>
                  setForm(
                    (
                      previous
                    ) => ({
                      ...previous,

                      target:
                        event
                          .target
                          .value,
                    })
                  )
                }
                placeholder="5"
                className="w-full rounded-lg border border-zinc-700/50 bg-zinc-800/60 px-3 py-2.5 font-mono text-sm text-zinc-200 placeholder-zinc-600 focus:border-amber-500/50 focus:outline-none disabled:opacity-50"
              />
            </div>

            <div>
              <label className="mb-1.5 block font-mono text-xs text-zinc-500">
                Unit
              </label>

              <select
                value={
                  form.unit
                }
                disabled={
                  isLoading
                }
                onChange={(
                  event
                ) =>
                  setForm(
                    (
                      previous
                    ) => ({
                      ...previous,

                      unit:
                        event
                          .target
                          .value as Unit,
                    })
                  )
                }
                className="w-full rounded-lg border border-zinc-700/50 bg-zinc-800/60 px-3 py-2.5 font-body text-sm text-zinc-200 focus:border-amber-500/50 focus:outline-none disabled:opacity-50"
              >
                {UNITS.map(
                  (
                    unit
                  ) => (
                    <option
                      key={
                        unit
                      }
                      value={
                        unit
                      }
                      className="bg-zinc-900"
                    >
                      {
                        unit
                      }
                    </option>
                  )
                )}
              </select>
            </div>
          </div>

          {/* Category */}

          <div>
            <label className="mb-1.5 block font-mono text-xs text-zinc-500">
              Category
            </label>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {CATEGORIES.map(
                (
                  category
                ) => (
                  <button
                    key={
                      category.value
                    }
                    type="button"
                    disabled={
                      isLoading
                    }
                    onClick={() =>
                      handleCategoryChange(
                        category.value
                      )
                    }
                    className={cn(
                      'flex min-w-0 items-center gap-2 rounded-lg border px-3 py-2.5 font-body text-xs transition-all disabled:cursor-not-allowed disabled:opacity-50',

                      form.category ===
                        category.value
                        ? 'border-zinc-600 bg-zinc-700/50 text-zinc-200'
                        : 'border-zinc-800/60 bg-zinc-800/30 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300'
                    )}
                  >
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{
                        backgroundColor:
                          category.color,
                      }}
                    />

                    <span className="truncate">
                      {
                        category.value
                      }
                    </span>
                  </button>
                )
              )}
            </div>
          </div>
        </div>

        {/* Footer */}

        <div className="flex flex-col-reverse gap-2 border-t border-zinc-800 p-4 sm:flex-row sm:items-center sm:justify-end sm:px-5">
          <button
            type="button"
            onClick={
              handleClose
            }
            disabled={
              isLoading
            }
            className="w-full rounded-lg px-4 py-2.5 font-body text-xs text-zinc-400 transition-colors hover:bg-zinc-800/60 hover:text-zinc-200 disabled:opacity-50 sm:w-auto"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={
              handleSubmit
            }
            disabled={
              !form.title.trim() ||
              !form.target ||
              isLoading
            }
            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-amber-500 px-4 py-2.5 font-mono text-xs font-semibold text-black transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
          >
            {isLoading ? (
              <>
                <Loader2
                  size={13}
                  className="animate-spin"
                />

                Creating…
              </>
            ) : (
              <>
                <Plus
                  size={13}
                />

                Create
                Task
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}