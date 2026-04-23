interface Props {
  label: string
  value: string
  hint: string
}

export default function StatCard({ label, value, hint }: Props) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-5 py-5">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">{label}</p>
      <p className="mt-3 font-display text-4xl text-slate-900">{value}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{hint}</p>
    </div>
  )
}
