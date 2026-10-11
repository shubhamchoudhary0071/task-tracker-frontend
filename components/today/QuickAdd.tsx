'use client'

import { useState } from 'react'
import { toast } from 'sonner'

import { apiMessage } from '@/lib/api-error'

export default function QuickAdd({ onCreate }: { onCreate: (title: string, target: number) => Promise<void> }) {
  const [title, setTitle] = useState('')
  const [target, setTarget] = useState('1')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  return (
    <form
      className="mt-4 rounded-2xl border border-border bg-card p-3"
      onSubmit={(event) => {
        event.preventDefault()
        const name = title.trim()
        const amount = Number(target)
        if (!name) {
          setError('Name the task first.')
          return
        }
        if (!Number.isFinite(amount) || amount <= 0) {
          setError('Target must be greater than 0.')
          return
        }
        setError(null)
        setPending(true)
        void onCreate(name, amount)
          .then(() => {
            setTitle('')
            setTarget('1')
          })
          .catch((caught: unknown) => {
            toast.error(apiMessage(caught, 'Could not add that task'))
          })
          .finally(() => setPending(false))
      }}
    >
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="min-w-0 flex-1">
          <label htmlFor="quick-add-title" className="sr-only">
            Quick add task name
          </label>
          <input
            id="quick-add-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Quick add a daily task"
            maxLength={120}
            className="min-h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
          />
        </div>
        <label htmlFor="quick-add-target" className="sr-only">
          Daily target
        </label>
        <input
          id="quick-add-target"
          type="number"
          min={1}
          value={target}
          onChange={(event) => setTarget(event.target.value)}
          aria-label="Daily target"
          className="min-h-11 w-full rounded-xl border border-input bg-background px-3 text-sm sm:w-24"
        />
        <button
          type="submit"
          disabled={pending}
          className="min-h-11 rounded-xl bg-secondary px-4 text-sm font-semibold text-secondary-foreground disabled:opacity-60"
        >
          {pending ? 'Adding…' : 'Add'}
        </button>
      </div>
      {error ? (
        <p className="mt-2 text-xs text-rose-700 dark:text-rose-300">{error}</p>
      ) : (
        <p className="mt-2 text-xs text-muted-foreground">
          Adds a personal task with a daily target. Use New task for category and notes.
        </p>
      )}
    </form>
  )
}
