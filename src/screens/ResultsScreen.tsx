import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { RetroFrame } from '@/components/RetroFrame'
import { PixelButton } from '@/components/PixelButton'
import { useGameStore } from '@/stores/game-store'
import { getMaxLevel } from '@/content/problem-engine'

export function ResultsScreen() {
  const navigate = useNavigate()
  const {
    sessionScore,
    problemsCorrect,
    problemsAttempted,
    currentConcept,
    currentLevel,
    startConcept,
  } = useGameStore()

  const [maxLevel, setMaxLevel] = useState(1)
  const accuracy = problemsAttempted > 0 ? Math.round((problemsCorrect / problemsAttempted) * 100) : 0
  const hasNextLevel = currentLevel < maxLevel
  const grade = accuracy >= 50 ? (accuracy >= 80 ? 'S' : 'A') : accuracy >= 30 ? 'B' : 'C'
  const gradeColor = grade === 'S' ? 'text-gold text-glow-gold' : grade === 'A' ? 'text-field' : grade === 'B' ? 'text-chalk' : 'text-red'

  useEffect(() => {
    if (currentConcept) {
      getMaxLevel(currentConcept).then(setMaxLevel)
    }
  }, [currentConcept])

  function playNextLevel() {
    if (!currentConcept || !hasNextLevel) return
    const next = currentLevel + 1
    startConcept(currentConcept, next)
    navigate(`/play/${currentConcept}/${next}`)
  }

  return (
    <RetroFrame>
      <div className="flex flex-col items-center justify-center h-full gap-6 p-8">
        <h2 className="font-pixel text-[18px] text-gold text-glow-gold">
          LEVEL COMPLETE!
        </h2>

        {/* Grade */}
        <div className="flex flex-col items-center">
          <span className={`font-pixel text-[48px] ${gradeColor}`}>{grade}</span>
          <span className="font-retro text-lg text-chalk/40">RANK</span>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-8 bg-navy border-2 border-gold/30 px-8 py-6 rounded-sm">
          <div className="text-center">
            <p className="font-pixel text-[7px] text-chalk/40 mb-1">SCORE</p>
            <p className="font-pixel text-[18px] text-gold text-glow-gold">
              {sessionScore.toLocaleString()}
            </p>
          </div>
          <div className="text-center">
            <p className="font-pixel text-[7px] text-chalk/40 mb-1">ACCURACY</p>
            <p className="font-pixel text-[18px] text-chalk">{accuracy}%</p>
          </div>
          <div className="text-center">
            <p className="font-pixel text-[7px] text-chalk/40 mb-1">CORRECT</p>
            <p className="font-pixel text-[18px] text-field">
              {problemsCorrect}/{problemsAttempted}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 mt-4">
          {hasNextLevel && (
            <PixelButton variant="gold" size="lg" onClick={playNextLevel}>
              NEXT LEVEL →
            </PixelButton>
          )}
          <PixelButton
            variant={hasNextLevel ? 'secondary' : 'gold'}
            size="lg"
            onClick={() => navigate('/hub')}
          >
            {hasNextLevel ? 'HUB' : 'BACK TO HUB'}
          </PixelButton>
        </div>

        {!hasNextLevel && currentConcept && (
          <p className="font-pixel text-[10px] text-gold text-glow-gold mt-2">
            ALL LEVELS COMPLETE — NICE WORK!
          </p>
        )}
      </div>
    </RetroFrame>
  )
}
