import { format, subDays } from 'date-fns'

export type TaskStatus = 'done' | 'partial' | 'not_done'

export type Category = {
  value: string
  label: string
  color: string
}

export type SampleTask = {
  id: string
  title: string
  description: string
  target: number
  unit: string
  category: string
  color: string
  isActive: boolean
  createdAt: string
}

export type SampleLog = {
  id: string
  taskId: string
  date: string
  completed: number
  status: TaskStatus
  notes: string
  updatedAt: string
}

export const CATEGORIES: Category[] = [
  { value: 'Programming', label: 'Programming', color: '#8b5cf6' },
  { value: 'Learning', label: 'Learning', color: '#0ea5e9' },
  { value: 'Health', label: 'Health', color: '#10b981' },
  { value: 'Wellness', label: 'Wellness', color: '#f59e0b' },
  { value: 'Work', label: 'Work', color: '#f43f5e' },
  { value: 'Personal', label: 'Personal', color: '#ec4899' },
]

export const sampleTasks: SampleTask[] = [
  {
    id: 'task-1',
    title: 'DSA Practice',
    description: 'Solve Data Structures & Algorithms problems on LeetCode',
    target: 5,
    unit: 'questions',
    category: 'Programming',
    color: '#8b5cf6',
    isActive: true,
    createdAt: subDays(new Date(), 14).toISOString(),
  },
  {
    id: 'task-2',
    title: 'Read Clean Code',
    description: 'Read chapters from Clean Code by Robert C. Martin',
    target: 20,
    unit: 'pages',
    category: 'Learning',
    color: '#0ea5e9',
    isActive: true,
    createdAt: subDays(new Date(), 14).toISOString(),
  },
  {
    id: 'task-3',
    title: 'Morning Run',
    description: 'Outdoor run for cardiovascular fitness',
    target: 5,
    unit: 'km',
    category: 'Health',
    color: '#10b981',
    isActive: true,
    createdAt: subDays(new Date(), 12).toISOString(),
  },
  {
    id: 'task-4',
    title: 'System Design Study',
    description: 'Study one system design concept or case study',
    target: 1,
    unit: 'topic',
    category: 'Learning',
    color: '#0ea5e9',
    isActive: true,
    createdAt: subDays(new Date(), 10).toISOString(),
  },
  {
    id: 'task-5',
    title: 'Meditation',
    description: 'Mindfulness meditation session',
    target: 20,
    unit: 'minutes',
    category: 'Wellness',
    color: '#f59e0b',
    isActive: true,
    createdAt: subDays(new Date(), 14).toISOString(),
  },
  {
    id: 'task-6',
    title: 'LeetCode Hard',
    description: 'Attempt one hard-level problem on LeetCode',
    target: 1,
    unit: 'problem',
    category: 'Programming',
    color: '#f43f5e',
    isActive: true,
    createdAt: subDays(new Date(), 7).toISOString(),
  },
]

function makeLog(
  taskId: string,
  daysAgo: number,
  completed: number,
  target: number,
  notes = ''
): SampleLog {
  const date = format(subDays(new Date(), daysAgo), 'yyyy-MM-dd')

  let status: TaskStatus = 'not_done'

  if (completed >= target) {
    status = 'done'
  } else if (completed > 0) {
    status = 'partial'
  }

  return {
    id: `log-${taskId}-${daysAgo}`,
    taskId,
    date,
    completed,
    status,
    notes,
    updatedAt: subDays(new Date(), daysAgo).toISOString(),
  }
}

export const sampleLogs: SampleLog[] = [
  // Day -13
  makeLog('task-1', 13, 5, 5, 'Great session, solved two graph problems'),
  makeLog('task-2', 13, 20, 20),
  makeLog('task-3', 13, 4, 5, 'Stopped early due to rain'),
  makeLog('task-5', 13, 20, 20),

  // Day -12
  makeLog('task-1', 12, 3, 5, 'Struggled with dynamic programming'),
  makeLog('task-2', 12, 20, 20),
  makeLog('task-3', 12, 5, 5),
  makeLog('task-5', 12, 15, 20, 'Felt restless today'),

  // Day -11
  makeLog('task-1', 11, 5, 5),
  makeLog('task-2', 11, 10, 20, 'Only had time in the evening'),
  makeLog('task-3', 11, 0, 5, 'Rest day'),
  makeLog('task-4', 11, 1, 1, 'Studied Load Balancing'),
  makeLog('task-5', 11, 20, 20),

  // Day -10
  makeLog('task-1', 10, 4, 5),
  makeLog('task-2', 10, 20, 20),
  makeLog('task-3', 10, 5, 5, 'Personal best pace!'),
  makeLog('task-4', 10, 1, 1, 'Caching strategies'),
  makeLog('task-5', 10, 20, 20),

  // Day -9
  makeLog('task-1', 9, 5, 5),
  makeLog('task-2', 9, 20, 20),
  makeLog('task-3', 9, 3, 5, 'Knee pain'),
  makeLog('task-4', 9, 1, 1, 'Database sharding'),
  makeLog('task-5', 9, 10, 20, 'Interrupted'),

  // Day -8
  makeLog('task-1', 8, 2, 5, 'Very busy day'),
  makeLog('task-2', 8, 0, 20, 'Skipped'),
  makeLog('task-3', 8, 5, 5),
  makeLog('task-4', 8, 1, 1, 'Message queues'),
  makeLog('task-5', 8, 20, 20),

  // Day -7
  makeLog('task-1', 7, 5, 5),
  makeLog('task-2', 7, 20, 20),
  makeLog('task-3', 7, 5, 5),
  makeLog('task-4', 7, 1, 1, 'CAP theorem'),
  makeLog('task-5', 7, 20, 20),
  makeLog('task-6', 7, 1, 1, 'Solved Word Ladder II'),

  // Day -6
  makeLog('task-1', 6, 5, 5),
  makeLog('task-2', 6, 15, 20, 'Got distracted'),
  makeLog('task-3', 6, 5, 5),
  makeLog('task-4', 6, 1, 1, 'Consistent Hashing'),
  makeLog('task-5', 6, 20, 20),
  makeLog('task-6', 6, 0, 1, 'Gave up after 2 hours'),

  // Day -5
  makeLog('task-1', 5, 5, 5, 'All medium difficulty'),
  makeLog('task-2', 5, 20, 20),
  makeLog('task-3', 5, 4, 5, 'Stopped at 4km'),
  makeLog('task-4', 5, 1, 1, 'Rate Limiting'),
  makeLog('task-5', 5, 20, 20),
  makeLog('task-6', 5, 1, 1, 'Trapping Rain Water'),

  // Day -4
  makeLog('task-1', 4, 3, 5, 'Monday blues'),
  makeLog('task-2', 4, 20, 20),
  makeLog('task-3', 4, 5, 5),
  makeLog('task-4', 4, 1, 1, 'API Gateway patterns'),
  makeLog('task-5', 4, 20, 20),
  makeLog('task-6', 4, 1, 1, 'Regular Expression Matching'),

  // Day -3
  makeLog('task-1', 3, 5, 5),
  makeLog('task-2', 3, 20, 20),
  makeLog('task-3', 3, 5, 5, 'New route explored'),
  makeLog('task-4', 3, 1, 1, 'Microservices vs Monolith'),
  makeLog('task-5', 3, 20, 20),
  makeLog('task-6', 3, 1, 1, 'Edit Distance'),

  // Day -2
  makeLog('task-1', 2, 5, 5),
  makeLog('task-2', 2, 20, 20),
  makeLog('task-3', 2, 2, 5, 'Only 2km - bad weather'),
  makeLog('task-4', 2, 1, 1, 'Event-driven architecture'),
  makeLog('task-5', 2, 20, 20),
  makeLog('task-6', 2, 0, 1, 'Did not attempt'),

  // Day -1 (Yesterday)
  makeLog('task-1', 1, 4, 5, 'Missed one, ran out of time'),
  makeLog('task-2', 1, 20, 20),
  makeLog('task-3', 1, 5, 5),
  makeLog('task-4', 1, 1, 1, 'CQRS pattern'),
  makeLog('task-5', 1, 20, 20),
  makeLog('task-6', 1, 1, 1, 'N-Queens'),

  // Day 0 (Today)
  makeLog('task-1', 0, 3, 5, 'In progress'),
  makeLog('task-2', 0, 20, 20),
  makeLog('task-5', 0, 20, 20),
]