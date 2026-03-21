import { pgTable, uuid, text, integer, timestamp, unique } from 'drizzle-orm/pg-core'

export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  avatar: text('avatar').notNull().default('blake'), // 'blake' | 'davion'
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})

export const progress = pgTable(
  'progress',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    profileId: uuid('profile_id')
      .references(() => profiles.id, { onDelete: 'cascade' })
      .notNull(),
    grade: integer('grade').notNull(),
    domain: text('domain').notNull(),
    concept: text('concept').notNull(),
    level: integer('level').notNull().default(1),
    problemsCorrect: integer('problems_correct').default(0),
    problemsAttempted: integer('problems_attempted').default(0),
    bestStreak: integer('best_streak').default(0),
    totalScore: integer('total_score').default(0),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (t) => [unique().on(t.profileId, t.grade, t.concept)],
)

export const miniGameScores = pgTable('mini_game_scores', {
  id: uuid('id').primaryKey().defaultRandom(),
  profileId: uuid('profile_id')
    .references(() => profiles.id, { onDelete: 'cascade' })
    .notNull(),
  gameType: text('game_type').notNull(), // 'passing-drill' | 'field-goal'
  score: integer('score').notNull(),
  grade: integer('grade').notNull(),
  concept: text('concept').notNull(),
  playedAt: timestamp('played_at', { withTimezone: true }).defaultNow(),
})
