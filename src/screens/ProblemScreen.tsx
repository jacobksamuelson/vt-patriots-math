import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { RetroFrame } from '@/components/RetroFrame'
import { StreakMeter } from '@/components/StreakMeter'
import { ScoreDisplay } from '@/components/ScoreDisplay'
import { MathChoices } from '@/components/MathChoices'
import { HintPanel } from '@/components/HintPanel'
import { PixelButton } from '@/components/PixelButton'
import { useGameStore } from '@/stores/game-store'
import { useAudioStore } from '@/stores/audio-store'
import { loadProblems, getMaxLevel, type Problem } from '@/content/problem-engine'
import { saveProgress } from '@/lib/progress'
import { STREAK_THRESHOLD } from '@/config'

const DOMAIN_MAP: Record<string, string> = {
  multiplication: 'number-operations',
  division: 'number-operations',
  fractions: 'number-operations',
  angles: 'geometry',
  'fractions-advanced': 'number-operations',
  decimals: 'number-operations',
  ratios: 'ratios-proportions',
  expressions: 'algebra',
}

type FeedbackState = 'idle' | 'correct' | 'incorrect' | 'show-answer'

function MuteButton() {
  const { muted, toggleMute } = useAudioStore()
  return (
    <button
      onClick={toggleMute}
      className="font-retro text-xl text-chalk/40 hover:text-chalk/70 transition-colors"
      title={muted ? 'Unmute' : 'Mute'}
    >
      {muted ? '🔇' : '🔊'}
    </button>
  )
}

export function ProblemScreen() {
  const { concept = '', level = '1' } = useParams()
  const navigate = useNavigate()
  const levelNum = parseInt(level, 10)

  const {
    profileId,
    profileName,
    avatar,
    grade,
    streak,
    sessionScore,
    hintIndex,
    miniGameUnlocked,
    answerCorrect,
    answerIncorrect,
    resetHint,
    problemsCorrect,
    problemsAttempted,
  } = useGameStore()

  const { playCorrect, playIncorrect, playStreak } = useAudioStore()

  const [problems, setProblems] = useState<Problem[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [feedback, setFeedback] = useState<FeedbackState>('idle')
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [wrongCount, setWrongCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [flashClass, setFlashClass] = useState('')

  const problem = problems[currentIndex] ?? null
  const isLastProblem = currentIndex >= problems.length - 1
  const totalProblems = problems.length

  // Load problems on mount
  useEffect(() => {
    loadProblems(concept, levelNum)
      .then((p) => {
        setProblems(p)
        setLoading(false)
      })
      .catch((err) => {
        console.error('Failed to load problems:', err)
        navigate('/hub')
      })
  }, [concept, levelNum, navigate])

  function handleSelect(choice: number) {
    if (feedback !== 'idle' || !problem) return
    setSelectedAnswer(choice)

    if (choice === problem.correctAnswer) {
      // Correct!
      setFeedback('correct')
      setFlashClass('flash-correct')
      answerCorrect()
      setWrongCount(0)

      // Check if this answer triggers mini-game unlock
      const willUnlock = streak + 1 >= STREAK_THRESHOLD && !miniGameUnlocked
      if (willUnlock) {
        playStreak()
        // Go to mini-game after showing the unlock banner
        setTimeout(() => {
          setFlashClass('')
          // Read the latest miniGameType from the store
          const type = useGameStore.getState().miniGameType
          if (type) navigate(`/minigame/${type}`)
        }, 1500)
      } else {
        playCorrect()
        setTimeout(() => {
          setFlashClass('')
          advanceOrFinish()
        }, 800)
      }
    } else {
      // Incorrect
      setFeedback('incorrect')
      setFlashClass('flash-incorrect')
      answerIncorrect()
      playIncorrect()
      const newWrongCount = wrongCount + 1

      if (newWrongCount >= 2) {
        // After 2 wrong: show the answer and move on
        setFeedback('show-answer')
        setTimeout(() => {
          setFlashClass('')
        }, 400)
      } else {
        setWrongCount(newWrongCount)
        setTimeout(() => {
          setFeedback('idle')
          setSelectedAnswer(null)
          setFlashClass('')
        }, 1000)
      }
    }
  }

  async function advanceOrFinish() {
    if (isLastProblem) {
      // Level complete — save progress to DB
      if (profileId && grade) {
        const maxLevel = await getMaxLevel(concept)
        const nextLevel = levelNum < maxLevel ? levelNum + 1 : levelNum
        await saveProgress(profileId, {
          grade,
          domain: DOMAIN_MAP[concept] ?? 'unknown',
          concept,
          level: nextLevel,
          problemsCorrect: problemsCorrect,
          problemsAttempted: problemsAttempted,
          bestStreak: streak > 0 ? streak : 0,
          totalScore: sessionScore,
        }).catch(console.error)
      }
      navigate('/results')
      return
    }

    setCurrentIndex((i) => i + 1)
    setFeedback('idle')
    setSelectedAnswer(null)
    setWrongCount(0)
    resetHint()
  }


  if (loading) {
    return (
      <RetroFrame>
        <div className="flex items-center justify-center h-full">
          <p className="font-pixel text-[14px] text-gold animate-pulse">LOADING...</p>
        </div>
      </RetroFrame>
    )
  }

  if (!problem) {
    return (
      <RetroFrame>
        <div className="flex flex-col items-center justify-center h-full gap-4">
          <p className="font-pixel text-[12px] text-red">NO PROBLEMS FOUND</p>
          <PixelButton onClick={() => navigate('/hub')}>BACK TO HUB</PixelButton>
        </div>
      </RetroFrame>
    )
  }

  return (
    <RetroFrame>
      <div className={`flex flex-col h-full p-6 ${flashClass}`}>
        {/* Top bar */}
        <div className="flex items-center justify-between mb-4">
          <ScoreDisplay />
          <div className="flex items-center gap-4">
            <span className="font-retro text-lg text-chalk/40">
              {currentIndex + 1}/{totalProblems}
            </span>
            <StreakMeter />
            <MuteButton />
          </div>
        </div>

        {/* Player + concept info */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-team rounded-sm flex items-center justify-center">
              <span className="font-pixel text-[7px] text-chalk">
                #{avatar === 'blake' ? '12' : '23'}
              </span>
            </div>
            <div>
              <p className="font-pixel text-[8px] text-chalk/60">{profileName}</p>
              <p className="font-pixel text-[10px] text-gold">{concept.toUpperCase()} · LVL {levelNum}</p>
            </div>
          </div>

          {/* Mini-game unlock alert */}
          {miniGameUnlocked && (
            <div className="bg-gold/20 border-2 border-gold px-4 py-2 rounded-sm streak-fire">
              <p className="font-pixel text-[10px] text-gold text-glow-gold">
                MINI-GAME UNLOCKED!
              </p>
            </div>
          )}
        </div>

        {/* Problem area */}
        <div className="flex-1 flex flex-col items-center justify-center gap-6">
          {/* Question */}
          <div className="bg-navy border-2 border-chalk/20 px-12 py-8 rounded-sm">
            <p className="font-pixel text-[24px] text-chalk text-center leading-relaxed">
              {problem.question}
            </p>
          </div>

          {/* Feedback message */}
          {feedback === 'correct' && (
            <div className="flex items-center gap-2">
              <span className="font-pixel text-[14px] text-field text-glow-blue">CORRECT!</span>
              {streak >= STREAK_THRESHOLD && (
                <span className="font-pixel text-[10px] text-gold text-glow-gold ml-2">
                  🔥 {streak} STREAK!
                </span>
              )}
            </div>
          )}

          {feedback === 'incorrect' && (
            <p className="font-pixel text-[12px] text-red text-glow-red">TRY AGAIN!</p>
          )}

          {feedback === 'show-answer' && (
            <div className="flex flex-col items-center gap-2">
              <p className="font-pixel text-[12px] text-gold">
                ANSWER: {problem.correctAnswer}
              </p>
              <PixelButton size="sm" variant="gold" onClick={advanceOrFinish}>
                {isLastProblem ? 'FINISH' : 'NEXT'}
              </PixelButton>
            </div>
          )}

          {/* Choices */}
          <MathChoices
            choices={problem.choices}
            onSelect={handleSelect}
            disabled={feedback !== 'idle'}
            correctAnswer={feedback === 'correct' || feedback === 'show-answer' ? problem.correctAnswer : null}
            selectedAnswer={selectedAnswer}
          />

          {/* Hints */}
          <HintPanel hints={problem.hints} hintIndex={hintIndex} />
        </div>

        {/* Bottom nav */}
        <div className="flex justify-between items-center mt-4">
          <div className="flex gap-4">
            <button
              onClick={() => navigate('/hub')}
              className="font-retro text-lg text-chalk/30 hover:text-chalk/60 transition-colors"
            >
              ← Hub
            </button>
            <button
              onClick={() => navigate('/profiles')}
              className="font-retro text-lg text-chalk/30 hover:text-chalk/60 transition-colors"
            >
              ← Home
            </button>
          </div>
          <p className="font-retro text-lg text-chalk/30">
            {problemsCorrect} correct
          </p>
        </div>
      </div>
    </RetroFrame>
  )
}
