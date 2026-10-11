'use client'

import { useState } from 'react'
import { toast } from 'sonner'

import Modal from '@/components/modal'
import { CATEGORIES } from '@/lib/sampleData'
import { apiMessage } from '@/lib/api-error'
import { cn } from '@/lib/utils'
import { usePreferences } from '@/store/preferences'
import { useTaskStore } from '@/store/taskStore'

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

const fieldClass =
  'w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 disabled:opacity-60'

type FormState = {
  title: string
  description: string
  target: string
  unit: string
  category: string
  color: string
}

const EMPTY_FORM: FormState = {
  title: '',
  description: '',
  target: '1',
  unit: 'tasks',
  category: 'Personal',
  color: '#ec4899',
}

function validate(form: FormState): Record<string, string> {
  const errors: Record<string, string> = {}
  const title = form.title.trim()
  if (!title) errors.title = 'Give the task a name.'
  else if (title.length > 120) errors.title = 'Keep the name under 120 characters.'

  const target = Number(form.target)
  if (!form.target.trim() || !Number.isFinite(target) || target <= 0) {
    errors.target = 'Enter a daily target greater than 0.'
  } else if (target > 100_000) {
    errors.target = 'That target is too large.'
  }

  return errors
}

function TaskFields({
  form,
  errors,
  disabled,
  onChange,
}: {
  form: FormState
  errors: Record<string, string>
  disabled: boolean
  onChange: (next: FormState) => void
}) {
  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="task-title" className="mb-1.5 block text-sm font-medium">
          Name
        </label>
        <input
          id="task-title"
          value={form.title}
          disabled={disabled}
          autoFocus
          maxLength={120}
          onChange={(event) => onChange({ ...form, title: event.target.value })}
          aria-invalid={Boolean(errors.title)}
          aria-describedby={errors.title ? 'task-title-error' : undefined}
          className={fieldClass}
          placeholder="DSA practice"
        />
        {errors.title ? (
          <p id="task-title-error" className="mt-1 text-xs text-rose-700 dark:text-rose-300">
            {errors.title}
          </p>
        ) : null}
      </div>

      <div>
        <label htmlFor="task-description" className="mb-1.5 block text-sm font-medium">
          Description
        </label>
        <textarea
          id="task-description"
          value={form.description}
          disabled={disabled}
          rows={2}
          maxLength={400}
          onChange={(event) => onChange({ ...form, description: event.target.value })}
          className={cn(fieldClass, 'resize-none')}
          placeholder="What does finishing this look like?"
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[8rem_1fr]">
        <div>
          <label htmlFor="task-target" className="mb-1.5 block text-sm font-medium">
            Daily target
          </label>
          <input
            id="task-target"
            type="number"
            min={1}
            step="any"
            inputMode="decimal"
            value={form.target}
            disabled={disabled}
            onChange={(event) => onChange({ ...form, target: event.target.value })}
            aria-invalid={Boolean(errors.target)}
            aria-describedby={errors.target ? 'task-target-error' : undefined}
            className={fieldClass}
          />
          {errors.target ? (
            <p id="task-target-error" className="mt-1 text-xs text-rose-700 dark:text-rose-300">
              {errors.target}
            </p>
          ) : null}
        </div>
        <div>
          <label htmlFor="task-unit" className="mb-1.5 block text-sm font-medium">
            Unit
          </label>
          <select
            id="task-unit"
            value={form.unit}
            disabled={disabled}
            onChange={(event) => onChange({ ...form, unit: event.target.value })}
            className={fieldClass}
          >
            {UNITS.map((unit) => (
              <option key={unit} value={unit}>
                {unit}
              </option>
            ))}
            {UNITS.includes(form.unit as (typeof UNITS)[number]) ? null : (
              <option value={form.unit}>{form.unit}</option>
            )}
          </select>
        </div>
      </div>

      <fieldset>
        <legend className="mb-1.5 text-sm font-medium">Category</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {CATEGORIES.map((category) => {
            const selected = form.category === category.value
            return (
              <button
                key={category.value}
                type="button"
                disabled={disabled}
                aria-pressed={selected}
                onClick={() =>
                  onChange({
                    ...form,
                    category: category.value,
                    color: category.color,
                  })
                }
                className={cn(
                  'flex min-w-0 items-center gap-2 rounded-xl border px-3 py-2 text-left text-xs',
                  selected
                    ? 'border-ring bg-accent text-accent-foreground'
                    : 'border-border text-muted-foreground hover:text-foreground',
                )}
              >
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: category.color }}
                />
                <span className="truncate">{category.label}</span>
              </button>
            )
          })}
        </div>
      </fieldset>
    </div>
  )
}

export default function TaskDialogs() {
  const dialog = usePreferences((state) => state.dialog)
  const setDialog = usePreferences((state) => state.setDialog)
  const tasks = useTaskStore((state) => state.tasks)
  const createTask = useTaskStore((state) => state.createTask)
  const updateTask = useTaskStore((state) => state.updateTask)
  const deleteTask = useTaskStore((state) => state.deleteTask)
  const editing = dialog?.type === 'edit' ? tasks.find((task) => task.id === dialog.taskId) : undefined
  const removing = dialog?.type === 'delete' ? tasks.find((task) => task.id === dialog.taskId) : undefined

  return (
    <>
      {dialog?.type === 'create' ? (
        <TaskForm
          key="create"
          title="New daily task"
          description="It shows up every day until you archive it."
          initial={EMPTY_FORM}
          submitLabel="Create task"
          onClose={() => setDialog(null)}
          onSubmit={async (form) => {
            await createTask({
              title: form.title.trim(),
              description: form.description.trim(),
              target: Number(form.target),
              unit: form.unit,
              category: form.category,
              color: form.color,
              repeatType: 'daily',
            })
            toast.success('Task added')
          }}
        />
      ) : null}

      {editing ? (
        <TaskForm
          key={editing.id}
          title="Edit task"
          description="Changes apply to this task going forward. Past logs stay as they were."
          initial={{
            title: editing.title,
            description: editing.description,
            target: String(editing.target),
            unit: editing.unit,
            category: editing.category,
            color: editing.color,
          }}
          submitLabel="Save changes"
          onClose={() => setDialog(null)}
          onSubmit={async (form) => {
            await updateTask(editing.id, {
              title: form.title.trim(),
              description: form.description.trim(),
              target: Number(form.target),
              unit: form.unit,
              category: form.category,
              color: form.color,
            })
            toast.success('Task updated')
          }}
        />
      ) : null}

      {removing ? (
        <Modal
          open
          title={`Delete ${removing.title}?`}
          description="This removes the task and its logged days. This cannot be undone."
          onClose={() => setDialog(null)}
        >
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setDialog(null)}
              className="rounded-xl px-4 py-2.5 text-sm text-muted-foreground hover:bg-muted"
            >
              Cancel
            </button>
            <DeleteButton
              onDelete={async () => {
                await deleteTask(removing.id)
                toast.success('Task deleted')
                setDialog(null)
              }}
            />
          </div>
        </Modal>
      ) : null}
    </>
  )
}

function DeleteButton({ onDelete }: { onDelete: () => Promise<void> }) {
  const [pending, setPending] = useState(false)

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        setPending(true)
        void onDelete()
          .catch((error: unknown) => {
            toast.error(apiMessage(error, 'Could not delete that task'))
            setPending(false)
          })
      }}
      className="rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-500 disabled:opacity-60"
    >
      {pending ? 'Deleting…' : 'Delete task'}
    </button>
  )
}

function TaskForm({
  title,
  description,
  initial,
  submitLabel,
  onClose,
  onSubmit,
}: {
  title: string
  description: string
  initial: FormState
  submitLabel: string
  onClose: () => void
  onSubmit: (form: FormState) => Promise<void>
}) {
  const [form, setForm] = useState(initial)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  return (
    <Modal open title={title} description={description} onClose={onClose}>
      <form
        className="space-y-4"
        noValidate
        onSubmit={(event) => {
          event.preventDefault()
          const nextErrors = validate(form)
          setErrors(nextErrors)
          if (Object.keys(nextErrors).length > 0) return
          setPending(true)
          setFormError(null)
          void onSubmit(form)
            .then(onClose)
            .catch((error: unknown) => {
              setFormError(apiMessage(error, 'Could not save that task'))
              setPending(false)
            })
        }}
      >
        {formError ? (
          <p role="alert" className="rounded-xl border border-rose-600/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-700 dark:text-rose-200">
            {formError}
          </p>
        ) : null}
        <TaskFields form={form} errors={errors} disabled={pending} onChange={setForm} />
        <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            className="rounded-xl px-4 py-2.5 text-sm text-muted-foreground hover:bg-muted disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={pending}
            className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
          >
            {pending ? 'Saving…' : submitLabel}
          </button>
        </div>
      </form>
    </Modal>
  )
}
