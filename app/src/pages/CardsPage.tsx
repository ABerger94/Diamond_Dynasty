import { useMemo, useState } from 'react'
import { useCardCollection } from '../store/cards'
import { usePlayerPool } from '../store/players'

const emptyForm = {
  playerId: '',
  cardYear: new Date().getFullYear(),
  brand: '',
  setName: '',
  cardNumber: '',
  isRookie: false,
  parallel: '',
  serialNumber: '',
  isAutograph: false,
  isRelic: false,
  condition: '',
}

export default function CardsPage() {
  const pool = usePlayerPool()
  const { cards, addCard, removeCard } = useCardCollection()
  const [form, setForm] = useState(emptyForm)
  const playerById = useMemo(() => new Map(pool.map((p) => [p.player.id, p.player])), [pool])

  function handleAdd() {
    if (!form.playerId || !form.brand.trim() || !form.setName.trim()) return
    addCard({
      playerId: form.playerId,
      cardYear: form.cardYear,
      brand: form.brand.trim(),
      setName: form.setName.trim(),
      cardNumber: form.cardNumber.trim() || undefined,
      isRookie: form.isRookie,
      parallel: form.parallel.trim() || undefined,
      serialNumber: form.serialNumber.trim() || undefined,
      isAutograph: form.isAutograph,
      isRelic: form.isRelic,
      condition: form.condition.trim() || undefined,
    })
    setForm(emptyForm)
  }

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-slate-100">Card Collection</h1>
      <p className="mb-4 text-sm text-slate-400">
        Track the specific physical cards you own — brand, set, parallel, serial number, autograph/relic, condition.
        Purely cosmetic: none of this affects gameplay (Rulebook §1). Look up a card's ratings on the Players page.
      </p>

      <div className="mb-6 grid grid-cols-1 gap-3 rounded-md border border-slate-800 bg-slate-900 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <select
          value={form.playerId}
          onChange={(e) => setForm((f) => ({ ...f, playerId: e.target.value }))}
          className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm text-slate-100"
        >
          <option value="">Player...</option>
          {pool.map((p) => (
            <option key={p.player.id} value={p.player.id}>
              {p.player.name}
            </option>
          ))}
        </select>
        <input
          type="number"
          value={form.cardYear}
          onChange={(e) => setForm((f) => ({ ...f, cardYear: Number(e.target.value) }))}
          placeholder="Year"
          className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm text-slate-100"
        />
        <input
          value={form.brand}
          onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))}
          placeholder="Brand (Topps, Bowman...)"
          className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm text-slate-100"
        />
        <input
          value={form.setName}
          onChange={(e) => setForm((f) => ({ ...f, setName: e.target.value }))}
          placeholder="Set (Series 1, Chrome...)"
          className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm text-slate-100"
        />
        <input
          value={form.cardNumber}
          onChange={(e) => setForm((f) => ({ ...f, cardNumber: e.target.value }))}
          placeholder="Card #"
          className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm text-slate-100"
        />
        <input
          value={form.parallel}
          onChange={(e) => setForm((f) => ({ ...f, parallel: e.target.value }))}
          placeholder="Parallel (Base, Refractor...)"
          className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm text-slate-100"
        />
        <input
          value={form.serialNumber}
          onChange={(e) => setForm((f) => ({ ...f, serialNumber: e.target.value }))}
          placeholder="Serial # (05/99)"
          className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm text-slate-100"
        />
        <input
          value={form.condition}
          onChange={(e) => setForm((f) => ({ ...f, condition: e.target.value }))}
          placeholder="Condition (Gem Mint 10...)"
          className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm text-slate-100"
        />
        <div className="flex items-center gap-4 text-sm text-slate-300 sm:col-span-2 lg:col-span-2">
          <label className="flex items-center gap-1.5">
            <input type="checkbox" checked={form.isRookie} onChange={(e) => setForm((f) => ({ ...f, isRookie: e.target.checked }))} />
            Rookie
          </label>
          <label className="flex items-center gap-1.5">
            <input type="checkbox" checked={form.isAutograph} onChange={(e) => setForm((f) => ({ ...f, isAutograph: e.target.checked }))} />
            Autograph
          </label>
          <label className="flex items-center gap-1.5">
            <input type="checkbox" checked={form.isRelic} onChange={(e) => setForm((f) => ({ ...f, isRelic: e.target.checked }))} />
            Relic
          </label>
        </div>
        <button onClick={handleAdd} className="rounded-md bg-sky-600 px-3 py-2 text-sm font-medium text-white hover:bg-sky-500 lg:col-span-2">
          Add Card
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => {
          const player = playerById.get(card.playerId)
          return (
            <div key={card.id} className="rounded-md border border-slate-800 bg-slate-900 p-3">
              <div className="mb-1 flex items-start justify-between">
                <span className="font-semibold text-slate-100">{player?.name ?? card.playerId}</span>
                <button onClick={() => removeCard(card.id)} className="text-xs text-red-400 hover:text-red-300">
                  Remove
                </button>
              </div>
              <p className="text-xs text-slate-400">
                {card.cardYear} {card.brand} {card.setName} {card.cardNumber && `#${card.cardNumber}`}
              </p>
              <p className="mt-1 flex flex-wrap gap-1 text-[10px] uppercase tracking-wide text-slate-500">
                {card.isRookie && <span className="rounded border border-emerald-700 px-1 text-emerald-400">Rookie</span>}
                {card.parallel && <span className="rounded border border-slate-700 px-1">{card.parallel}</span>}
                {card.serialNumber && <span className="rounded border border-slate-700 px-1">#{card.serialNumber}</span>}
                {card.isAutograph && <span className="rounded border border-amber-700 px-1 text-amber-400">Auto</span>}
                {card.isRelic && <span className="rounded border border-amber-700 px-1 text-amber-400">Relic</span>}
                {card.condition && <span className="rounded border border-slate-700 px-1">{card.condition}</span>}
              </p>
            </div>
          )
        })}
        {cards.length === 0 && <p className="text-sm text-slate-500">No cards yet — add one above.</p>}
      </div>
    </div>
  )
}
