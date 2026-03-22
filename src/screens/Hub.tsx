import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { RetroFrame } from '@/components/RetroFrame'
import { PixelButton } from '@/components/PixelButton'
import { useGameStore } from '@/stores/game-store'
import { getProgressForGrade, type ConceptProgress } from '@/lib/progress'
import { getMaxLevel } from '@/content/problem-engine'

interface ConceptDef {
  id: string
  name: string
  domain: string
}

const CONCEPTS_BY_GRADE: Record<number, ConceptDef[]> = {
  3: [
    { id: 'multiplication', name: 'MULTIPLICATION', domain: 'number-operations' },
    { id: 'division', name: 'DIVISION', domain: 'number-operations' },
  ],
  4: [
    { id: 'fractions', name: 'FRACTIONS', domain: 'number-operations' },
    { id: 'angles', name: 'ANGLES', domain: 'geometry' },
  ],
  5: [
    { id: 'fractions-advanced', name: 'FRACTIONS+', domain: 'number-operations' },
    { id: 'decimals', name: 'DECIMALS', domain: 'number-operations' },
  ],
  6: [
    { id: 'ratios', name: 'RATIOS', domain: 'ratios-proportions' },
    { id: 'expressions', name: 'EXPRESSIONS', domain: 'algebra' },
  ],
}

export function Hub() {
  const navigate = useNavigate()
  const grade = useGameStore((s) => s.grade)
  const profileId = useGameStore((s) => s.profileId)
  const profileName = useGameStore((s) => s.profileName)
  const startConcept = useGameStore((s) => s.startConcept)

  const [progressMap, setProgressMap] = useState<Record<string, ConceptProgress>>({})
  const [maxLevels, setMaxLevels] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  const concepts = CONCEPTS_BY_GRADE[grade ?? 3] ?? []

  useEffect(() => {
    if (!profileId || !grade) return

    async function load() {
      // Load progress from DB
      const rows = await getProgressForGrade(profileId!, grade!)
      const map: Record<string, ConceptProgress> = {}
      for (const row of rows) {
        map[row.concept] = row
      }
      setProgressMap(map)

      // Load max levels for each concept
      const levels: Record<string, number> = {}
      for (const c of CONCEPTS_BY_GRADE[grade!] ?? []) {
        levels[c.id] = await getMaxLevel(c.id)
      }
      setMaxLevels(levels)

      setLoading(false)
    }

    load().catch(console.error)
  }, [profileId, grade])

  function playConcept(conceptId: string) {
    const prog = progressMap[conceptId]
    const level = prog?.level ?? 1
    startConcept(conceptId, level)
    navigate(`/play/${conceptId}/${level}`)
  }

  return (
    <RetroFrame>
      <div className="flex flex-col h-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="font-retro text-xl text-chalk/50">{profileName}</p>
            <h2 className="font-pixel text-[14px] text-gold">GRADE {grade}</h2>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => navigate('/grade')}
              className="font-retro text-lg text-chalk/40 hover:text-chalk/70 transition-colors"
            >
              ← Change Grade
            </button>
            <button
              onClick={() => navigate('/profiles')}
              className="font-retro text-lg text-chalk/40 hover:text-chalk/70 transition-colors"
            >
              ← Switch Player
            </button>
          </div>
        </div>

        {/* Field */}
        <div className="flex-1 bg-field/10 border-2 border-field/30 rounded-sm p-6">
          <h3 className="font-pixel text-[10px] text-field mb-6 text-center">
            CHOOSE YOUR PLAY
          </h3>

          {loading ? (
            <p className="text-center font-pixel text-[12px] text-chalk/40 animate-pulse">
              LOADING...
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-6 max-w-[600px] mx-auto">
              {concepts.map((concept) => {
                const prog = progressMap[concept.id]
                const currentLevel = prog?.level ?? 1
                const max = maxLevels[concept.id] ?? 1
                const pct = prog
                  ? Math.round((prog.problemsCorrect / Math.max(prog.problemsAttempted, 1)) * 100)
                  : 0
                const isComplete = currentLevel > max

                return (
                  <div
                    key={concept.id}
                    className="flex flex-col items-center gap-3 bg-navy border-2 border-chalk/20 p-5 rounded-sm"
                  >
                    <span className="font-pixel text-[11px] text-chalk text-center">
                      {concept.name}
                    </span>
                    <span className="font-retro text-lg text-chalk/30">{concept.domain}</span>

                    {/* Level indicator */}
                    <div className="flex items-center gap-2 w-full">
                      <span className="font-pixel text-[7px] text-chalk/40">LVL</span>
                      <div className="flex gap-1 flex-1">
                        {Array.from({ length: max }, (_, i) => (
                          <div
                            key={i}
                            className={`h-2 flex-1 rounded-sm ${
                              i < currentLevel - 1
                                ? 'bg-gold'
                                : i === currentLevel - 1
                                  ? 'bg-field'
                                  : 'bg-chalk/10'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="font-pixel text-[7px] text-chalk/40">
                        {isComplete ? '✓' : `${currentLevel}/${max}`}
                      </span>
                    </div>

                    {/* Stats */}
                    {prog && (
                      <div className="flex gap-4 text-center">
                        <div>
                          <p className="font-pixel text-[7px] text-chalk/30">ACC</p>
                          <p className="font-pixel text-[9px] text-chalk">{pct}%</p>
                        </div>
                        <div>
                          <p className="font-pixel text-[7px] text-chalk/30">BEST</p>
                          <p className="font-pixel text-[9px] text-gold">{prog.bestStreak}🔥</p>
                        </div>
                        <div>
                          <p className="font-pixel text-[7px] text-chalk/30">PTS</p>
                          <p className="font-pixel text-[9px] text-chalk">{prog.totalScore}</p>
                        </div>
                      </div>
                    )}

                    <PixelButton
                      size="sm"
                      variant={isComplete ? 'gold' : 'primary'}
                      onClick={() => playConcept(concept.id)}
                    >
                      {isComplete ? 'REPLAY' : prog ? 'CONTINUE' : 'PLAY'}
                    </PixelButton>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Mini-games + Leaderboard */}
        <div className="flex items-center justify-between mt-4">
          <div className="flex gap-3">
            <PixelButton size="sm" variant="secondary" onClick={() => navigate('/minigame/passing-drill')}>
              PASSING DRILL
            </PixelButton>
            <PixelButton size="sm" variant="secondary" onClick={() => navigate('/minigame/field-goal')}>
              FIELD GOAL
            </PixelButton>
          </div>
          <div className="flex gap-3">
            <PixelButton size="sm" variant="gold" onClick={() => navigate('/trophies')}>
              TROPHIES
            </PixelButton>
            <PixelButton size="sm" variant="gold" onClick={() => navigate('/leaderboard')}>
              SCORES
            </PixelButton>
          </div>
        </div>
      </div>
    </RetroFrame>
  )
}
