import { db } from './db'
import { profiles } from './db/schema'
import { desc, eq } from 'drizzle-orm'

export type Avatar = 'blake' | 'davion'

export interface Profile {
  id: string
  name: string
  avatar: Avatar
  createdAt: Date | null
}

export async function getProfiles(): Promise<Profile[]> {
  const rows = await db
    .select()
    .from(profiles)
    .orderBy(desc(profiles.createdAt))

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    avatar: r.avatar as Avatar,
    createdAt: r.createdAt,
  }))
}

export async function createProfile(name: string, avatar: Avatar): Promise<Profile> {
  const [row] = await db
    .insert(profiles)
    .values({ name, avatar })
    .returning()

  return {
    id: row.id,
    name: row.name,
    avatar: row.avatar as Avatar,
    createdAt: row.createdAt,
  }
}

export async function deleteProfile(id: string): Promise<void> {
  // Cascades to progress and mini_game_scores via FK
  await db.delete(profiles).where(eq(profiles.id, id))
}
