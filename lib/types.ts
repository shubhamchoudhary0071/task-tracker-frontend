export type TaskStatus = 'done' | 'partial' | 'not_done'

export type DisplayStatus = TaskStatus | 'pending'

export type Task = {
  id: string
  title: string
  description: string
  target: number
  unit: string
  category: string
  color: string
  repeatType: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export type DailyLog = {
  id: string
  taskId: string
  date: string
  completed: number
  status: TaskStatus
  notes: string
}

export type TaskInput = {
  title: string
  description?: string
  target: number
  unit: string
  category: string
  color: string
  repeatType?: string
  isActive?: boolean
}

export type UpsertLogInput = {
  completed: number
  notes?: string
}

export type DailyStat = {
  date: string
  done: number
  partial: number
  notDone: number
  total: number
  completionPct: number
}

export type TaskStat = {
  taskId: string
  title: string
  category: string
  color: string
  unit: string
  target: number
  done: number
  partial: number
  notDone: number
  totalCompleted: number
}

export type ReportData = {
  range: { start: string; end: string }
  summary: {
    totalDone: number
    totalPartial: number
    avgCompletionPct: number
    activeTasks: number
  }
  taskStats: TaskStat[]
  dailyStats: DailyStat[]
}

export type DaySummary = {
  total: number
  done: number
  partial: number
  notDone: number
  pending: number
  score: number
}

export type SortKey = 'attention' | 'title' | 'category' | 'newest' | 'progress'

export type StatusFilter = 'all' | DisplayStatus
