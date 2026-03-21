import { useNavigate } from 'react-router-dom'
import { RetroFrame } from '@/components/RetroFrame'
import { useGameStore } from '@/stores/game-store'
import { GRADES } from '@/config'

const GRADE_COLORS = {
  3: 'border-field bg-field/20 hover:bg-field/40',
  4: 'border-blue-light bg-blue-team/20 hover:bg-blue-team/40',
  5: 'border-gold bg-gold-dark/20 hover:bg-gold-dark/40',
  6: 'border-red bg-red/20 hover:bg-red/40',
} as const

const GRADE_LABELS = {
  3: 'ROOKIE',
  4: 'STARTER',
  5: 'ALL-STAR',
  6: 'MVP',
} as const

export function GradeSelect() {
  const navigate = useNavigate()
  const setGrade = useGameStore((s) => s.setGrade)
  const profileName = useGameStore((s) => s.profileName)

  function pickGrade(grade: number) {
    setGrade(grade)
    navigate('/hub')
  }

  return (
    <RetroFrame>
      <div className="flex flex-col items-center justify-center h-full gap-10 p-8">
        <div className="text-center">
          <p className="font-retro text-2xl text-chalk/60">
            Welcome, {profileName}!
          </p>
          <h2 className="font-pixel text-[16px] text-gold text-glow-gold mt-2">
            SELECT YOUR GRADE
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {GRADES.map((grade) => (
            <button
              key={grade}
              onClick={() => pickGrade(grade)}
              className={`flex flex-col items-center gap-3 w-[180px] h-[140px] border-4 rounded-sm transition-colors justify-center ${GRADE_COLORS[grade]}`}
            >
              <span className="font-pixel text-[36px] text-chalk text-glow-blue">
                {grade}
              </span>
              <span className="font-pixel text-[10px] text-chalk/70">
                {GRADE_LABELS[grade]}
              </span>
            </button>
          ))}
        </div>

        <button
          onClick={() => navigate('/profiles')}
          className="font-retro text-xl text-chalk/40 hover:text-chalk/70 transition-colors"
        >
          ← Switch Player
        </button>
      </div>
    </RetroFrame>
  )
}
