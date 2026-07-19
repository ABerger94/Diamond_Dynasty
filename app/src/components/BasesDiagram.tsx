import type { BaseState } from '../types/game'

export default function BasesDiagram({ bases }: { bases: BaseState }) {
  const base = (occupied: boolean, extra: string) => (
    <div
      className={`absolute h-4 w-4 rotate-45 border-2 ${occupied ? 'border-amber-400 bg-amber-400' : 'border-slate-600 bg-slate-800'} ${extra}`}
    />
  )
  return (
    <div className="relative h-20 w-20">
      {base(!!bases.second, 'left-1/2 top-0 -translate-x-1/2')}
      {base(!!bases.third, 'left-0 top-1/2 -translate-y-1/2')}
      {base(!!bases.first, 'right-0 top-1/2 -translate-y-1/2')}
    </div>
  )
}
