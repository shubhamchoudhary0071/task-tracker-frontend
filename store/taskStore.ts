'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { apiMessage } from '@/lib/api-error'
import type { DailyLog, ReportData, Task, TaskInput, UpsertLogInput } from '@/lib/types'
import {
  deriveStatus,
  eachDate,
  normalizeLog,
  normalizeReport,
  normalizeTask,
  todayKey,
} from '@/lib/tasks'
import apiClient from '@/utils/apiClient'
import { usePreferences } from '@/store/preferences'

type TaskStore = {
  tasks: Task[]
  logs: DailyLog[]
  loadedDates: string[]
  tasksLoading: boolean
  tasksError: string | null
  logsError: string | null
  report: ReportData | null
  reportRange: { start: string; end: string } | null
  reportLoading: boolean
  reportError: string | null
  selectedDate: string
  setSelectedDate: (date: string) => void
  fetchTasks: () => Promise<void>
  fetchLogsForDate: (date: string) => Promise<void>
  fetchLogsInRange: (start: string, end: string) => Promise<void>
  fetchReport: (start: string, end: string) => Promise<void>
  createTask: (input: TaskInput) => Promise<Task>
  updateTask: (id: string, updates: Partial<TaskInput>) => Promise<void>
  deleteTask: (id: string) => Promise<void>
  upsertLog: (taskId: string, date: string, input: UpsertLogInput, target: number) => Promise<void>
  deleteLog: (id: string) => Promise<void>
}

const dateEpoch = new Map<string, number>()
const logRevision = new Map<string, number>()
let epochSeq = 0
let reportEpoch = 0

function logKey(taskId: string, date: string): string {
  return `${taskId}|${date}`
}

function claimDates(dates: string[]): number {
  const epoch = ++epochSeq
  for (const date of dates) dateEpoch.set(date, epoch)
  return epoch
}

function datesStillCurrent(dates: string[], epoch: number): boolean {
  return dates.every((date) => dateEpoch.get(date) === epoch)
}

function snapshotRevisions(): Map<string, number> {
  return new Map(logRevision)
}

function bumpRevision(taskId: string, date: string): void {
  const key = logKey(taskId, date)
  logRevision.set(key, (logRevision.get(key) ?? 0) + 1)
}

function mergeLogs(
  existing: DailyLog[],
  incoming: DailyLog[],
  dates: string[],
  snapshot: Map<string, number>,
): DailyLog[] {
  const dateSet = new Set(dates)
  const edited = (log: DailyLog) =>
    (logRevision.get(logKey(log.taskId, log.date)) ?? 0) !== (snapshot.get(logKey(log.taskId, log.date)) ?? 0)

  const kept = existing.filter((log) => {
    if (!dateSet.has(log.date)) return true
    return edited(log)
  })

  const fresh = incoming.filter((log) => dateSet.has(log.date) && !edited(log))
  const freshKeys = new Set(fresh.map((log) => logKey(log.taskId, log.date)))
  return [...kept.filter((log) => !freshKeys.has(logKey(log.taskId, log.date))), ...fresh]
}

function replaceLog(logs: DailyLog[], next: DailyLog): DailyLog[] {
  const index = logs.findIndex((log) => log.taskId === next.taskId && log.date === next.date)
  if (index === -1) return [...logs, next]
  return logs.map((log, itemIndex) => (itemIndex === index ? next : log))
}

function tempId(): string {
  return `temp-${crypto.randomUUID()}`
}

const discardedTempIds = new Set<string>()

function taskEdits(local: Task, created: Task): Partial<TaskInput> {
  const updates: Partial<TaskInput> = {}
  if (local.title !== created.title) updates.title = local.title
  if (local.description !== created.description) updates.description = local.description
  if (local.target !== created.target) updates.target = local.target
  if (local.unit !== created.unit) updates.unit = local.unit
  if (local.category !== created.category) updates.category = local.category
  if (local.color !== created.color) updates.color = local.color
  if (local.isActive !== created.isActive) updates.isActive = local.isActive
  return updates
}

export const useTaskStore = create<TaskStore>()(
  persist(
    (set, get) => ({
      tasks: [],
      logs: [],
      loadedDates: [],
      tasksLoading: true,
      tasksError: null,
      logsError: null,
      report: null,
      reportRange: null,
      reportLoading: false,
      reportError: null,
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

      fetchLogsForDate: async (date) => {
        await get().fetchLogsInRange(date, date)
      },

      fetchLogsInRange: async (start, end) => {
        const dates = eachDate(start, end)
        if (dates.length === 0) return
        const epoch = claimDates(dates)
        const snapshot = snapshotRevisions()
        try {
          const { data } =
            start === end
              ? await apiClient.get(`/task/logs?date=${start}`)
              : await apiClient.get(`/task/logs/range?start=${start}&end=${end}`)

          if (!datesStillCurrent(dates, epoch)) return

          const payload = start === end ? data?.data : data?.data?.logs
          const incoming = Array.isArray(payload) ? payload.map(normalizeLog) : []
          set((state) => ({
            logs: mergeLogs(state.logs, incoming, dates, snapshot),
            loadedDates: Array.from(new Set([...state.loadedDates, ...dates])),
            logsError: null,
          }))
        } catch (error) {
          if (!datesStillCurrent(dates, epoch)) return
          set({ logsError: apiMessage(error, 'Could not load logs for this date') })
        }
      },

      fetchReport: async (start, end) => {
        const epoch = ++reportEpoch
        set({ reportLoading: true, reportError: null })
        try {
          const { data } = await apiClient.get(`/task/logs/report?start=${start}&end=${end}`)
          if (epoch !== reportEpoch) return
          set({
            report: normalizeReport(data?.data),
            reportRange: { start, end },
            reportLoading: false,
            reportError: null,
          })
        } catch (error) {
          if (epoch !== reportEpoch) return
          set({
            reportLoading: false,
            reportError: apiMessage(error, 'Could not load this report'),
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

      upsertLog: async (taskId, date, input, target) => {
        bumpRevision(taskId, date)
        const completed = Math.max(0, input.completed)
        const notes = input.notes?.trim() ?? ''
        const previous = get().logs.find((log) => log.taskId === taskId && log.date === date)
        const optimistic: DailyLog = {
          id: previous?.id && !previous.id.startsWith('temp-') ? previous.id : tempId(),
          taskId,
          date,
          completed,
          notes,
          status: deriveStatus(completed, target),
        }
        set((state) => ({ logs: replaceLog(state.logs, optimistic) }))
        if (taskId.startsWith('temp-')) return
        try {
          const { data } = await apiClient.post('/task/logs/upsert', {
            taskId,
            date,
            completed,
            notes,
          })
          const saved = normalizeLog(data?.data)
          const withTask = saved.taskId ? saved : { ...saved, taskId }
          set((state) => ({ logs: replaceLog(state.logs, withTask) }))
        } catch (error) {
          set((state) => ({
            logs: previous
              ? replaceLog(state.logs, previous)
              : state.logs.filter((log) => !(log.taskId === taskId && log.date === date)),
          }))
          throw error
        }
      },

      deleteLog: async (id) => {
        const previous = get().logs.find((log) => log.id === id)
        if (previous) bumpRevision(previous.taskId, previous.date)
        set((state) => ({ logs: state.logs.filter((log) => log.id !== id) }))
        if (id.startsWith('temp-')) return
        try {
          await apiClient.delete(`/task/logs/${id}`)
        } catch (error) {
          if (previous) {
            set((state) => ({ logs: replaceLog(state.logs, previous) }))
          }
          throw error
        }
      },
    }),
    {
      name: 'taskflow-storage',
      partialize: (state) => ({ selectedDate: state.selectedDate }),
    },
  ),
)
