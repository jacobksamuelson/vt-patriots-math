import { useGameStore } from '@/stores/game-store'

export function ScoreDisplay() {
  const score = useGameStore((s) => s.sessionScore)

  return (
    <div className="flex items-center gap-2">
      <span className="font-pixel text-[10px] text-chalk/60">SCORE</span>
      <span className="font-pixel text-[16px] text-gold text-glow-gold">
        {score.toLocaleString()}
      </span>
    </div>
  )
}
