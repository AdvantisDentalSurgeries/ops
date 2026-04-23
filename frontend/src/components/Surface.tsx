import { ReactNode } from 'react'

interface Props {
  children: ReactNode
  className?: string
}

export default function Surface({ children, className = '' }: Props) {
  return (
    <section
      className={`rounded-[28px] border border-slate-200/80 bg-white px-5 py-5 shadow-[0_12px_45px_rgba(15,23,42,0.06)] sm:px-6 sm:py-6 ${className}`.trim()}
    >
      {children}
    </section>
  )
}
