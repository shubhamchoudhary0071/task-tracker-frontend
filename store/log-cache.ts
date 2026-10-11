import type { DailyLog, Task, TaskInput } from '@/lib/types'

const dateEpoch = new Map<string, number>()
const logRevision = new Map<string, number>()
let epochSeq = 0

export function logKey(taskId: string, date: string): string {
  return `${taskId}|${date}`
}

export function claimDates(dates: string[]): number {
  const epoch = ++epochSeq
  for (const date of dates) dateEpoch.set(date, epoch)
  return epoch
}

export function datesStillCurrent(dates: string[], epoch: number): boolean {
  return dates.every((date) => dateEpoch.get(date) === epoch)
}

export function snapshotRevisions(): Map<string, number> {
  return new Map(logRevision)
}

export function bumpRevision(taskId: string, date: string): void {
  const key = logKey(taskId, date)
  logRevision.set(key, (logRevision.get(key) ?? 0) + 1)
}

export function mergeLogs(
  existing: DailyLog[],
  incoming: DailyLog[],
  dates: string[],
  snapshot: Map<string, number>,
): DailyLog[] {
  const dateSet = new Set(dates)
  const edited = (log: DailyLog) =>
    (logRevision.get(logKey(log.taskId, log.date)) ?? 0) !== (snapshot.get(logKey(log.taskId, log.date)) ?? 0)

  const kept = existing.filter((log) => {
    if (!dateSet.has(log.date)) return true
    return edited(log)
  })

  const fresh = incoming.filter((log) => dateSet.has(log.date) && !edited(log))
  const freshKeys = new Set(fresh.map((log) => logKey(log.taskId, log.date)))
  return [...kept.filter((log) => !freshKeys.has(logKey(log.taskId, log.date))), ...fresh]
}

export function replaceLog(logs: DailyLog[], next: DailyLog): DailyLog[] {
  const index = logs.findIndex((log) => log.taskId === next.taskId && log.date === next.date)
  if (index === -1) return [...logs, next]
  return logs.map((log, itemIndex) => (itemIndex === index ? next : log))
}

export function tempId(): string {
  return `temp-${crypto.randomUUID()}`
}

export const discardedTempIds = new Set<string>()

export function taskEdits(local: Task, created: Task): Partial<TaskInput> {
  const updates: Partial<TaskInput> = {}
  if (local.title !== created.title) updates.title = local.title
  if (local.description !== created.description) updates.description = local.description
  if (local.target !== created.target) updates.target = local.target
  if (local.unit !== created.unit) updates.unit = local.unit
  if (local.category !== created.category) updates.category = local.category
  if (local.color !== created.color) updates.color = local.color
  if (local.isActive !== created.isActive) updates.isActive = local.isActive
  return updates
}
