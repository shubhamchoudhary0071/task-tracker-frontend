'use client'

import { ThemeProvider } from 'next-themes'
import { Toaster } from 'sonner'
import { useTheme } from 'next-themes'

import AuthProvider from '@/components/AuthProvider'
import CommandMenu from '@/components/command-menu'

function ThemedToaster() {
  const { resolvedTheme } = useTheme()

  return (
    <Toaster
      theme={resolvedTheme === 'light' ? 'light' : 'dark'}
      richColors
      closeButton
      position="top-center"
      toastOptions={{ duration: 3200 }}
    />
  )
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
      <AuthProvider>{children}</AuthProvider>
      <CommandMenu />
      <ThemedToaster />
    </ThemeProvider>
  )
}
