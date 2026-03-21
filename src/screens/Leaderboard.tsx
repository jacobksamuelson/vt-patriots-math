import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { RetroFrame } from '@/components/RetroFrame'
import { PixelButton } from '@/components/PixelButton'
import { getHighScores, type MiniGameScore } from '@/lib/scores'

type GameFilter = 'all' | 'passing-drill' | 'field-goal'

const MEDAL = ['🥇', '🥈', '🥉']

export function Leaderboard() {
  const navigate = useNavigate()
  const [scores, setScores] = useState<MiniGameScore[]>([])
  const [filter, setFilter] = useState<GameFilter>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getHighScores(filter === 'all' ? undefined : filter)
      .then(setScores)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [filter])

  return (
    <RetroFrame>
      <div className="flex flex-col h-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-pixel text-[16px] text-gold text-glow-gold">HIGH SCORES</h2>
          <button
            onClick={() => navigate(-1)}
            className="font-retro text-lg text-chalk/40 hover:text-chalk/70 transition-colors"
          >
            ← Back
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6">
          {([
            ['all', 'ALL'],
            ['passing-drill', 'PASSING'],
            ['field-goal', 'FIELD GOAL'],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={`font-pixel text-[8px] px-3 py-2 border-2 rounded-sm transition-colors ${
                filter === value
                  ? 'border-gold bg-gold/20 text-gold'
                  : 'border-chalk/20 text-chalk/40 hover:border-chalk/40'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Scores table */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <p className="font-pixel text-[12px] text-chalk/40 text-center animate-pulse">
              LOADING...
            </p>
          ) : scores.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <p className="font-pixel text-[12px] text-chalk/30">NO SCORES YET</p>
              <p className="font-retro text-xl text-chalk/20">Play a mini-game to get on the board!</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {/* Header row */}
              <div className="grid grid-cols-[40px_1fr_120px_100px_80px] gap-2 px-3 py-1">
                <span className="font-pixel text-[7px] text-chalk/30">#</span>
                <span className="font-pixel text-[7px] text-chalk/30">PLAYER</span>
                <span className="font-pixel text-[7px] text-chalk/30">GAME</span>
                <span className="font-pixel text-[7px] text-chalk/30 text-right">SCORE</span>
                <span className="font-pixel text-[7px] text-chalk/30 text-right">DATE</span>
              </div>

              {scores.map((s, i) => (
                <div
                  key={s.id}
                  className={`grid grid-cols-[40px_1fr_120px_100px_80px] gap-2 px-3 py-2 rounded-sm ${
                    i < 3 ? 'bg-gold/10 border border-gold/20' : 'bg-navy-light/50'
                  }`}
                >
                  <span className="font-pixel text-[10px] text-chalk/60">
                    {i < 3 ? MEDAL[i] : i + 1}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-blue-team rounded-sm flex items-center justify-center shrink-0">
                      <span className="font-pixel text-[5px] text-chalk">
                        #{s.avatar === 'blake' ? '12' : '23'}
                      </span>
                    </div>
                    <span className="font-pixel text-[9px] text-chalk truncate">
                      {s.profileName}
                    </span>
                  </div>
                  <span className="font-pixel text-[7px] text-chalk/50">
                    {s.gameType === 'passing-drill' ? 'PASSING' : 'FIELD GOAL'}
                  </span>
                  <span className={`font-pixel text-[12px] text-right ${i < 3 ? 'text-gold' : 'text-chalk'}`}>
                    {s.score}
                  </span>
                  <span className="font-retro text-sm text-chalk/30 text-right">
                    {s.playedAt ? new Date(s.playedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </RetroFrame>
  )
}
