'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import type { SortKey, StatusFilter } from '@/lib/types'

export type TaskDialog =
  | null
  | { type: 'create' }
  | { type: 'edit'; taskId: string }
  | { type: 'delete'; taskId: string }

type Preferences = {
  sort: SortKey
  status: StatusFilter
  category: string
  query: string
  showArchived: boolean
  dialog: TaskDialog
  setSort: (sort: SortKey) => void
  setStatus: (status: StatusFilter) => void
  setCategory: (category: string) => void
  setQuery: (query: string) => void
  setShowArchived: (showArchived: boolean) => void
  setDialog: (dialog: TaskDialog) => void
}

export const usePreferences = create<Preferences>()(
  persist(
    (set) => ({
      sort: 'attention',
      status: 'all',
      category: 'all',
      query: '',
      showArchived: false,
      dialog: null,
      setSort: (sort) => set({ sort }),
      setStatus: (status) => set({ status }),
      setCategory: (category) => set({ category }),
      setQuery: (query) => set({ query }),
      setShowArchived: (showArchived) => set({ showArchived }),
      setDialog: (dialog) => set({ dialog }),
    }),
    {
      name: 'taskflow-preferences',
      partialize: (state) => ({
        sort: state.sort,
        status: state.status,
        category: state.category,
        showArchived: state.showArchived,
      }),
    },
  ),
)
