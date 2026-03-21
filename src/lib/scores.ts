import { db } from './db'
import { miniGameScores, profiles } from './db/schema'
import { desc, eq } from 'drizzle-orm'

export interface MiniGameScore {
  id: string
  profileName: string
  avatar: string
  gameType: string
  score: number
  playedAt: Date | null
}

export async function saveMiniGameScore(
  profileId: string,
  gameType: string,
  score: number,
  grade: number,
  concept: string,
): Promise<void> {
  await db.insert(miniGameScores).values({
    profileId,
    gameType,
    score,
    grade,
    concept,
  })
}

export async function getHighScores(gameType?: string): Promise<MiniGameScore[]> {
  const query = db
    .select({
      id: miniGameScores.id,
      profileName: profiles.name,
      avatar: profiles.avatar,
      gameType: miniGameScores.gameType,
      score: miniGameScores.score,
      playedAt: miniGameScores.playedAt,
    })
    .from(miniGameScores)
    .innerJoin(profiles, eq(miniGameScores.profileId, profiles.id))
    .orderBy(desc(miniGameScores.score))
    .limit(20)

  if (gameType) {
    return query.where(eq(miniGameScores.gameType, gameType))
  }

  return query
}
