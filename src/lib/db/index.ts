import { neon } from '@neondatabase/serverless'
import { drizzle, type NeonHttpDatabase } from 'drizzle-orm/neon-http'
import * as schema from './schema'

// Lazy init — avoids crashing the app if DB URL is missing
let _db: NeonHttpDatabase<typeof schema> | null = null

export function getDb() {
  if (!_db) {
    const url = import.meta.env.VITE_DATABASE_URL
    if (!url) {
      throw new Error('VITE_DATABASE_URL is not set')
    }
    const sql = neon(url)
    _db = drizzle(sql, { schema })
  }
  return _db
}

// Keep backward-compatible export for existing code
export const db = new Proxy({} as NeonHttpDatabase<typeof schema>, {
  get(_, prop) {
    return (getDb() as unknown as Record<string | symbol, unknown>)[prop]
  },
})
