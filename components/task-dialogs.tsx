'use client'

import CreateTaskDialog from '@/components/create-task-dialog'
import DeleteTaskDialog from '@/components/delete-task-dialog'
import EditTaskDialog from '@/components/edit-task-dialog'
import { usePreferences } from '@/store/preferences'
import { useTaskStore } from '@/store/taskStore'

export default function TaskDialogs() {
  const dialog = usePreferences((state) => state.dialog)
  const setDialog = usePreferences((state) => state.setDialog)
  const tasks = useTaskStore((state) => state.tasks)
  const editing = dialog?.type === 'edit' ? tasks.find((task) => task.id === dialog.taskId) : undefined
  const removing = dialog?.type === 'delete' ? tasks.find((task) => task.id === dialog.taskId) : undefined
  const close = () => setDialog(null)

  return (
    <>
      {dialog?.type === 'create' ? <CreateTaskDialog onClose={close} /> : null}
      {editing ? <EditTaskDialog task={editing} onClose={close} /> : null}
      {removing ? <DeleteTaskDialog task={removing} onClose={close} /> : null}
    </>
  )
}
