import type { StateCreator } from 'zustand'

import { apiMessage } from '@/lib/api-error'
import { normalizeReport } from '@/lib/tasks'
import type { TaskStore } from '@/store/types'
import apiClient from '@/utils/apiClient'

let reportEpoch = 0

export type ReportSlice = Pick<
  TaskStore,
  'report' | 'reportRange' | 'reportLoading' | 'reportError' | 'fetchReport'
>

export const createReportSlice: StateCreator<TaskStore, [], [], ReportSlice> = (set) => ({
  report: null,
  reportRange: null,
  reportLoading: false,
  reportError: null,

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
})
