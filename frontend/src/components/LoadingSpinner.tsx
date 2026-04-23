export default function LoadingSpinner() {
  return (
    <div className="flex h-32 items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-slate-300 border-t-slate-900" />
    </div>
  )
}
