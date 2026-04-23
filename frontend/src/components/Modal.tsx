import { ReactNode } from 'react'

interface Props {
  isOpen: boolean
  title: string
  onClose: () => void
  children: ReactNode
}

export default function Modal({ isOpen, title, onClose, children }: Props) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-50 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[28px] border border-white/70 bg-white p-6 shadow-[0_30px_120px_rgba(15,23,42,0.25)] sm:p-7">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-2xl text-slate-900">{title}</h2>
          <button
            onClick={onClose}
            className="text-2xl leading-none text-slate-400 transition hover:text-slate-700"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
