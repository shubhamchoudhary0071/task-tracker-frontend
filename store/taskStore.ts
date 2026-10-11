'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { createLogSlice } from '@/store/slices/log-slice'
import { createReportSlice } from '@/store/slices/report-slice'
import { createTaskSlice } from '@/store/slices/task-slice'
import type { TaskStore } from '@/store/types'

export type { TaskStore } from '@/store/types'

export const useTaskStore = create<TaskStore>()(
  persist(
    (...args) => ({
      ...createTaskSlice(...args),
      ...createLogSlice(...args),
      ...createReportSlice(...args),
    }),
    {
      name: 'taskflow-storage',
      partialize: (state) => ({ selectedDate: state.selectedDate }),
    },
  ),
)
