import type { StateCreator } from 'zustand'

import { apiMessage } from '@/lib/api-error'
import type { DailyLog } from '@/lib/types'
import { deriveStatus, eachDate, normalizeLog } from '@/lib/tasks'
import {
  bumpRevision,
  claimDates,
  datesStillCurrent,
  mergeLogs,
  replaceLog,
  snapshotRevisions,
  tempId,
} from '@/store/log-cache'
import type { TaskStore } from '@/store/types'
import apiClient from '@/utils/apiClient'

export type LogSlice = Pick<
  TaskStore,
  'logs' | 'loadedDates' | 'logsError' | 'fetchLogsForDate' | 'fetchLogsInRange' | 'upsertLog' | 'deleteLog'
>

export const createLogSlice: StateCreator<TaskStore, [], [], LogSlice> = (set, get) => ({
  logs: [],
  loadedDates: [],
  logsError: null,

  fetchLogsForDate: async (date) => {
    await get().fetchLogsInRange(date, date)
  },

  fetchLogsInRange: async (start, end) => {
    const dates = eachDate(start, end)
    if (dates.length === 0) return
    const epoch = claimDates(dates)
    const snapshot = snapshotRevisions()
    set({ logsError: null })
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
})
