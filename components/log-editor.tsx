'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'

import type { DailyLog, Task } from '@/lib/types'
import { cn } from '@/lib/utils'

const fieldClass =
  'min-h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40'

export default function LogEditor({
  task,
  log,
  disabled,
  onSave,
  onClear,
  onEdit,
  onDelete,
}: {
  task: Task
  log?: DailyLog
  disabled: boolean
  onSave: (completed: number, notes: string) => Promise<void>
  onClear?: () => Promise<void>
  onEdit: () => void
  onDelete: () => void
}) {
  const [amount, setAmount] = useState(log?.completed?.toString() ?? '')
  const [notes, setNotes] = useState(log?.notes ?? '')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  return (
    <form
      className="mt-3 space-y-2 border-t border-border pt-3"
      onSubmit={(event) => {
        event.preventDefault()
        const value = Number(amount)
        if (!amount.trim() || !Number.isFinite(value) || value < 0) {
          setError('Enter a number that is 0 or more.')
          return
        }
        setError(null)
        setSaving(true)
        void onSave(value, notes.trim()).finally(() => setSaving(false))
      }}
    >
      {task.description ? (
        <p className="text-xs leading-relaxed text-muted-foreground">{task.description}</p>
      ) : null}
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="min-w-0 flex-1">
          <label htmlFor={`amount-${task.id}`} className="sr-only">
            Completed {task.unit}
          </label>
          <input
            id={`amount-${task.id}`}
            type="number"
            min={0}
            step="any"
            inputMode="decimal"
            disabled={disabled || saving}
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `amount-${task.id}-error` : undefined}
            className={fieldClass}
            placeholder={`0–${task.target} ${task.unit}`}
          />
        </div>
        <button
          type="submit"
          disabled={disabled || saving}
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save log'}
        </button>
      </div>
      {error ? (
        <p id={`amount-${task.id}-error`} className="text-xs text-rose-700 dark:text-rose-300">
          {error}
        </p>
      ) : null}
      <label htmlFor={`notes-${task.id}`} className="sr-only">
        Notes
      </label>
      <textarea
        id={`notes-${task.id}`}
        value={notes}
        disabled={disabled || saving}
        maxLength={500}
        rows={2}
        onChange={(event) => setNotes(event.target.value)}
        placeholder="Add a note"
        className={cn(fieldClass, 'min-h-16 resize-none')}
      />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1">
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex min-h-11 items-center px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            Edit details
          </button>
          {onClear ? (
            <button
              type="button"
              onClick={() => void onClear()}
              className="inline-flex min-h-11 items-center px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              Clear log
            </button>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onDelete}
          className="inline-flex min-h-11 items-center gap-1 px-2 text-xs text-rose-700 hover:underline dark:text-rose-300"
        >
          <Trash2 size={12} />
          Delete task
        </button>
      </div>
    </form>
  )
}
