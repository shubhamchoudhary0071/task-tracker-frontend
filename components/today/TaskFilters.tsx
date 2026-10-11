'use client'

import { Search } from 'lucide-react'

import { CATEGORIES } from '@/lib/sampleData'
import type { SortKey, StatusFilter } from '@/lib/types'
import { cn } from '@/lib/utils'

const FILTERS: Array<{ key: StatusFilter; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Open' },
  { key: 'partial', label: 'Partial' },
  { key: 'done', label: 'Done' },
  { key: 'not_done', label: 'Missed' },
]

const SORTS: Array<{ key: SortKey; label: string }> = [
  { key: 'attention', label: 'Needs attention' },
  { key: 'title', label: 'Name' },
  { key: 'category', label: 'Category' },
  { key: 'newest', label: 'Newest' },
  { key: 'progress', label: 'Most complete' },
]

export default function TaskFilters({
  query,
  sort,
  category,
  status,
  counts,
  onQuery,
  onSort,
  onCategory,
  onStatus,
}: {
  query: string
  sort: SortKey
  category: string
  status: StatusFilter
  counts: Record<StatusFilter, number>
  onQuery: (query: string) => void
  onSort: (sort: SortKey) => void
  onCategory: (category: string) => void
  onStatus: (status: StatusFilter) => void
}) {
  return (
    <div className="mt-4 flex flex-col gap-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative min-w-0 flex-1">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <label htmlFor="task-search" className="sr-only">
            Search tasks
          </label>
          <input
            id="task-search"
            value={query}
            onChange={(event) => onQuery(event.target.value)}
            placeholder="Search tasks"
            className="min-h-11 w-full rounded-xl border border-border bg-card py-2.5 pl-9 pr-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
          />
        </div>
        <label className="sr-only" htmlFor="task-sort">
          Sort
        </label>
        <select
          id="task-sort"
          value={sort}
          onChange={(event) => onSort(event.target.value as SortKey)}
          className="min-h-11 rounded-xl border border-border bg-card px-3 text-sm"
        >
          {SORTS.map((item) => (
            <option key={item.key} value={item.key}>
              {item.label}
            </option>
          ))}
        </select>
        <label className="sr-only" htmlFor="task-category">
          Category
        </label>
        <select
          id="task-category"
          value={category}
          onChange={(event) => onCategory(event.target.value)}
          className="min-h-11 rounded-xl border border-border bg-card px-3 text-sm"
        >
          <option value="all">All categories</option>
          {CATEGORIES.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((item) => (
          <button
            key={item.key}
            type="button"
            aria-pressed={status === item.key}
            onClick={() => onStatus(item.key)}
            className={cn(
              'inline-flex min-h-11 items-center rounded-full border px-3 text-xs',
              status === item.key
                ? 'border-ring bg-accent text-accent-foreground'
                : 'border-border text-muted-foreground',
            )}
          >
            {item.label} {counts[item.key]}
          </button>
        ))}
      </div>
    </div>
  )
}
