'use client'

import { useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from 'recharts'
import { format, subDays } from 'date-fns'

import { useTaskStore } from '@/store/taskStore'

type TaskStatus = 'done' | 'partial' | 'not_done'

type Task = {
  id: string
  isActive: boolean
  createdAt: string
}

type TaskLog = {
  status: TaskStatus
}

type TrendChartProps = {
  days?: number
}

type ChartData = {
  date: string
  completion: number
}

type TooltipPayloadItem = {
  value?: number
}

type CustomTooltipProps = {
  active?: boolean
  payload?: TooltipPayloadItem[]
  label?: string | number
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null

  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-900 p-3 font-body text-xs shadow-xl">
      <div className="mb-1 font-mono text-zinc-400">{label}</div>

      <div className="font-mono font-semibold text-amber-400">
        {payload[0].value ?? 0}% completion
      </div>
    </div>
  )
}

export default function TrendChart({ days = 14 }: TrendChartProps) {
  const { tasks, getLogsForDateRange } = useTaskStore()

  const activeTasks = useMemo(() => {
    return (tasks as Task[]).filter((task) => task.isActive)
  }, [tasks])

  const data = useMemo<ChartData[]>(() => {
    return Array.from({ length: days }, (_, index) => {
      const date = subDays(new Date(), days - 1 - index)
      const dateStr = format(date, 'yyyy-MM-dd')

      const logs = getLogsForDateRange(dateStr, dateStr) as TaskLog[]

      const taskCount = activeTasks.filter((task) => {
        return new Date(task.createdAt) <= date
      }).length

      const done = logs.filter((log) => log.status === 'done').length
      const partial = logs.filter((log) => log.status === 'partial').length

      const completion =
        taskCount > 0
          ? Math.round(((done + partial * 0.5) / taskCount) * 100)
          : 0

      return {
        date: format(date, 'MMM d'),
        completion,
      }
    })
  }, [activeTasks, days, getLogsForDateRange])

  const avg =
    data.length > 0
      ? Math.round(
          data.reduce((sum, item) => sum + item.completion, 0) / data.length
        )
      : 0

  return (
    <div className="rounded-xl border border-zinc-800/60 bg-[#111113] p-4 sm:p-5">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-syne text-sm font-semibold text-zinc-100">
            Completion Rate Trend
          </h3>

          <p className="mt-0.5 font-body text-xs text-zinc-600">
            Last {days} days
          </p>
        </div>

        <div className="flex items-end justify-between gap-4 sm:block sm:text-right">
          <div className="font-mono text-lg font-semibold text-amber-400">
            {avg}%
          </div>

          <div className="font-body text-[11px] text-zinc-600">avg rate</div>
        </div>
      </div>

      <div className="-mx-2 overflow-x-auto pb-1 sm:mx-0">
        <div className="h-[220px] min-w-[520px] sm:h-[240px] sm:min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{
                top: 8,
                right: 12,
                left: -18,
                bottom: 0,
              }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#27272a"
                vertical={false}
              />

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
                domain={[0, 100]}
                tick={{
                  fill: '#52525b',
                  fontSize: 10,
                  fontFamily: 'JetBrains Mono',
                }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value: number) => `${value}%`}
                width={32}
              />

              <Tooltip content={<CustomTooltip />} />

              <ReferenceLine
                y={avg}
                stroke="#f59e0b"
                strokeDasharray="4 4"
                strokeOpacity={0.4}
              />

              <Line
                type="monotone"
                dataKey="completion"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={{
                  r: 3,
                  fill: '#f59e0b',
                  strokeWidth: 0,
                }}
                activeDot={{
                  r: 5,
                  fill: '#fcd34d',
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}