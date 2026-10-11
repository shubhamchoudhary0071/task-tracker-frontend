import type { DailyLog, ReportData, Task, TaskInput, UpsertLogInput } from '@/lib/types'

export type TaskStore = {
  tasks: Task[]
  logs: DailyLog[]
  loadedDates: string[]
  tasksLoading: boolean
  tasksError: string | null
  logsError: string | null
  report: ReportData | null
  reportRange: { start: string; end: string } | null
  reportLoading: boolean
  reportError: string | null
  selectedDate: string
  setSelectedDate: (date: string) => void
  fetchTasks: () => Promise<void>
  fetchLogsForDate: (date: string) => Promise<void>
  fetchLogsInRange: (start: string, end: string) => Promise<void>
  fetchReport: (start: string, end: string) => Promise<void>
  createTask: (input: TaskInput) => Promise<Task>
  updateTask: (id: string, updates: Partial<TaskInput>) => Promise<void>
  deleteTask: (id: string) => Promise<void>
  upsertLog: (taskId: string, date: string, input: UpsertLogInput, target: number) => Promise<void>
  deleteLog: (id: string) => Promise<void>
}
