'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Archive, ArchiveRestore, Pencil, Trash2 } from 'lucide-react'

import { apiMessage } from '@/lib/api-error'
import type { DailyLog, Task } from '@/lib/types'
import { completionPercent, displayStatus, halfTarget } from '@/lib/tasks'
import { cn, getStatusColor, getStatusLabel } from '@/lib/utils'
import { usePreferences } from '@/store/preferences'
import { useTaskStore } from '@/store/taskStore'

const fieldClass =
  'w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40'

type TaskCardProps = {
  task: Task
  log?: DailyLog
  date: string
  logsKnown: boolean
}

export default function TaskCard({ task, log, date, logsKnown }: TaskCardProps) {
  const upsertLog = useTaskStore((state) => state.upsertLog)
  const deleteLog = useTaskStore((state) => state.deleteLog)
  const updateTask = useTaskStore((state) => state.updateTask)
  const fetchReport = useTaskStore((state) => state.fetchReport)
  const reportRange = useTaskStore((state) => state.reportRange)
  const setDialog = usePreferences((state) => state.setDialog)
  const [open, setOpen] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const [title, setTitle] = useState(task.title)
  const [busy, setBusy] = useState(false)
  const status = logsKnown ? displayStatus(log) : 'pending'
  const colors = getStatusColor(logsKnown ? status : 'pending')
  const completed = log?.completed ?? 0
  const percent = logsKnown ? completionPercent(completed, task.target) : 0
  const half = halfTarget(task.target)

  async function saveLog(completedValue: number, notes = log?.notes ?? '') {
    setBusy(true)
    try {
      await upsertLog(task.id, date, { completed: completedValue, notes }, task.target)
      if (reportRange) void fetchReport(reportRange.start, reportRange.end)
    } catch (error) {
      toast.error(apiMessage(error, 'Could not save progress'))
    } finally {
      setBusy(false)
    }
  }

  async function saveTitle() {
    const next = title.trim()
    setRenaming(false)
    if (!next || next === task.title) {
      setTitle(task.title)
      return
    }
    try {
      await updateTask(task.id, { title: next })
      toast.success('Task renamed')
    } catch (error) {
      setTitle(task.title)
      toast.error(apiMessage(error, 'Could not rename that task'))
    }
  }

  async function toggleArchive() {
    try {
      await updateTask(task.id, { isActive: !task.isActive })
      toast.success(task.isActive ? 'Task archived' : 'Task restored')
    } catch (error) {
      toast.error(apiMessage(error, 'Could not update that task'))
    }
  }

  return (
    <article
      id={`task-${task.id}`}
      className={cn('min-w-0 rounded-2xl border bg-card p-3 sm:p-4', colors.border)}
    >
      <div className="flex items-start gap-3">
        <span
          className="mt-1.5 size-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: task.color }}
          aria-hidden="true"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            {renaming ? (
              <input
                value={title}
                autoFocus
                aria-label="Task name"
                maxLength={120}
                onChange={(event) => setTitle(event.target.value)}
                onBlur={() => void saveTitle()}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    void saveTitle()
                  }
                  if (event.key === 'Escape') {
                    setTitle(task.title)
                    setRenaming(false)
                  }
                }}
                className={fieldClass}
              />
            ) : (
              <button
                type="button"
                onClick={() => setOpen((value) => !value)}
                aria-expanded={open}
                className="min-w-0 flex-1 rounded-lg text-left"
              >
                <h3 className="truncate text-sm font-semibold">{task.title}</h3>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {task.category}
                  {task.isActive ? '' : ' · Archived'}
                  {logsKnown ? ` · ${getStatusLabel(status)}` : ' · Loading log'}
                </p>
              </button>
            )}
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                aria-label={`Rename ${task.title}`}
                onClick={() => {
                  setTitle(task.title)
                  setRenaming(true)
                }}
                className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <Pencil size={14} />
              </button>
              <button
                type="button"
                aria-label={task.isActive ? `Archive ${task.title}` : `Restore ${task.title}`}
                onClick={() => void toggleArchive()}
                className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                {task.isActive ? <Archive size={14} /> : <ArchiveRestore size={14} />}
              </button>
            </div>
          </div>

          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className={cn('h-full rounded-full', {
                'bg-emerald-500': status === 'done',
                'bg-amber-500': status === 'partial',
                'bg-rose-500': status === 'not_done',
                'bg-foreground/20': status === 'pending' || !logsKnown,
              })}
              style={{ width: `${percent}%` }}
            />
          </div>
          <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {logsKnown ? (
                <>
                  <span className={cn('font-medium', colors.text)}>{completed}</span>
                  <span>
                    /{task.target} {task.unit}
                  </span>
                </>
              ) : (
                'Log not loaded'
              )}
            </span>
            <span>{logsKnown ? `${percent}%` : ''}</span>
          </div>

          {logsKnown && task.isActive ? (
            <div className="mt-3 grid grid-cols-3 gap-1.5">
              <StatusButton
                label="Done"
                pressed={status === 'done'}
                disabled={busy}
                onClick={() => void saveLog(task.target)}
              />
              <StatusButton
                label="Half"
                pressed={half != null && completed === half && status === 'partial'}
                disabled={half == null || busy}
                onClick={() => {
                  if (half != null) void saveLog(half)
                }}
              />
              <StatusButton
                label="Miss"
                pressed={status === 'not_done'}
                disabled={busy}
                onClick={() => void saveLog(0)}
              />
            </div>
          ) : null}

          {open ? (
            <LogEditor
              key={`${log?.id ?? 'new'}-${log?.completed ?? 0}-${log?.notes ?? ''}`}
              task={task}
              log={log}
              disabled={!logsKnown}
              onSave={(completedValue, notes) => saveLog(completedValue, notes)}
              onClear={
                log && !log.id.startsWith('temp-') && !busy
                  ? async () => {
                      try {
                        await deleteLog(log.id)
                        if (reportRange) void fetchReport(reportRange.start, reportRange.end)
                      } catch (error) {
                        toast.error(apiMessage(error, 'Could not clear this log'))
                      }
                    }
                  : undefined
              }
              onEdit={() => setDialog({ type: 'edit', taskId: task.id })}
              onDelete={() => setDialog({ type: 'delete', taskId: task.id })}
            />
          ) : null}
        </div>
      </div>
    </article>
  )
}

function StatusButton({
  label,
  pressed,
  disabled,
  onClick,
}: {
  label: string
  pressed: boolean
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'rounded-lg border px-2 py-1.5 text-xs font-medium',
        pressed
          ? 'border-ring bg-accent text-accent-foreground'
          : 'border-border text-muted-foreground hover:text-foreground',
        disabled && 'cursor-not-allowed opacity-40',
      )}
    >
      {label}
    </button>
  )
}

function LogEditor({
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
          className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
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
        className={cn(fieldClass, 'resize-none')}
      />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-2">
          <button type="button" onClick={onEdit} className="text-xs text-muted-foreground hover:text-foreground">
            Edit details
          </button>
          {onClear ? (
            <button
              type="button"
              onClick={() => void onClear()}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Clear log
            </button>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onDelete}
          className="inline-flex items-center gap-1 text-xs text-rose-700 hover:underline dark:text-rose-300"
        >
          <Trash2 size={12} />
          Delete task
        </button>
      </div>
    </form>
  )
}
