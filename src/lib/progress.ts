import { db } from './db'
import { progress } from './db/schema'
import { eq, and } from 'drizzle-orm'

export interface ConceptProgress {
  concept: string
  domain: string
  grade: number
  level: number
  problemsCorrect: number
  problemsAttempted: number
  bestStreak: number
  totalScore: number
}

export async function getProgressForGrade(
  profileId: string,
  grade: number,
): Promise<ConceptProgress[]> {
  const rows = await db
    .select()
    .from(progress)
    .where(and(eq(progress.profileId, profileId), eq(progress.grade, grade)))

  return rows.map((r) => ({
    concept: r.concept,
    domain: r.domain,
    grade: r.grade,
    level: r.level,
    problemsCorrect: r.problemsCorrect ?? 0,
    problemsAttempted: r.problemsAttempted ?? 0,
    bestStreak: r.bestStreak ?? 0,
    totalScore: r.totalScore ?? 0,
  }))
}

export async function saveProgress(
  profileId: string,
  data: {
    grade: number
    domain: string
    concept: string
    level: number
    problemsCorrect: number
    problemsAttempted: number
    bestStreak: number
    totalScore: number
  },
): Promise<void> {
  // Upsert — insert or update on conflict
  await db
    .insert(progress)
    .values({
      profileId,
      grade: data.grade,
      domain: data.domain,
      concept: data.concept,
      level: data.level,
      problemsCorrect: data.problemsCorrect,
      problemsAttempted: data.problemsAttempted,
      bestStreak: data.bestStreak,
      totalScore: data.totalScore,
    })
    .onConflictDoUpdate({
      target: [progress.profileId, progress.grade, progress.concept],
      set: {
        level: data.level,
        problemsCorrect: data.problemsCorrect,
        problemsAttempted: data.problemsAttempted,
        bestStreak: data.bestStreak,
        totalScore: data.totalScore,
        updatedAt: new Date(),
      },
    })
}
