'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { format } from 'date-fns'

import apiClient from '@/utils/apiClient'

type TaskStatus =
  | 'done'
  | 'partial'
  | 'not_done'

type Task = {
  _id?: string
  id: string
  title: string
  description?: string
  target: number
  unit: string
  category: string
  color: string
  repeatType?: string
  isActive: boolean
  createdAt: string
}

type DailyLog = {
  _id?: string
  id?: string
  taskId: string
  date: string
  completed: number
  status: TaskStatus
  notes?: string
}

type ReportData = unknown

type TodayStats = {
  total: number
  done: number
  partial: number
  notDone: number
  pending: number
}

type CreateTaskData = {
  title: string
  description?: string
  target: number
  unit: string
  category: string
  color: string
  repeatType?: string
}

type UpdateTaskData = Partial<CreateTaskData> & {
  isActive?: boolean
}

type UpsertLogData = {
  completed: number
  notes?: string
}

type TaskStore = {
  tasks: Task[]
  dailyLogs: DailyLog[]
  reportData: ReportData | null
  selectedDate: string
  loading: boolean
  error: string | null

  setSelectedDate: (date: string) => void

  fetchTodaySummary: () => Promise<void>
  fetchTasks: () => Promise<void>

  createTask: (
    taskData: CreateTaskData
  ) => Promise<Task>

  updateTask: (
    id: string,
    updates: UpdateTaskData
  ) => Promise<void>

  deleteTask: (
    id: string
  ) => Promise<void>

  fetchLogsByDate: (
    date: string
  ) => Promise<void>

  fetchLogsInRange: (
    start: string,
    end: string
  ) => Promise<DailyLog[] | undefined>

  fetchReport: (
    start: string,
    end: string
  ) => Promise<ReportData | undefined>

  upsertLog: (
    taskId: string,
    date: string,
    logData: UpsertLogData
  ) => Promise<DailyLog>

  deleteLog: (
    id: string
  ) => Promise<void>

  getLogsForDate: (
    date: string
  ) => DailyLog[]

  getLogsForDateRange: (
    startDate: string,
    endDate: string
  ) => DailyLog[]

  getTaskById: (
    id: string
  ) => Task | undefined

  getTodayStats: (
    date?: string
  ) => TodayStats
}

const normalizeTask = (
  task: Task & { _id?: string }
): Task => ({
  ...task,
  id: String(task._id || task.id),
})

type RawLog = Omit<DailyLog, 'taskId'> & {
  _id?: string
  taskId:
    | string
    | {
        _id: string
      }
}



const normalizeLog = (
  log: RawLog
): DailyLog => ({
  ...log,

  id: log._id || log.id,

  taskId:
    typeof log.taskId === 'object'
      ? log.taskId._id
      : log.taskId,
})

export const useTaskStore =
  create<TaskStore>()(
    persist(
      (set, get) => ({
        // =========================
        // STATE
        // =========================

        tasks: [],
        dailyLogs: [],
        reportData: null,

        selectedDate: format(
          new Date(),
          'yyyy-MM-dd'
        ),

        loading: false,

        error: null,

        // =========================
        // DATE
        // =========================

        setSelectedDate: (
          date: string
        ) =>
          set({
            selectedDate: date,
          }),

        // =========================
        // FETCH TODAY SUMMARY
        // =========================

        fetchTodaySummary:
          async () => {
            try {
              set({
                loading: true,
              })

              const { data } =
                await apiClient.get(
                  '/task/today-summary'
                )

              const tasks = (
                data.data.tasks || []
              ).map(normalizeTask)

              const logs = (
                data.data.logs || []
              ).map(normalizeLog)

              set({
                tasks,
                dailyLogs: logs,
                loading: false,
              })
            } catch (error) {
              console.error(error)

              set({
                error:
                  'Failed to fetch today summary',

                loading: false,
              })
            }
          },

        // =========================
        // FETCH TASKS
        // =========================

        fetchTasks: async () => {
          try {
            set({
              loading: true,
            })

            const { data } =
              await apiClient.get(
                '/task'
              )

              console.log("data",data);

            const tasks = Array.isArray(data?.data)
            ? data.data.map(normalizeTask)
            : []
            set({
              tasks,
              loading: false,
            });
            
          } catch (error) {
            console.error(error)

            set({
              error:
                'Failed to fetch tasks',

              loading: false,
            })
          }
        },

        // =========================
        // CREATE TASK
        // =========================

        createTask: async (
          taskData
        ) => {
          try {
            const { data } =
              await apiClient.post(
                '/task',
                taskData
              )

            const task =
              normalizeTask(
                data.data
              )

            set((state) => ({
              tasks: [
                ...state.tasks,
                task,
              ],
            }))

            return task
          } catch (error) {
            console.error(error)
            throw error
          }
        },

        // =========================
        // UPDATE TASK
        // =========================

        updateTask: async (
          id,
          updates
        ) => {
          try {
            const { data } =
              await apiClient.put(
                `/task/${id}`,
                updates
              )

            const updatedTask =
              normalizeTask(
                data.data
              )

            set((state) => ({
              tasks:
                state.tasks.map(
                  (task) =>
                    task.id === id
                      ? updatedTask
                      : task
                ),
            }))
          } catch (error) {
            console.error(error)
            throw error
          }
        },

        // =========================
        // DELETE TASK
        // =========================

        deleteTask: async (
          id
        ) => {
          try {
            await apiClient.delete(
              `/task/${id}`
            )

            set((state) => ({
              tasks:
                state.tasks.filter(
                  (task) =>
                    task.id !== id
                ),

              dailyLogs:
                state.dailyLogs.filter(
                  (log) =>
                    log.taskId !== id
                ),
            }))
          } catch (error) {
            console.error(error)
            throw error
          }
        },

        // =========================
        // FETCH LOGS BY DATE
        // =========================

        fetchLogsByDate: async (date) => {
        try {

          const { data } =
            await apiClient.get(
              `/task/logs?date=${date}`
            )

          const logs =
            data.data.map(
              normalizeLog
            )

          set({
            dailyLogs: logs,
          })

        } catch (error) {

          console.error(error)

          set({
            error:
              'Failed to fetch logs',
          })
        }
      },

        // =========================
        // FETCH RANGE LOGS
        // =========================

        fetchLogsInRange:
          async (
            start,
            end
          ) => {
            try {
              set({
                loading: true,
              })

              const { data } =
                await apiClient.get(
                  `/task/logs/range?start=${start}&end=${end}`
                )

              const logs =
                data.data.logs.map(
                  normalizeLog
                )

              set({
                dailyLogs: logs,
                loading: false,
              })

              return logs
            } catch (error) {
              console.error(error)

              set({
                error:
                  'Failed to fetch logs',

                loading: false,
              })
            }
          },

        // =========================
        // FETCH REPORT
        // =========================

        fetchReport: async (
          start,
          end
        ) => {
          try {
            set({
              loading: true,
            })

            const { data } =
              await apiClient.get(
                `/task/logs/report?start=${start}&end=${end}`
              )

            set({
              reportData:
                data.data,

              loading: false,
            })

            return data.data
          } catch (error) {
            console.error(error)

            set({
              error:
                'Failed to fetch report',

              loading: false,
            })
          }
        },

        // =========================
        // UPSERT LOG
        // =========================

        upsertLog: async (
          taskId,
          date,
          logData
        ) => {
          try {
            const { data } =
              await apiClient.post(
                '/task/logs/upsert',
                {
                  taskId,
                  date,

                  completed:
                    logData.completed,

                  notes:
                    logData.notes ||
                    '',
                }
              )

            const updatedLog =
              normalizeLog(
                data.data
              )

            set((state) => {
              const existing =
                state.dailyLogs.find(
                  (log) =>
                    log.taskId ===
                      taskId &&
                    log.date ===
                      date
                )

              if (existing) {
                return {
                  dailyLogs:
                    state.dailyLogs.map(
                      (log) =>
                        log.taskId ===
                          taskId &&
                        log.date ===
                          date
                          ? updatedLog
                          : log
                    ),
                }
              }

              return {
                dailyLogs: [
                  ...state.dailyLogs,
                  updatedLog,
                ],
              }
            })

            return updatedLog
          } catch (error) {
            console.error(error)
            throw error
          }
        },

        // =========================
        // DELETE LOG
        // =========================

        deleteLog: async (
          id
        ) => {
          try {
            await apiClient.delete(
              `/task/logs/${id}`
            )

            set((state) => ({
              dailyLogs:
                state.dailyLogs.filter(
                  (log) =>
                    log.id !== id
                ),
            }))
          } catch (error) {
            console.error(error)
            throw error
          }
        },

        // =========================
        // HELPERS
        // =========================

        getLogsForDate: (
          date
        ) => {
          return get().dailyLogs.filter(
            (log) =>
              log.date === date
          )
        },

        getLogsForDateRange: (
          startDate,
          endDate
        ) => {
          return get().dailyLogs.filter(
            (log) =>
              log.date >=
                startDate &&
              log.date <= endDate
          )
        },

        getTaskById: (id) => {
          return get().tasks.find(
            (task) =>
              task.id === id
          )
        },

        getTodayStats: (
          date
        ) => {
          const currentDate =
            date ||
            get().selectedDate

          const logs =
            get().dailyLogs.filter(
              (log) =>
                log.date ===
                currentDate
            )

          const activeTasks =
            get().tasks.filter(
              (task) =>
                task.isActive
            )

          const done =
            logs.filter(
              (log) =>
                log.status ===
                'done'
            ).length

          const partial =
            logs.filter(
              (log) =>
                log.status ===
                'partial'
            ).length

          const notDone =
            logs.filter(
              (log) =>
                log.status ===
                'not_done'
            ).length

          const pending =
            activeTasks.length -
            logs.length

          return {
            total:
              activeTasks.length,

            done,

            partial,

            notDone,

            pending,
          }
        },
      }),

      {
        name: 'taskflow-storage',
      }
    )
  )