'use client'

import { useState } from 'react'
import { toast } from 'sonner'

import Modal from '@/components/modal'
import { apiMessage } from '@/lib/api-error'
import type { Task } from '@/lib/types'
import { useTaskStore } from '@/store/taskStore'

export default function DeleteTaskDialog({ task, onClose }: { task: Task; onClose: () => void }) {
  const deleteTask = useTaskStore((state) => state.deleteTask)

  return (
    <Modal
      open
      title={`Delete ${task.title}?`}
      description="This removes the task and its logged days. This cannot be undone."
      onClose={onClose}
    >
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex min-h-11 items-center justify-center rounded-xl px-4 text-sm text-muted-foreground hover:bg-muted"
        >
          Cancel
        </button>
        <DeleteButton
          onDelete={async () => {
            await deleteTask(task.id)
            toast.success('Task deleted')
            onClose()
          }}
        />
      </div>
    </Modal>
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
        void onDelete().catch((error: unknown) => {
          toast.error(apiMessage(error, 'Could not delete that task'))
          setPending(false)
        })
      }}
      className="inline-flex min-h-11 items-center justify-center rounded-xl bg-rose-600 px-4 text-sm font-semibold text-white hover:bg-rose-500 disabled:opacity-60"
    >
      {pending ? 'Deleting…' : 'Delete task'}
    </button>
  )
}
