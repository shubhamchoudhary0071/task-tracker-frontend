'use client'

import { useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { format, subDays } from 'date-fns'

import { useTaskStore } from '@/store/taskStore'

type TaskStatus = 'done' | 'partial' | 'not_done'

type TaskLog = {
  status: TaskStatus
}

type ChartData = {
  date: string
  Done: number
  Partial: number
  Missed: number
}

type TooltipPayloadItem = {
  name?: string
  value?: number
  fill?: string
  color?: string
}

type CustomTooltipProps = {
  active?: boolean
  payload?: TooltipPayloadItem[]
  label?: string | number
}

type LegendItem = {
  label: string
  color: string
}

const LEGEND_ITEMS: LegendItem[] = [
  { label: 'Done', color: '#10b981' },
  { label: 'Partial', color: '#f59e0b' },
  { label: 'Missed', color: '#f43f5e' },
]

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null

  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-900 p-3 font-body text-xs shadow-xl">
      <div className="mb-2 font-mono text-zinc-400">{label}</div>

      {payload.map((item) => (
        <div key={item.name} className="mb-0.5 flex items-center gap-2">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: item.fill ?? item.color ?? '#71717a' }}
          />

          <span className="text-zinc-400">{item.name}:</span>

          <span className="font-mono font-semibold text-zinc-200">
            {item.value ?? 0}
          </span>
        </div>
      ))}
    </div>
  )
}

export default function DailyChart() {
  const { getLogsForDateRange } = useTaskStore()

  const data = useMemo<ChartData[]>(() => {
    return Array.from({ length: 14 }, (_, index) => {
      const date = subDays(new Date(), 13 - index)
      const dateStr = format(date, 'yyyy-MM-dd')
      const logs = getLogsForDateRange(dateStr, dateStr) as TaskLog[]

      const done = logs.filter((log) => log.status === 'done').length
      const partial = logs.filter((log) => log.status === 'partial').length
      const notDone = logs.filter((log) => log.status === 'not_done').length

      return {
        date: format(date, 'MMM d'),
        Done: done,
        Partial: partial,
        Missed: notDone,
      }
    })
  }, [getLogsForDateRange])

  return (
    <div className="rounded-xl border border-zinc-800/60 bg-[#111113] p-4 sm:p-5">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-syne text-sm font-semibold text-zinc-100">
            Daily Completion
          </h3>

          <p className="mt-0.5 font-body text-xs text-zinc-600">
            Last 14 days
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          {LEGEND_ITEMS.map((item) => (
            <div key={item.label} className="flex items-center gap-1.5">
              <span
                className="h-2 w-2 rounded-sm"
                style={{ backgroundColor: item.color }}
              />

              <span className="font-body text-[11px] text-zinc-500">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="-mx-2 overflow-x-auto pb-1 sm:mx-0">
        <div className="h-[220px] min-w-[520px] sm:h-[240px] sm:min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              barSize={10}
              barGap={2}
              barCategoryGap="28%"
              margin={{
                top: 8,
                right: 8,
                left: -18,
                bottom: 0,
              }}
            >
              <XAxis
                dataKey="date"
                tick={{
                  fill: '#52525b',
                  fontSize: 10,
                  fontFamily: 'JetBrains Mono',
                }}
                axisLine={false}
                tickLine={false}
                interval={0}
              />

              <YAxis
                tick={{
                  fill: '#52525b',
                  fontSize: 10,
                  fontFamily: 'JetBrains Mono',
                }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
                width={28}
              />

              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: 'rgba(255,255,255,0.02)' }}
              />

              <Bar
                dataKey="Done"
                stackId="daily"
                fill="#10b981"
                radius={[0, 0, 0, 0]}
              />

              <Bar
                dataKey="Partial"
                stackId="daily"
                fill="#f59e0b"
                radius={[0, 0, 0, 0]}
              />

              <Bar
                dataKey="Missed"
                stackId="daily"
                fill="#f43f5e"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}