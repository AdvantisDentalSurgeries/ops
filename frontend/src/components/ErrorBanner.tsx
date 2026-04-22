interface Props {
  message: string | null
  onDismiss?: () => void
  variant?: 'error' | 'warning'
}

export default function ErrorBanner({ message, onDismiss, variant = 'error' }: Props) {
  if (!message) return null

  const styles =
    variant === 'warning'
      ? 'bg-amber-50 border border-amber-400 text-amber-800'
      : 'bg-red-50 border border-red-400 text-red-700'

  return (
    <div className={`${styles} px-4 py-3 rounded flex justify-between items-start`}>
      <span>{message}</span>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="ml-4 font-bold leading-none opacity-70 hover:opacity-100"
        >
          ×
        </button>
      )}
    </div>
  )
}
