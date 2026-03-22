import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { RetroFrame } from '@/components/RetroFrame'
import { useGameStore } from '@/stores/game-store'
import { UNLOCKABLES, getUnlockedItems, getNextUnlock, type PlayerStats } from '@/lib/unlockables'
import { getProgressForGrade } from '@/lib/progress'
import { getHighScores } from '@/lib/scores'

export function TrophyCase() {
  const navigate = useNavigate()
  const profileId = useGameStore((s) => s.profileId)
  const profileName = useGameStore((s) => s.profileName)

  const [stats, setStats] = useState<PlayerStats>({
    problemsCorrect: 0, bestStreak: 0, conceptsComplete: 0,
    bestMiniGameScore: 0, perfectLevels: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profileId) return

    async function load() {
      let totalCorrect = 0
      let maxStreak = 0
      let conceptsDone = 0
      let perfects = 0

      // Load progress for all grades
      for (const grade of [3, 4, 5, 6]) {
        const rows = await getProgressForGrade(profileId!, grade)
        for (const r of rows) {
          totalCorrect += r.problemsCorrect
          if (r.bestStreak > maxStreak) maxStreak = r.bestStreak
          if (r.level > 1) conceptsDone++ // at least completed level 1
          if (r.problemsAttempted > 0 && r.problemsCorrect === r.problemsAttempted) {
            perfects++
          }
        }
      }

      // Load best mini-game score
      const scores = await getHighScores()
      const myScores = scores.filter((s) => s.profileName === profileName)
      const bestMG = myScores.reduce((max, s) => Math.max(max, s.score), 0)

      setStats({
        problemsCorrect: totalCorrect,
        bestStreak: maxStreak,
        conceptsComplete: conceptsDone,
        bestMiniGameScore: bestMG,
        perfectLevels: perfects,
      })
      setLoading(false)
    }

    load().catch(console.error)
  }, [profileId, profileName])

  const unlockedIds = getUnlockedItems(stats)
  const unlockedSet = new Set(unlockedIds)
  const nextUnlock = getNextUnlock(stats)

  const categories = [
    { key: 'celebration', label: 'CELEBRATIONS' },
    { key: 'trail', label: 'BALL TRAILS' },
    { key: 'title', label: 'TITLES' },
  ] as const

  return (
    <RetroFrame>
      <div className="flex flex-col h-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-pixel text-[14px] text-gold text-glow-gold">TROPHY CASE</h2>
          <button
            onClick={() => navigate(-1)}
            className="font-retro text-lg text-chalk/40 hover:text-chalk/70 transition-colors"
          >
            ← Back
          </button>
        </div>

        {/* Stats bar */}
        <div className="flex gap-6 mb-5 bg-navy/50 border border-chalk/10 p-3 rounded-sm">
          <div className="text-center">
            <p className="font-pixel text-[7px] text-chalk/30">CORRECT</p>
            <p className="font-pixel text-[12px] text-chalk">{stats.problemsCorrect}</p>
          </div>
          <div className="text-center">
            <p className="font-pixel text-[7px] text-chalk/30">BEST STREAK</p>
            <p className="font-pixel text-[12px] text-gold">{stats.bestStreak}🔥</p>
          </div>
          <div className="text-center">
            <p className="font-pixel text-[7px] text-chalk/30">CONCEPTS</p>
            <p className="font-pixel text-[12px] text-chalk">{stats.conceptsComplete}/8</p>
          </div>
          <div className="text-center">
            <p className="font-pixel text-[7px] text-chalk/30">UNLOCKED</p>
            <p className="font-pixel text-[12px] text-field">{unlockedIds.length}/{UNLOCKABLES.length}</p>
          </div>
        </div>

        {loading ? (
          <p className="font-pixel text-[12px] text-chalk/40 text-center animate-pulse">LOADING...</p>
        ) : (
          <div className="flex-1 overflow-y-auto flex flex-col gap-5">
            {categories.map(({ key, label }) => (
              <div key={key}>
                <p className="font-pixel text-[8px] text-chalk/40 mb-2">{label}</p>
                <div className="grid grid-cols-4 gap-3">
                  {UNLOCKABLES.filter((u) => u.category === key).map((u) => {
                    const unlocked = unlockedSet.has(u.id)
                    return (
                      <div
                        key={u.id}
                        className={`flex flex-col items-center gap-1 p-3 border-2 rounded-sm text-center ${
                          unlocked
                            ? 'border-gold/40 bg-gold/5'
                            : 'border-chalk/10 bg-navy/30 opacity-50'
                        }`}
                      >
                        <span className={`text-2xl ${unlocked ? '' : 'grayscale'}`}>{u.icon}</span>
                        <p className="font-pixel text-[7px] text-chalk">{u.name}</p>
                        <p className="font-retro text-sm text-chalk/40 leading-tight">{u.description}</p>
                        {!unlocked && (
                          <p className="font-pixel text-[6px] text-chalk/20 mt-1">
                            {u.requirement.type.replace(/_/g, ' ')} ≥ {u.requirement.value}
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}

            {/* Next unlock hint */}
            {nextUnlock && (
              <div className="bg-navy border border-gold/20 p-3 rounded-sm mt-2">
                <p className="font-pixel text-[7px] text-gold/60">NEXT UNLOCK</p>
                <p className="font-retro text-lg text-chalk/60">
                  {nextUnlock.icon} {nextUnlock.name} — {nextUnlock.description}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </RetroFrame>
  )
}
