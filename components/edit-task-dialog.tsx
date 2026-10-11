'use client'

import { toast } from 'sonner'

import TaskForm from '@/components/task-form'
import type { Task } from '@/lib/types'
import { useTaskStore } from '@/store/taskStore'

export default function EditTaskDialog({ task, onClose }: { task: Task; onClose: () => void }) {
  const updateTask = useTaskStore((state) => state.updateTask)

  return (
    <TaskForm
      key={task.clientKey ?? task.id}
      title="Edit task"
      description="Changes apply to this task going forward. Past logs stay as they were."
      initial={{
        title: task.title,
        description: task.description,
        target: String(task.target),
        unit: task.unit,
        category: task.category,
        color: task.color,
      }}
      submitLabel="Save changes"
      onClose={onClose}
      onSubmit={async (form) => {
        await updateTask(task.id, {
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
  )
}
