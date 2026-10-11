'use client'

import { format, parseISO } from 'date-fns'
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { ChartFrame, ChartTooltip, useChartTheme } from '@/components/charts/chart-frame'
import type { DailyStat } from '@/lib/types'

export default function DailyChart({ days }: { days: DailyStat[] }) {
  const theme = useChartTheme()
  const data = days.map((day) => ({
    label: format(parseISO(day.date), 'MMM d'),
    Done: day.done,
    Partial: day.partial,
    Missed: day.notDone,
  }))
  const interval = data.length > 10 ? 2 : data.length > 7 ? 1 : 0

  return (
    <ChartFrame
      title="Daily completion"
      subtitle="Done, partial, and missed logs"
      legend={
        <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground">
          <span>Done</span>
          <span>Partial</span>
          <span>Missed</span>
        </div>
      }
    >
      {data.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">No days in this range.</p>
      ) : (
        <div className="h-56 w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} barSize={10} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <XAxis
                dataKey="label"
                tick={{ fill: theme.tick, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                interval={interval}
              />
              <YAxis
                tick={{ fill: theme.tick, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
                width={36}
              />
              <Tooltip
                cursor={{ fill: theme.cursor }}
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null
                  return (
                    <ChartTooltip
                      label={label}
                      rows={payload.map((item) => ({
                        name: String(item.name),
                        value: Number(item.value ?? 0),
                        color: String(item.color ?? theme.tick),
                      }))}
                    />
                  )
                }}
              />
              <Bar dataKey="Done" stackId="day" fill={theme.done} />
              <Bar dataKey="Partial" stackId="day" fill={theme.partial} />
              <Bar dataKey="Missed" stackId="day" fill={theme.missed} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </ChartFrame>
  )
}
