interface RatingBarProps {
  label: string
  value: number
  max?: number
  highlight?: boolean
}

export default function RatingBar({ label, value, max = 20, highlight = false }: RatingBarProps) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100))
  return (
    <div className="flex items-center gap-2">
      <span className={`w-24 shrink-0 text-xs font-medium uppercase tracking-wide ${highlight ? 'text-amber-300' : 'text-slate-400'}`}>
        {label}
      </span>
      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-800">
        <div
          className={`h-full rounded-full ${highlight ? 'bg-amber-400' : 'bg-sky-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`w-6 shrink-0 text-right text-sm font-bold ${highlight ? 'text-amber-300' : 'text-slate-100'}`}>
        {value}
      </span>
    </div>
  )
}
