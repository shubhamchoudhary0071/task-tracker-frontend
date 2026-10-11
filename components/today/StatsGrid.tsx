'use client'

import type { DaySummary, StatusFilter } from '@/lib/types'

const STATS: Array<{ key: StatusFilter; label: string; value: keyof DaySummary }> = [
  { key: 'all', label: 'Active', value: 'total' },
  { key: 'done', label: 'Done', value: 'done' },
  { key: 'partial', label: 'Partial', value: 'partial' },
  { key: 'not_done', label: 'Missed', value: 'notDone' },
  { key: 'pending', label: 'Open', value: 'pending' },
]

export default function StatsGrid({
  summary,
  onFilter,
}: {
  summary: DaySummary
  onFilter: (status: StatusFilter) => void
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
      {STATS.map((stat) => (
        <button
          key={stat.key}
          type="button"
          onClick={() => onFilter(stat.key)}
          className="min-h-11 rounded-2xl border border-border bg-card px-3 py-3 text-left hover:bg-accent"
        >
          <div className="text-2xl font-semibold tabular-nums">{summary[stat.value]}</div>
          <div className="text-xs text-muted-foreground">{stat.label}</div>
        </button>
      ))}
    </div>
  )
}
