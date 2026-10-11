import type { StateCreator } from 'zustand'

import { apiMessage } from '@/lib/api-error'
import type { Task } from '@/lib/types'
import { normalizeLog, normalizeTask, todayKey } from '@/lib/tasks'
import { usePreferences } from '@/store/preferences'
import {
  bumpRevision,
  discardedTempIds,
  replaceLog,
  taskEdits,
  tempId,
} from '@/store/log-cache'
import type { TaskStore } from '@/store/types'
import apiClient from '@/utils/apiClient'

export type TaskSlice = Pick<
  TaskStore,
  | 'tasks'
  | 'tasksLoading'
  | 'tasksError'
  | 'selectedDate'
  | 'setSelectedDate'
  | 'fetchTasks'
  | 'createTask'
  | 'updateTask'
  | 'deleteTask'
>

export const createTaskSlice: StateCreator<TaskStore, [], [], TaskSlice> = (set, get) => ({
  tasks: [],
  tasksLoading: true,
  tasksError: null,
  selectedDate: todayKey(),

  setSelectedDate: (date) => set({ selectedDate: date }),

  fetchTasks: async () => {
    set({ tasksLoading: true, tasksError: null })
    try {
      const { data } = await apiClient.get('/task')
      const serverTasks: Task[] = Array.isArray(data?.data)
        ? data.data.map((item: unknown) => normalizeTask(item))
        : []
      const previous = get().tasks
      const pending = previous.filter((task) => task.id.startsWith('temp-'))
      const keyed = serverTasks.map((task) => {
        const match = previous.find((item) => item.id === task.id && item.clientKey)
        return match ? { ...task, clientKey: match.clientKey } : task
      })
      set({
        tasks: [...pending, ...keyed],
        tasksLoading: false,
        tasksError: null,
      })
    } catch (error) {
      set({
        tasksLoading: false,
        tasksError: apiMessage(error, 'Could not load tasks'),
      })
    }
  },

  createTask: async (input) => {
    const id = tempId()
    const optimistic = {
      ...normalizeTask({
        ...input,
        _id: id,
        isActive: input.isActive ?? true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
      clientKey: id,
    }
    set((state) => ({ tasks: [optimistic, ...state.tasks] }))
    try {
      const { data } = await apiClient.post('/task', {
        ...input,
        repeatType: input.repeatType ?? 'daily',
      })
      const created = normalizeTask(data?.data)

      if (discardedTempIds.has(optimistic.id)) {
        discardedTempIds.delete(optimistic.id)
        await apiClient.delete(`/task/${created.id}`)
        set((state) => ({
          tasks: state.tasks.filter((task) => task.id !== optimistic.id && task.id !== created.id),
          logs: state.logs.filter((log) => log.taskId !== optimistic.id && log.taskId !== created.id),
        }))
        return created
      }

      const localLogs = get().logs.filter((log) => log.taskId === optimistic.id)
      for (const log of localLogs) bumpRevision(created.id, log.date)
      set((state) => ({
        tasks: state.tasks.map((task) =>
          task.id === optimistic.id
            ? {
                ...created,
                clientKey: task.clientKey ?? optimistic.id,
                title: task.title,
                description: task.description,
                target: task.target,
                unit: task.unit,
                category: task.category,
                color: task.color,
                isActive: task.isActive,
              }
            : task,
        ),
        logs: state.logs.map((log) =>
          log.taskId === optimistic.id ? { ...log, taskId: created.id } : log,
        ),
      }))
      const dialog = usePreferences.getState().dialog
      if (dialog && 'taskId' in dialog && dialog.taskId === optimistic.id) {
        usePreferences.getState().setDialog({ ...dialog, taskId: created.id })
      }

      const current = get().tasks.find((task) => task.id === created.id)
      const edits = current ? taskEdits(current, created) : {}
      if (Object.keys(edits).length > 0) {
        await apiClient.put(`/task/${created.id}`, edits)
      }

      for (const log of localLogs) {
        const { data: savedBody } = await apiClient.post('/task/logs/upsert', {
          taskId: created.id,
          date: log.date,
          completed: log.completed,
          notes: log.notes,
        })
        const saved = normalizeLog(savedBody?.data)
        set((state) => ({
          logs: replaceLog(state.logs, saved.taskId ? saved : { ...saved, taskId: created.id }),
        }))
      }

      return get().tasks.find((task) => task.id === created.id) ?? created
    } catch (error) {
      discardedTempIds.delete(optimistic.id)
      set((state) => ({ tasks: state.tasks.filter((task) => task.id !== optimistic.id) }))
      throw error
    }
  },

  updateTask: async (id, updates) => {
    const previous = get().tasks.find((task) => task.id === id)
    if (!previous) return
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === id ? { ...task, ...updates, updatedAt: new Date().toISOString() } : task,
      ),
    }))
    if (id.startsWith('temp-')) return
    try {
      const { data } = await apiClient.put(`/task/${id}`, updates)
      const updated = normalizeTask(data?.data)
      set((state) => ({
        tasks: state.tasks.map((task) =>
          task.id === id ? { ...updated, clientKey: task.clientKey } : task,
        ),
      }))
    } catch (error) {
      set((state) => ({
        tasks: state.tasks.map((task) => (task.id === id ? previous : task)),
      }))
      throw error
    }
  },

  deleteTask: async (id) => {
    const previousTask = get().tasks.find((task) => task.id === id)
    const previousLogs = get().logs.filter((log) => log.taskId === id)
    set((state) => ({
      tasks: state.tasks.filter((task) => task.id !== id),
      logs: state.logs.filter((log) => log.taskId !== id),
    }))
    if (id.startsWith('temp-')) {
      discardedTempIds.add(id)
      return
    }
    try {
      await apiClient.delete(`/task/${id}`)
    } catch (error) {
      set((state) => ({
        tasks: previousTask ? [previousTask, ...state.tasks] : state.tasks,
        logs: [...state.logs, ...previousLogs],
      }))
      throw error
    }
  },
})
