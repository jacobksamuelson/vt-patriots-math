// Game constants
export const STREAK_THRESHOLD = 5 // correct in a row to unlock mini-game
export const PROBLEMS_PER_LEVEL = 8
export const POINTS_CORRECT = 100
export const POINTS_STREAK_BONUS = 50 // bonus per streak level
export const GRADES = [3, 4, 5, 6] as const
export type Grade = (typeof GRADES)[number]
