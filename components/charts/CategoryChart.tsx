'use client'

import { useMemo } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

import { useTaskStore } from '@/store/taskStore'

type DateRange = {
  start: string
  end: string
}

type CategoryChartProps = {
  dateRange: DateRange
}

type TaskStatus = 'done' | 'partial' | 'not_done'

type Task = {
  id: string
  category: string
  color: string
}

type TaskLog = {
  taskId: string
  status: TaskStatus
}

type CategoryData = {
  name: string
  value: number
  color: string
}

type CategoryMapValue = {
  count: number
  color: string
}

type CustomTooltipProps = {
  active?: boolean
  payload?: Array<{
    name?: string
    value?: number
    payload: CategoryData
  }>
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null

  const item = payload[0]

  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-900 p-3 font-body text-xs shadow-xl">
      <div className="flex items-center gap-2">
        <span
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: item.payload.color }}
        />

        <span className="font-semibold text-zinc-300">{item.name}</span>
      </div>

      <div className="mt-1 font-mono text-zinc-400">
        {item.value} tasks done
      </div>
    </div>
  )
}

export default function CategoryChart({ dateRange }: CategoryChartProps) {
  const { tasks, getLogsForDateRange } = useTaskStore()

  const logs = getLogsForDateRange(dateRange.start, dateRange.end) as TaskLog[]
  const taskList = tasks as Task[]

  const data = useMemo<CategoryData[]>(() => {
    const categoryMap: Record<string, CategoryMapValue> = {}

    logs.forEach((log) => {
      if (log.status !== 'done') return

      const task = taskList.find((item) => item.id === log.taskId)
      if (!task) return

      const category = task.category

      if (!categoryMap[category]) {
        categoryMap[category] = {
          count: 0,
          color: task.color,
        }
      }

      categoryMap[category].count += 1
    })

    return Object.entries(categoryMap).map(([name, item]) => ({
      name,
      value: item.count,
      color: item.color,
    }))
  }, [logs, taskList])

  const total = data.reduce((sum, item) => sum + item.value, 0)

  if (data.length === 0) {
    return (
      <div className="flex min-h-[220px] items-center justify-center rounded-xl border border-zinc-800/60 bg-[#111113] p-4 sm:min-h-[240px] sm:p-5">
        <div className="text-center font-body text-xs text-zinc-600">
          No completed tasks in range
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-zinc-800/60 bg-[#111113] p-4 sm:p-5">
      <div className="mb-4">
        <h3 className="font-syne text-sm font-semibold text-zinc-100">
          By Category
        </h3>

        <p className="mt-0.5 font-body text-xs text-zinc-600">
          {total} completions total
        </p>
      </div>

      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-4">
        <div className="mx-auto h-[160px] w-full max-w-[220px] sm:h-[130px] sm:w-[130px] sm:max-w-none">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius="55%"
                outerRadius="82%"
                dataKey="value"
                paddingAngle={3}
              >
                {data.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>

              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="min-w-0 flex-1 space-y-2.5">
          {data.map((entry) => {
            const percentage = total > 0 ? Math.round((entry.value / total) * 100) : 0

            return (
              <div
                key={entry.name}
                className="flex min-w-0 items-center justify-between gap-3"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />

                  <span className="truncate font-body text-xs text-zinc-400">
                    {entry.name}
                  </span>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <div className="h-1 w-14 overflow-hidden rounded-full bg-zinc-800 sm:w-16">
                    <div
                      className="h-full rounded-full opacity-60"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: entry.color,
                      }}
                    />
                  </div>

                  <span className="w-5 text-right font-mono text-xs text-zinc-300">
                    {entry.value}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}