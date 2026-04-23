import { ReactNode } from 'react'

interface Props {
  eyebrow?: string
  title: string
  description: string
  actions?: ReactNode
}

export default function PageHeader({ eyebrow, title, description, actions }: Props) {
  return (
    <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
      <div className="max-w-3xl">
        {eyebrow && (
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-teal-700">
            {eyebrow}
          </p>
        )}
        <h3 className="mt-2 font-display text-3xl leading-tight text-slate-900">{title}</h3>
        <p className="mt-3 text-sm leading-7 text-slate-600">{description}</p>
      </div>
      {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
    </div>
  )
}
