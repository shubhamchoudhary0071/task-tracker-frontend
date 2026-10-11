'use client'

import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { ChartFrame, ChartTooltip, useChartTheme } from '@/components/charts/chart-frame'

type Row = {
  name: string
  fullName: string
  pct: number
  color: string
}

export default function TaskPerformanceChart({ rows }: { rows: Row[] }) {
  const theme = useChartTheme()

  if (rows.length === 0) {
    return (
      <ChartFrame title="Task performance" subtitle="Average of logged days">
        <p className="py-10 text-center text-sm text-muted-foreground">No task logs in this range.</p>
      </ChartFrame>
    )
  }

  return (
    <ChartFrame title="Task performance" subtitle="Average of days that have a log">
      <div className="w-full min-w-0" style={{ height: Math.max(180, rows.length * 36) }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 28, left: 0, bottom: 0 }}>
            <XAxis
              type="number"
              domain={[0, 100]}
              tick={{ fill: theme.tick, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value: number) => `${value}%`}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={84}
              tick={{ fill: theme.tick, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              cursor={{ fill: theme.cursor }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const row = payload[0].payload as Row
                return (
                  <ChartTooltip
                    label={row.fullName}
                    rows={[{ name: 'Logged days', value: `${row.pct}%`, color: row.color }]}
                  />
                )
              }}
            />
            <Bar dataKey="pct" radius={[0, 4, 4, 0]} barSize={14}>
              {rows.map((row) => (
                <Cell key={row.fullName} fill={row.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartFrame>
  )
}
