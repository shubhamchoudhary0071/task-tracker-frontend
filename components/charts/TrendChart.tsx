'use client'

import { format, parseISO } from 'date-fns'
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { ChartFrame, ChartTooltip, useChartTheme } from '@/components/charts/chart-frame'
import type { DailyStat } from '@/lib/types'

export default function TrendChart({
  days,
  average = 0,
}: {
  days: DailyStat[]
  average?: number
}) {
  const theme = useChartTheme()
  const data = days.map((day) => ({
    label: format(parseISO(day.date), 'MMM d'),
    completion: day.completionPct,
  }))
  const interval = data.length > 10 ? 2 : data.length > 7 ? 1 : 0

  return (
    <ChartFrame
      title="Completion trend"
      subtitle="Share of the day's tasks finished"
      legend={<div className="text-right text-sm font-semibold text-primary">{average}% avg</div>}
    >
      <div className="h-56 w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
            <CartesianGrid stroke={theme.grid} vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: theme.tick, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              interval={interval}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fill: theme.tick, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value: number) => `${value}%`}
              width={48}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null
                return (
                  <ChartTooltip
                    label={label}
                    rows={[
                      {
                        name: 'Completion',
                        value: `${payload[0].value ?? 0}%`,
                        color: theme.line,
                      },
                    ]}
                  />
                )
              }}
            />
            <ReferenceLine y={average} stroke={theme.line} strokeDasharray="4 4" strokeOpacity={0.6} />
            <Line
              type="monotone"
              dataKey="completion"
              stroke={theme.line}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </ChartFrame>
  )
}
