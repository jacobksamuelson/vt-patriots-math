import { create } from 'zustand'
import { STREAK_THRESHOLD, POINTS_CORRECT, POINTS_STREAK_BONUS } from '@/config'
import type { Avatar } from '@/lib/auth'

type MiniGameType = 'passing-drill' | 'field-goal'

interface GameStore {
  // Profile
  profileId: string | null
  profileName: string
  avatar: Avatar

  // Session
  grade: number | null
  currentConcept: string | null
  currentLevel: number

  // In-play
  streak: number
  sessionScore: number
  problemsCorrect: number
  problemsAttempted: number
  hintIndex: number

  // Mini-game
  miniGameUnlocked: boolean
  miniGameType: MiniGameType | null

  // Actions
  setProfile: (id: string, name: string, avatar: Avatar) => void
  setGrade: (grade: number) => void
  startConcept: (concept: string, level: number) => void
  answerCorrect: () => void
  answerIncorrect: () => void
  resetHint: () => void
  completeMiniGame: (score: number) => void
  resetSession: () => void
  clearProfile: () => void
}

export const useGameStore = create<GameStore>((set, get) => ({
  profileId: null,
  profileName: '',
  avatar: 'blake',

  grade: null,
  currentConcept: null,
  currentLevel: 1,

  streak: 0,
  sessionScore: 0,
  problemsCorrect: 0,
  problemsAttempted: 0,
  hintIndex: 0,

  miniGameUnlocked: false,
  miniGameType: null,

  setProfile: (id, name, avatar) => set({ profileId: id, profileName: name, avatar }),

  setGrade: (grade) => set({ grade }),

  startConcept: (concept, level) =>
    set({
      currentConcept: concept,
      currentLevel: level,
      streak: 0,
      sessionScore: 0,
      problemsCorrect: 0,
      problemsAttempted: 0,
      hintIndex: 0,
      miniGameUnlocked: false,
      miniGameType: null,
    }),

  answerCorrect: () => {
    const { streak } = get()
    const newStreak = streak + 1
    const streakBonus = newStreak * POINTS_STREAK_BONUS
    const points = POINTS_CORRECT + streakBonus
    const unlocked = newStreak >= STREAK_THRESHOLD

    set((s) => ({
      streak: newStreak,
      sessionScore: s.sessionScore + points,
      problemsCorrect: s.problemsCorrect + 1,
      problemsAttempted: s.problemsAttempted + 1,
      hintIndex: 0,
      miniGameUnlocked: unlocked || s.miniGameUnlocked,
      miniGameType: unlocked ? (Math.random() > 0.5 ? 'passing-drill' : 'field-goal') : s.miniGameType,
    }))
  },

  answerIncorrect: () =>
    set((s) => ({
      streak: 0,
      problemsAttempted: s.problemsAttempted + 1,
      hintIndex: Math.min(s.hintIndex + 1, 2),
    })),

  resetHint: () => set({ hintIndex: 0 }),

  completeMiniGame: (score) =>
    set((s) => ({
      sessionScore: s.sessionScore + score,
      miniGameUnlocked: false,
      miniGameType: null,
    })),

  resetSession: () =>
    set({
      currentConcept: null,
      currentLevel: 1,
      streak: 0,
      sessionScore: 0,
      problemsCorrect: 0,
      problemsAttempted: 0,
      hintIndex: 0,
      miniGameUnlocked: false,
      miniGameType: null,
    }),

  clearProfile: () =>
    set({
      profileId: null,
      profileName: '',
      avatar: 'blake',
      grade: null,
      currentConcept: null,
      currentLevel: 1,
      streak: 0,
      sessionScore: 0,
      problemsCorrect: 0,
      problemsAttempted: 0,
      hintIndex: 0,
      miniGameUnlocked: false,
      miniGameType: null,
    }),
}))
