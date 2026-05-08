'use client'

import { useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'

import { useTaskStore } from '@/store/taskStore'

type DateRange = {
  start: string
  end: string
}

type TaskPerformanceChartProps = {
  dateRange: DateRange
}

type Task = {
  id: string
  title: string
  target: number
  color: string
  isActive: boolean
}

type TaskLog = {
  taskId: string
  completed: number
}

type ChartData = {
  name: string
  fullName: string
  pct: number
  color: string
}

type TooltipPayloadItem = {
  value?: number
  payload: ChartData
}

type CustomTooltipProps = {
  active?: boolean
  payload?: TooltipPayloadItem[]
  label?: string | number
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null

  const item = payload[0]

  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-900 p-3 font-body text-xs shadow-xl">
      <div className="mb-1 font-semibold text-zinc-300">
        {item.payload.fullName || label}
      </div>

      <div className="font-mono text-zinc-400">
        {item.value ?? 0}% avg completion
      </div>
    </div>
  )
}

function truncateTaskName(title: string): string {
  return title.length > 12 ? `${title.substring(0, 12)}…` : title
}

export default function TaskPerformanceChart({
  dateRange,
}: TaskPerformanceChartProps) {
  const { tasks, getLogsForDateRange } = useTaskStore()

  const data = useMemo<ChartData[]>(() => {
    const logs = getLogsForDateRange(dateRange.start, dateRange.end) as TaskLog[]
    const taskList = tasks as Task[]

    return taskList
      .filter((task) => task.isActive)
      .map((task) => {
        const taskLogs = logs.filter((log) => log.taskId === task.id)

        if (taskLogs.length === 0 || task.target <= 0) {
          return {
            name: truncateTaskName(task.title),
            fullName: task.title,
            pct: 0,
            color: task.color,
          }
        }

        const avgPct = Math.round(
          taskLogs.reduce((sum, log) => {
            const percent = Math.min(100, (log.completed / task.target) * 100)
            return sum + percent
          }, 0) / taskLogs.length
        )

        return {
          name: truncateTaskName(task.title),
          fullName: task.title,
          pct: avgPct,
          color: task.color,
        }
      })
      .sort((a, b) => b.pct - a.pct)
  }, [tasks, getLogsForDateRange, dateRange.start, dateRange.end])

  const chartHeight = Math.max(220, data.length * 42)

  if (data.length === 0) {
    return (
      <div className="flex min-h-[220px] items-center justify-center rounded-xl border border-zinc-800/60 bg-[#111113] p-4 sm:p-5">
        <div className="text-center font-body text-xs text-zinc-600">
          No active tasks found
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-zinc-800/60 bg-[#111113] p-4 sm:p-5">
      <div className="mb-5">
        <h3 className="font-syne text-sm font-semibold text-zinc-100">
          Task Performance
        </h3>

        <p className="mt-0.5 font-body text-xs text-zinc-600">
          Average completion % per task
        </p>
      </div>

      <div className="-mx-2 overflow-x-auto pb-1 sm:mx-0">
        <div
          className="min-w-[430px] sm:min-w-0"
          style={{ height: chartHeight }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              barSize={16}
              layout="vertical"
              margin={{
                top: 4,
                right: 16,
                left: 0,
                bottom: 0,
              }}
            >
              <XAxis
                type="number"
                domain={[0, 100]}
                tick={{
                  fill: '#52525b',
                  fontSize: 10,
                  fontFamily: 'JetBrains Mono',
                }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value: number) => `${value}%`}
              />

              <YAxis
                type="category"
                dataKey="name"
                tick={{
                  fill: '#a1a1aa',
                  fontSize: 11,
                  fontFamily: 'Outfit',
                }}
                axisLine={false}
                tickLine={false}
                width={92}
              />

              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: 'rgba(255,255,255,0.02)' }}
              />

              <Bar dataKey="pct" radius={[0, 4, 4, 0]}>
                {data.map((entry) => (
                  <Cell
                    key={entry.fullName}
                    fill={entry.color}
                    fillOpacity={0.85}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}