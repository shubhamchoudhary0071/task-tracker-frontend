'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { sampleTasks, sampleLogs } from '@/lib/sampleData'
import { format } from 'date-fns'

export const useTaskStore = create(
  persist(
    (set, get) => ({
      tasks: sampleTasks,
      dailyLogs: sampleLogs,
      selectedDate: format(new Date(), 'yyyy-MM-dd'),

      setSelectedDate: (date) => set({ selectedDate: date }),

      addTask: (task) =>
        set((state) => ({
          tasks: [
            ...state.tasks,
            {
              ...task,
              id: `task-${crypto.randomUUID()}`,
              createdAt: new Date().toISOString(),
              isActive: true,
            },
          ],
        })),

      updateTask: (id, updates) =>
        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
        })),

      deleteTask: (id) =>
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== id),
          dailyLogs: state.dailyLogs.filter((l) => l.taskId !== id),
        })),

      upsertLog: (taskId, date, data) =>
        set((state) => {
          const existing = state.dailyLogs.find(
            (l) => l.taskId === taskId && l.date === date
          )
          if (existing) {
            return {
              dailyLogs: state.dailyLogs.map((l) =>
                l.taskId === taskId && l.date === date
                  ? { ...l, ...data, updatedAt: new Date().toISOString() }
                  : l
              ),
            }
          }
          return {
            dailyLogs: [
              ...state.dailyLogs,
              {
                id: `log-${crypto.randomUUID()}`,
                taskId,
                date,
                ...data,
                updatedAt: new Date().toISOString(),
              },
            ],
          }
        }),

      getLogsForDate: (date) => {
        return get().dailyLogs.filter((l) => l.date === date)
      },

      getLogsForDateRange: (startDate, endDate) => {
        return get().dailyLogs.filter(
          (l) => l.date >= startDate && l.date <= endDate
        )
      },

      getTaskById: (id) => {
        return get().tasks.find((t) => t.id === id)
      },

      getTodayStats: (date) => {
        const d = date || get().selectedDate
        const logs = get().dailyLogs.filter((l) => l.date === d)
        const activeTasks = get().tasks.filter((t) => t.isActive)
        const done = logs.filter((l) => l.status === 'done').length
        const partial = logs.filter((l) => l.status === 'partial').length
        const notDone = logs.filter((l) => l.status === 'not_done').length
        const pending = activeTasks.length - logs.length
        return { total: activeTasks.length, done, partial, notDone, pending }
      },
    }),
    {
      name: 'task-tracker-v1',
    }
  )
)
