import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { RetroFrame } from '@/components/RetroFrame'
import { PassingDrill } from '@/canvas/PassingDrill'
import { FieldGoal } from '@/canvas/FieldGoal'
import { RouteRunning } from '@/canvas/RouteRunning'
import { useGameStore } from '@/stores/game-store'
import { useAudioStore } from '@/stores/audio-store'
import { saveMiniGameScore } from '@/lib/scores'

type Phase = 'countdown' | 'playing' | 'done'

export function MiniGameScreen() {
  const { type } = useParams<{ type: string }>()
  const navigate = useNavigate()
  const completeMiniGame = useGameStore((s) => s.completeMiniGame)
  const profileId = useGameStore((s) => s.profileId)
  const grade = useGameStore((s) => s.grade)
  const currentConcept = useGameStore((s) => s.currentConcept)
  const { playStreak } = useAudioStore()

  const [phase, setPhase] = useState<Phase>('countdown')
  const [count, setCount] = useState(3)
  const [miniGameScore, setMiniGameScore] = useState(0)

  // Countdown 3-2-1
  useEffect(() => {
    if (phase !== 'countdown') return

    if (count <= 0) {
      setPhase('playing')
      return
    }

    const timer = setTimeout(() => setCount((c) => c - 1), 800)
    return () => clearTimeout(timer)
  }, [phase, count])

  const handleComplete = useCallback(
    (score: number) => {
      setMiniGameScore(score)
      completeMiniGame(score)
      playStreak()
      setPhase('done')

      // Save score to database
      if (profileId && type) {
        saveMiniGameScore(
          profileId,
          type,
          score,
          grade ?? 3,
          currentConcept ?? 'free-play',
        ).catch(console.error)
      }

      setTimeout(() => {
        navigate('/results')
      }, 2000)
    },
    [completeMiniGame, playStreak, navigate, profileId, type, grade, currentConcept],
  )

  const title = type === 'passing-drill' ? 'PASSING DRILL' : type === 'route-running' ? 'ROUTE RUNNING' : 'FIELD GOAL'

  return (
    <RetroFrame>
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <h2 className="font-pixel text-[14px] text-gold text-glow-gold">{title}</h2>

        {phase === 'countdown' && (
          <div className="flex items-center justify-center w-[600px] h-[400px] border-2 border-gold/30 rounded-sm bg-navy">
            <span className="font-pixel text-[72px] text-gold text-glow-gold animate-pulse">
              {count > 0 ? count : 'GO!'}
            </span>
          </div>
        )}

        {phase === 'playing' && (
          type === 'passing-drill' ? (
            <PassingDrill onComplete={handleComplete} />
          ) : type === 'route-running' ? (
            <RouteRunning onComplete={handleComplete} />
          ) : (
            <FieldGoal onComplete={handleComplete} />
          )
        )}

        {phase === 'done' && (
          <div className="flex flex-col items-center justify-center w-[600px] h-[400px] border-2 border-gold/30 rounded-sm bg-navy gap-4">
            <p className="font-pixel text-[16px] text-field">GAME OVER!</p>
            <p className="font-pixel text-[28px] text-gold text-glow-gold">
              {miniGameScore} PTS
            </p>
          </div>
        )}
      </div>
    </RetroFrame>
  )
}
