export interface Unlockable {
  id: string
  name: string
  description: string
  icon: string
  category: 'celebration' | 'trail' | 'title'
  requirement: {
    type: 'problems_correct' | 'best_streak' | 'concepts_complete' | 'mini_game_score' | 'perfect_level'
    value: number
  }
}

export const UNLOCKABLES: Unlockable[] = [
  // Celebrations (shown after correct answers)
  {
    id: 'confetti',
    name: 'Confetti Burst',
    description: 'Correct answers rain confetti',
    icon: '🎊',
    category: 'celebration',
    requirement: { type: 'problems_correct', value: 10 },
  },
  {
    id: 'fireworks',
    name: 'Fireworks',
    description: 'Streaks launch fireworks',
    icon: '🎆',
    category: 'celebration',
    requirement: { type: 'best_streak', value: 8 },
  },
  {
    id: 'touchdown-dance',
    name: 'TD Dance',
    description: 'Player dances on level complete',
    icon: '🕺',
    category: 'celebration',
    requirement: { type: 'concepts_complete', value: 2 },
  },
  {
    id: 'stadium-roar',
    name: 'Stadium Roar',
    description: 'Crowd goes wild on perfect answers',
    icon: '🏟️',
    category: 'celebration',
    requirement: { type: 'problems_correct', value: 50 },
  },
  {
    id: 'lightning',
    name: 'Lightning Strike',
    description: 'Thunder on 10+ streaks',
    icon: '⚡',
    category: 'celebration',
    requirement: { type: 'best_streak', value: 10 },
  },

  // Ball trails (mini-games)
  {
    id: 'fire-trail',
    name: 'Fire Trail',
    description: 'Football leaves a fire trail',
    icon: '🔥',
    category: 'trail',
    requirement: { type: 'mini_game_score', value: 200 },
  },
  {
    id: 'rainbow-trail',
    name: 'Rainbow Trail',
    description: 'Football leaves a rainbow trail',
    icon: '🌈',
    category: 'trail',
    requirement: { type: 'mini_game_score', value: 400 },
  },

  // Titles (shown on profile)
  {
    id: 'rookie',
    name: 'Rookie',
    description: 'Complete your first level',
    icon: '🌟',
    category: 'title',
    requirement: { type: 'concepts_complete', value: 1 },
  },
  {
    id: 'mathlete',
    name: 'Mathlete',
    description: 'Complete 4 concepts',
    icon: '🧮',
    category: 'title',
    requirement: { type: 'concepts_complete', value: 4 },
  },
  {
    id: 'mvp',
    name: 'MVP',
    description: 'Get a perfect level (100% accuracy)',
    icon: '🏆',
    category: 'title',
    requirement: { type: 'perfect_level', value: 1 },
  },
  {
    id: 'hall-of-fame',
    name: 'Hall of Fame',
    description: 'Complete all 8 concepts',
    icon: '👑',
    category: 'title',
    requirement: { type: 'concepts_complete', value: 8 },
  },
]

export interface PlayerStats {
  problemsCorrect: number
  bestStreak: number
  conceptsComplete: number
  bestMiniGameScore: number
  perfectLevels: number
}

export function getUnlockedItems(stats: PlayerStats): string[] {
  return UNLOCKABLES
    .filter((u) => {
      switch (u.requirement.type) {
        case 'problems_correct': return stats.problemsCorrect >= u.requirement.value
        case 'best_streak': return stats.bestStreak >= u.requirement.value
        case 'concepts_complete': return stats.conceptsComplete >= u.requirement.value
        case 'mini_game_score': return stats.bestMiniGameScore >= u.requirement.value
        case 'perfect_level': return stats.perfectLevels >= u.requirement.value
      }
    })
    .map((u) => u.id)
}

export function getNextUnlock(stats: PlayerStats): Unlockable | null {
  const unlocked = new Set(getUnlockedItems(stats))
  // Find the closest unlock by progress percentage
  let best: Unlockable | null = null
  let bestPct = 0

  for (const u of UNLOCKABLES) {
    if (unlocked.has(u.id)) continue
    let pct = 0
    switch (u.requirement.type) {
      case 'problems_correct': pct = stats.problemsCorrect / u.requirement.value; break
      case 'best_streak': pct = stats.bestStreak / u.requirement.value; break
      case 'concepts_complete': pct = stats.conceptsComplete / u.requirement.value; break
      case 'mini_game_score': pct = stats.bestMiniGameScore / u.requirement.value; break
      case 'perfect_level': pct = stats.perfectLevels / u.requirement.value; break
    }
    if (pct > bestPct) { bestPct = pct; best = u }
  }
  return best
}
