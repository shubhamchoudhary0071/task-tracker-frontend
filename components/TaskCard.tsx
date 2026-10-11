'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Archive, ArchiveRestore, Pencil } from 'lucide-react'

import LogEditor from '@/components/log-editor'
import StatusButton from '@/components/status-button'
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
  logFailed?: boolean
  onRetryLog?: () => void
}

export default function TaskCard({ task, log, date, logsKnown, logFailed = false, onRetryLog }: TaskCardProps) {
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
  const status = logsKnown ? displayStatus(log, date) : 'pending'
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
                className="min-h-11 min-w-0 flex-1 rounded-lg py-1 text-left"
              >
                <h3 className="truncate text-sm font-semibold">{task.title}</h3>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {task.category}
                  {task.isActive ? '' : ' · Archived'}
                  {logsKnown ? ` · ${getStatusLabel(status)}` : logFailed ? ' · Log unavailable' : ' · Loading log'}
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
                className="inline-flex size-11 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <Pencil size={14} />
              </button>
              <button
                type="button"
                aria-label={task.isActive ? `Archive ${task.title}` : `Restore ${task.title}`}
                onClick={() => void toggleArchive()}
                className="inline-flex size-11 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
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
              ) : logFailed ? (
                'Couldn’t load this log'
              ) : (
                'Loading log'
              )}
            </span>
            <span>{logsKnown ? `${percent}%` : ''}</span>
          </div>

          {logFailed && !logsKnown ? (
            <button
              type="button"
              onClick={onRetryLog}
              className="mt-3 inline-flex min-h-11 items-center text-sm font-medium text-primary"
            >
              Retry
            </button>
          ) : null}

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
