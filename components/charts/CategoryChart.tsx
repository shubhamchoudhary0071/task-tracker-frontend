'use client'

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

import { ChartFrame, ChartTooltip } from '@/components/charts/chart-frame'

type Slice = {
  name: string
  value: number
  color: string
}

export default function CategoryChart({ slices }: { slices: Slice[] }) {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0)

  if (slices.length === 0) {
    return (
      <ChartFrame title="By category" subtitle="Completed logs in this range">
        <p className="py-10 text-center text-sm text-muted-foreground">No completed tasks in this range.</p>
      </ChartFrame>
    )
  }

  return (
    <ChartFrame title="By category" subtitle={`${total} completions`}>
      <div className="flex flex-col items-center gap-4 sm:flex-row">
        <div className="h-36 w-full max-w-40 min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={slices} dataKey="value" innerRadius="58%" outerRadius="82%" paddingAngle={3}>
                {slices.map((slice) => (
                  <Cell key={slice.name} fill={slice.color} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const item = payload[0]
                  const slice = item.payload as Slice
                  return (
                    <ChartTooltip
                      rows={[
                        {
                          name: slice.name,
                          value: Number(item.value ?? 0),
                          color: slice.color,
                        },
                      ]}
                    />
                  )
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <ul className="w-full min-w-0 flex-1 space-y-2">
          {slices.map((slice) => {
            const share = total > 0 ? Math.round((slice.value / total) * 100) : 0
            return (
              <li key={slice.name} className="flex min-w-0 items-center justify-between gap-3 text-xs">
                <span className="flex min-w-0 items-center gap-2">
                  <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: slice.color }} />
                  <span className="truncate">{slice.name}</span>
                </span>
                <span className="shrink-0 text-muted-foreground">
                  {slice.value} · {share}%
                </span>
              </li>
            )
          })}
        </ul>
      </div>
    </ChartFrame>
  )
}
