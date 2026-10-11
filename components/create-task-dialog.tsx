'use client'

import { toast } from 'sonner'

import TaskForm, { EMPTY_FORM } from '@/components/task-form'
import { useTaskStore } from '@/store/taskStore'

export default function CreateTaskDialog({ onClose }: { onClose: () => void }) {
  const createTask = useTaskStore((state) => state.createTask)

  return (
    <TaskForm
      key="create"
      title="New daily task"
      description="It shows up every day until you archive it."
      initial={EMPTY_FORM}
      submitLabel="Create task"
      onClose={onClose}
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
  )
}
