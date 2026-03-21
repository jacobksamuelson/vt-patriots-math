import { useGameStore } from '@/stores/game-store'
import { STREAK_THRESHOLD } from '@/config'

export function StreakMeter() {
  const streak = useGameStore((s) => s.streak)
  const pct = Math.min((streak / STREAK_THRESHOLD) * 100, 100)
  const isFull = streak >= STREAK_THRESHOLD

  return (
    <div className="flex items-center gap-3">
      <span className="font-pixel text-[10px] text-gold">STREAK</span>
      <div className="relative w-40 h-5 border-2 border-gold/50 bg-navy">
        <div
          className={`absolute inset-y-0 left-0 transition-all duration-300 ${
            isFull ? 'bg-gold streak-fire' : 'bg-field'
          }`}
          style={{ width: `${pct}%` }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-pixel text-[8px] text-chalk">
            {streak}/{STREAK_THRESHOLD}
          </span>
        </div>
      </div>
      {isFull && <span className="text-2xl">🔥</span>}
    </div>
  )
}
