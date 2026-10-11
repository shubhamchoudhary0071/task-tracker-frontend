'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'
import { useRouter } from 'next/navigation'
import { Command } from 'cmdk'
import { DialogDescription, DialogTitle } from '@radix-ui/react-dialog'
import { useTheme } from 'next-themes'

import { AUTH_EVENT, clearSession, readToken, isExpired } from '@/lib/auth'
import { todayKey } from '@/lib/tasks'
import { usePreferences } from '@/store/preferences'
import { useTaskStore } from '@/store/taskStore'

function useSignedIn() {
  return useSyncExternalStore(
    (onChange) => {
      window.addEventListener(AUTH_EVENT, onChange)
      window.addEventListener('storage', onChange)
      return () => {
        window.removeEventListener(AUTH_EVENT, onChange)
        window.removeEventListener('storage', onChange)
      }
    },
    () => {
      const token = readToken()
      return Boolean(token && !isExpired(token))
    },
    () => false,
  )
}

export default function CommandMenu() {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const signedIn = useSignedIn()
  const { resolvedTheme, setTheme } = useTheme()
  const tasks = useTaskStore((state) => state.tasks)
  const setDialog = usePreferences((state) => state.setDialog)
  const setSelectedDate = useTaskStore((state) => state.setSelectedDate)

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setOpen((value) => !value)
      }
    }
    const openFromButton = () => setOpen(true)
    window.addEventListener('keydown', onKey)
    window.addEventListener('taskflow:command', openFromButton)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('taskflow:command', openFromButton)
    }
  }, [])

  function go(href: string) {
    setOpen(false)
    router.push(href)
  }

  function signOut() {
    setOpen(false)
    clearSession()
    window.location.href = '/login'
  }

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      label="Command menu"
      loop
    >
      <DialogTitle className="sr-only">Command menu</DialogTitle>
      <DialogDescription className="sr-only">Search pages and tasks</DialogDescription>
      <Command.Input
        placeholder={signedIn ? 'Search tasks or jump somewhere' : 'Jump somewhere'}
        className="h-12 border-b border-border px-4 text-sm"
      />
      <Command.List className="max-h-80 overflow-y-auto p-2">
        <Command.Empty className="px-3 py-8 text-center text-sm">No matches.</Command.Empty>
        <Command.Group heading="Navigate" className="px-1 py-1 text-xs">
          {signedIn ? (
            <>
              <Command.Item className="flex min-h-11 items-center px-3 text-sm" onSelect={() => go('/')}>
                Today
              </Command.Item>
              <Command.Item className="flex min-h-11 items-center px-3 text-sm" onSelect={() => go('/history')}>
                History
              </Command.Item>
              <Command.Item className="flex min-h-11 items-center px-3 text-sm" onSelect={() => go('/reports')}>
                Reports
              </Command.Item>
              <Command.Item
                className="flex min-h-11 items-center px-3 text-sm"
                onSelect={() => {
                  setOpen(false)
                  setDialog({ type: 'create' })
                  router.push('/')
                }}
              >
                New task
              </Command.Item>
            </>
          ) : (
            <>
              <Command.Item className="flex min-h-11 items-center px-3 text-sm" onSelect={() => go('/login')}>
                Sign in
              </Command.Item>
              <Command.Item className="flex min-h-11 items-center px-3 text-sm" onSelect={() => go('/register')}>
                Create account
              </Command.Item>
            </>
          )}
          <Command.Item
            className="flex min-h-11 items-center px-3 text-sm"
            onSelect={() => {
              setTheme(resolvedTheme === 'light' ? 'dark' : 'light')
              setOpen(false)
            }}
          >
            Toggle theme
          </Command.Item>
          {signedIn ? (
            <Command.Item className="flex min-h-11 items-center px-3 text-sm" onSelect={signOut}>
              Sign out
            </Command.Item>
          ) : null}
        </Command.Group>

        {signedIn && tasks.length > 0 ? (
          <Command.Group heading="Tasks" className="px-1 py-1 text-xs">
            {tasks
              .filter((task) => task.isActive)
              .map((task) => (
                <Command.Item
                  key={task.clientKey ?? task.id}
                  value={`${task.title} ${task.category}`}
                  className="flex min-h-11 items-center px-3 text-sm"
                  onSelect={() => {
                    setSelectedDate(todayKey())
                    setOpen(false)
                    router.push(`/#task-${task.id}`)
                  }}
                >
                  <span className="mr-2 inline-block size-2 rounded-full" style={{ background: task.color }} />
                  {task.title}
                </Command.Item>
              ))}
          </Command.Group>
        ) : null}
      </Command.List>
      <div className="border-t border-border px-4 py-2 text-[11px] text-muted-foreground">
        <kbd className="font-mono">Ctrl</kbd> or <kbd className="font-mono">⌘</kbd> K to toggle
      </div>
    </Command.Dialog>
  )
}
