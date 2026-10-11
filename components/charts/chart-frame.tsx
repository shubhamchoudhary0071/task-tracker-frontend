'use client'

import { useTheme } from 'next-themes'

export function useChartTheme() {
  const { resolvedTheme } = useTheme()
  const dark = resolvedTheme !== 'light'

  return {
    tick: dark ? '#a8a29e' : '#78716c',
    grid: dark ? 'rgba(255,255,255,0.08)' : 'rgba(60,40,20,0.08)',
    cursor: dark ? 'rgba(255,255,255,0.05)' : 'rgba(60,40,20,0.05)',
    done: '#10b981',
    partial: '#d97706',
    missed: '#e11d48',
    line: dark ? '#f5c16c' : '#b45309',
  }
}

export function ChartFrame({
  title,
  subtitle,
  children,
  legend,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
  legend?: React.ReactNode
}) {
  return (
    <section className="min-w-0 rounded-2xl border border-border bg-card p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold">{title}</h3>
          {subtitle ? <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p> : null}
        </div>
        {legend}
      </div>
      {children}
    </section>
  )
}

export function ChartTooltip({
  label,
  rows,
}: {
  label?: string | number
  rows: Array<{ name: string; value: string | number; color: string }>
}) {
  return (
    <div className="rounded-xl border border-border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-lg">
      {label ? <div className="mb-1 font-medium">{label}</div> : null}
      {rows.map((row) => (
        <div key={row.name} className="flex items-center gap-2">
          <span className="size-2 rounded-full" style={{ backgroundColor: row.color }} />
          <span className="text-muted-foreground">{row.name}</span>
          <span className="font-medium">{row.value}</span>
        </div>
      ))}
    </div>
  )
}
