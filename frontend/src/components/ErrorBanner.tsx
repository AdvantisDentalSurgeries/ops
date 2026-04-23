interface Props {
  message: string | null
  onDismiss?: () => void
  variant?: 'error' | 'warning'
}

export default function ErrorBanner({ message, onDismiss, variant = 'error' }: Props) {
  if (!message) return null

  const styles =
    variant === 'warning'
      ? 'border-amber-200 bg-amber-50 text-amber-900'
      : 'border-rose-200 bg-rose-50 text-rose-900'

  return (
    <div className={`${styles} flex items-start justify-between rounded-2xl border px-4 py-3`}>
      <span className="text-sm leading-6">{message}</span>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="ml-4 text-lg font-bold leading-none opacity-60 transition hover:opacity-100"
        >
          ×
        </button>
      )}
    </div>
  )
}
