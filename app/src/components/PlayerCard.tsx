import { ABILITY_DESCRIPTIONS } from '../lib/rules/abilities'
import type { PlayerWithRatings } from '../store/players'
import RatingBar from './RatingBar'

function dominantKey(ratings: object): string {
  const entries = Object.entries(ratings) as [string, number][]
  return entries.reduce((best, entry) => (entry[1] > best[1] ? entry : best))[0]
}

export default function PlayerCard({ player, ratings, onRemove }: PlayerWithRatings & { onRemove?: () => void }) {
  const hitter = ratings.hitter
  const pitcher = ratings.pitcher

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
      <div className="mb-3 flex items-start justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-100">{player.name}</h3>
          <p className="text-sm text-slate-400">
            {player.team} · {player.primaryPosition} · {player.statSource === 'career' ? 'Career' : `${player.season} season`}
            {player.rosterTag && (
              <span className="ml-2 rounded border border-amber-700 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-400">
                {player.rosterTag}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-start gap-2">
          <div className="text-right">
            <div className="text-2xl font-black text-sky-400">{hitter?.overall ?? pitcher?.overall ?? '-'}</div>
            <div className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Overall</div>
          </div>
          {onRemove && (
            <button
              onClick={onRemove}
              title="Remove from your player pool"
              className="rounded border border-slate-700 px-1.5 py-0.5 text-xs text-slate-500 hover:border-red-700 hover:text-red-400"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {hitter && (
        <div className="space-y-3 border-t border-slate-800 pt-3 first:border-t-0 first:pt-0">
          <RatingGroup
            title="Offense"
            entries={[
              ['Contact', hitter.display.contact],
              ['Power', hitter.display.power],
              ['Discipline', hitter.display.discipline],
            ]}
            dominant={dominantKey(hitter.display)}
          />
          <RatingGroup
            title="Athleticism"
            entries={[
              ['Speed', hitter.display.speed],
              ['Clutch', hitter.display.clutch],
            ]}
            dominant={dominantKey(hitter.display)}
          />
          <RatingGroup title="Defense" entries={[['Fielding', hitter.display.fielding]]} dominant={dominantKey(hitter.display)} />
        </div>
      )}

      {pitcher && (
        <div className="space-y-3 border-t border-slate-800 pt-3 first:border-t-0 first:pt-0">
          <RatingGroup
            title="Stuff"
            entries={[
              ['Velocity', pitcher.display.velocity],
              ['Stuff', pitcher.display.stuff],
              ['Movement', pitcher.display.movement],
            ]}
            dominant={dominantKey(pitcher.display)}
          />
          <RatingGroup
            title="Command & Endurance"
            entries={[
              ['Control', pitcher.display.control],
              ['Stamina', pitcher.display.stamina],
            ]}
            dominant={dominantKey(pitcher.display)}
          />
          <RatingGroup title="Mental" entries={[['Clutch', pitcher.display.clutch]]} dominant={dominantKey(pitcher.display)} />
        </div>
      )}

      {player.abilities && player.abilities.length > 0 && (
        <div className="mt-3 space-y-1.5 border-t border-slate-800 pt-3">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Abilities</div>
          {player.abilities.map((name) => (
            <div key={name} className="text-xs">
              <span className="font-semibold text-amber-300">{name}</span>{' '}
              <span className="text-slate-400">— {ABILITY_DESCRIPTIONS[name] ?? ''}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function RatingGroup({
  title,
  entries,
  dominant,
}: {
  title: string
  entries: [string, number][]
  dominant: string
}) {
  return (
    <div>
      <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">{title}</div>
      <div className="space-y-1.5">
        {entries.map(([label, value]) => (
          <RatingBar key={label} label={label} value={value} highlight={label.toLowerCase() === dominant.toLowerCase()} />
        ))}
      </div>
    </div>
  )
}
