'use client'

import TaskCard from '@/components/TaskCard'
import type { DailyLog, Task } from '@/lib/types'
import { logFor } from '@/lib/tasks'

export default function ArchivedList({
  open,
  tasks,
  date,
  logs,
  logsReady,
  onToggle,
}: {
  open: boolean
  tasks: Task[]
  date: string
  logs: DailyLog[]
  logsReady: boolean
  onToggle: () => void
}) {
  return (
    <>
      <div className="mt-4 flex items-center justify-between">
        <button
          type="button"
          aria-pressed={open}
          onClick={onToggle}
          className="inline-flex min-h-11 items-center text-sm text-muted-foreground hover:text-foreground"
        >
          {open ? 'Hide archived' : 'Show archived'}
        </button>
        <p className="text-xs text-muted-foreground">
          <kbd className="font-mono">/</kbd> search · <kbd className="font-mono">N</kbd> quick add
        </p>
      </div>

      {open ? (
        <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-2">
          {tasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">No archived tasks.</p>
          ) : (
            tasks.map((task) => (
              <TaskCard
                key={task.clientKey ?? task.id}
                task={task}
                date={date}
                log={logFor(logs, task.id, date)}
                logsKnown={logsReady}
              />
            ))
          )}
        </div>
      ) : null}
    </>
  )
}
