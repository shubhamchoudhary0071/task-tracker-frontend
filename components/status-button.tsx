'use client'

import { cn } from '@/lib/utils'

export default function StatusButton({
  label,
  pressed,
  disabled,
  onClick,
}: {
  label: string
  pressed: boolean
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'inline-flex min-h-11 items-center justify-center rounded-lg border px-2 text-xs font-medium',
        pressed
          ? 'border-ring bg-accent text-accent-foreground'
          : 'border-border text-muted-foreground hover:text-foreground',
        disabled && 'cursor-not-allowed opacity-40',
      )}
    >
      {label}
    </button>
  )
}
