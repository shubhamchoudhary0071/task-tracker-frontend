import { eachDayOfInterval, format, parseISO } from 'date-fns'

import type {
  DailyLog,
  DailyStat,
  DaySummary,
  DisplayStatus,
  ReportData,
  SortKey,
  Task,
  TaskStatus,
} from '@/lib/types'

const STATUSES: TaskStatus[] = ['done', 'partial', 'not_done']

export function todayKey(now = new Date()): string {
  return format(now, 'yyyy-MM-dd')
}

export function shiftDate(date: string, delta: number): string {
  const next = parseISO(date)
  next.setDate(next.getDate() + delta)
  return format(next, 'yyyy-MM-dd')
}

export function isFutureDate(date: string, now = new Date()): boolean {
  return date > todayKey(now)
}

export function createdOn(iso: string): string {
  const time = new Date(iso)
  if (Number.isNaN(time.getTime())) return todayKey()
  return format(time, 'yyyy-MM-dd')
}

export function taskExistedOn(task: Task, date: string): boolean {
  return createdOn(task.createdAt) <= date
}

export function deriveStatus(completed: number, target: number): TaskStatus {
  if (completed >= target && target > 0) return 'done'
  if (completed > 0) return 'partial'
  return 'not_done'
}

export function completionPercent(completed: number, target: number): number {
  if (!target || target <= 0) return 0
  return Math.min(100, Math.round((completed / target) * 100))
}

export function eachDate(start: string, end: string): string[] {
  if (start > end) return []
  return eachDayOfInterval({
    start: parseISO(start),
    end: parseISO(end),
  }).map((day) => format(day, 'yyyy-MM-dd'))
}

function isStatus(value: unknown): value is TaskStatus {
  return typeof value === 'string' && STATUSES.includes(value as TaskStatus)
}

export function normalizeTask(raw: unknown): Task {
  const task = (raw ?? {}) as Record<string, unknown>
  const createdAt =
    typeof task.createdAt === 'string' ? task.createdAt : new Date().toISOString()
  return {
    id: String(task._id || task.id || ''),
    title: typeof task.title === 'string' ? task.title : 'Untitled',
    description: typeof task.description === 'string' ? task.description : '',
    target: Number(task.target) || 0,
    unit: typeof task.unit === 'string' ? task.unit : 'tasks',
    category: typeof task.category === 'string' ? task.category : 'Personal',
    color: typeof task.color === 'string' ? task.color : '#8b5cf6',
    repeatType: typeof task.repeatType === 'string' ? task.repeatType : 'daily',
    isActive: task.isActive !== false,
    createdAt,
    updatedAt: typeof task.updatedAt === 'string' ? task.updatedAt : createdAt,
  }
}

export function normalizeLog(raw: unknown): DailyLog {
  const log = (raw ?? {}) as Record<string, unknown>
  const taskRef = log.taskId
  const taskId =
    taskRef && typeof taskRef === 'object'
      ? String((taskRef as { _id?: string; id?: string })._id || (taskRef as { id?: string }).id || '')
      : String(taskRef ?? '')
  const completed = Math.max(0, Number(log.completed) || 0)
  const target =
    taskRef && typeof taskRef === 'object'
      ? Number((taskRef as { target?: number }).target) || 0
      : 0
  const status = isStatus(log.status) ? log.status : deriveStatus(completed, target)

  return {
    id: String(log._id || log.id || ''),
    taskId,
    date: typeof log.date === 'string' ? log.date.slice(0, 10) : '',
    completed,
    status,
    notes: typeof log.notes === 'string' ? log.notes : '',
  }
}

export function normalizeReport(raw: unknown): ReportData {
  const report = (raw ?? {}) as Record<string, unknown>
  const range = (report.range ?? {}) as { start?: string; end?: string }
  const summary = (report.summary ?? {}) as Record<string, unknown>
  const taskStats = Array.isArray(report.taskStats) ? report.taskStats : []
  const dailyStats = Array.isArray(report.dailyStats) ? report.dailyStats : []

  return {
    range: {
      start: typeof range.start === 'string' ? range.start : '',
      end: typeof range.end === 'string' ? range.end : '',
    },
    summary: {
      totalDone: Number(summary.totalDone) || 0,
      totalPartial: Number(summary.totalPartial) || 0,
      avgCompletionPct: Number(summary.avgCompletionPct) || 0,
      activeTasks: Number(summary.activeTasks) || 0,
    },
    taskStats: taskStats.map((item) => {
      const row = item as Record<string, unknown>
      return {
        taskId: String(row.taskId ?? ''),
        title: typeof row.title === 'string' ? row.title : 'Untitled',
        category: typeof row.category === 'string' ? row.category : '',
        color: typeof row.color === 'string' ? row.color : '#8b5cf6',
        unit: typeof row.unit === 'string' ? row.unit : '',
        target: Number(row.target) || 0,
        done: Number(row.done) || 0,
        partial: Number(row.partial) || 0,
        notDone: Number(row.notDone) || 0,
        totalCompleted: Number(row.totalCompleted) || 0,
      }
    }),
    dailyStats: dailyStats.map((item) => {
      const row = item as Record<string, unknown>
      const done = Number(row.done) || 0
      const partial = Number(row.partial) || 0
      const total = Number(row.total) || 0
      return {
        date: typeof row.date === 'string' ? row.date : '',
        done,
        partial,
        notDone: Math.max(0, total - done - partial),
        total,
        completionPct: Number(row.completionPct) || 0,
      }
    }),
  }
}

export function fillDailyStats(stats: DailyStat[], start: string, end: string): DailyStat[] {
  const byDate = new Map(stats.map((item) => [item.date, item]))
  return eachDate(start, end).map(
    (date) =>
      byDate.get(date) ?? {
        date,
        done: 0,
        partial: 0,
        notDone: 0,
        total: 0,
        completionPct: 0,
      },
  )
}

export function summarizeTasks(tasks: Task[], logs: DailyLog[], date: string): DaySummary {
  const ids = new Set(tasks.map((task) => task.id))
  const dayLogs = logs.filter((log) => log.date === date && ids.has(log.taskId))
  const done = dayLogs.filter((log) => log.status === 'done').length
  const partial = dayLogs.filter((log) => log.status === 'partial').length
  const notDone = dayLogs.filter((log) => log.status === 'not_done').length
  const total = tasks.length
  const score = total === 0 ? 0 : Math.round(((done + partial * 0.5) / total) * 100)

  return {
    total,
    done,
    partial,
    notDone,
    pending: Math.max(0, total - dayLogs.length),
    score,
  }
}

export function daySummary(tasks: Task[], logs: DailyLog[], date: string): DaySummary {
  return summarizeTasks(
    tasks.filter((task) => task.isActive && taskExistedOn(task, date)),
    logs,
    date,
  )
}

export function historyTasks(tasks: Task[], logs: DailyLog[], date: string): Task[] {
  return tasks.filter((task) => {
    if (!taskExistedOn(task, date)) return false
    if (task.isActive) return true
    return logs.some((log) => log.taskId === task.id && log.date === date)
  })
}

export function logFor(logs: DailyLog[], taskId: string, date: string): DailyLog | undefined {
  return logs.find((log) => log.taskId === taskId && log.date === date)
}

export function displayStatus(log?: DailyLog): DisplayStatus {
  return log?.status ?? 'pending'
}

export function sortTasks(tasks: Task[], logs: DailyLog[], date: string, sort: SortKey): Task[] {
  const copy = [...tasks]
  const progress = (task: Task) => {
    const log = logFor(logs, task.id, date)
    if (!log || task.target <= 0) return log ? 1 : -1
    return log.completed / task.target
  }
  const attention = (task: Task) => {
    const status = displayStatus(logFor(logs, task.id, date))
    if (status === 'pending') return 0
    if (status === 'partial') return 1
    if (status === 'not_done') return 2
    return 3
  }

  copy.sort((a, b) => {
    if (sort === 'title') return a.title.localeCompare(b.title)
    if (sort === 'category') {
      return a.category.localeCompare(b.category) || a.title.localeCompare(b.title)
    }
    if (sort === 'newest') return b.createdAt.localeCompare(a.createdAt)
    if (sort === 'progress') return progress(b) - progress(a) || a.title.localeCompare(b.title)
    return attention(a) - attention(b) || progress(a) - progress(b) || a.title.localeCompare(b.title)
  })

  return copy
}

export function streaks(days: DailyStat[], today = todayKey()): { current: number; best: number } {
  let best = 0
  let run = 0
  for (const day of days) {
    if (day.total > 0 && day.completionPct >= 70) {
      run += 1
      best = Math.max(best, run)
    } else {
      run = 0
    }
  }

  const last = days[days.length - 1]
  const series =
    last && last.date === today && !(last.total > 0 && last.completionPct >= 70)
      ? days.slice(0, -1)
      : days

  let current = 0
  for (let index = series.length - 1; index >= 0; index -= 1) {
    const day = series[index]
    if (day.total > 0 && day.completionPct >= 70) current += 1
    else break
  }

  return { current, best }
}

export function halfTarget(target: number): number | null {
  if (target <= 1) return null
  const half = Math.floor(target / 2)
  if (half <= 0 || half >= target) return null
  return half
}
