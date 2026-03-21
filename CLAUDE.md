# Vermont Patriots Math Football

## About
Kids' math football arcade game. Retro pixel-art aesthetic (NBA Jam feel). Grades 3-6, Common Core aligned.

## Key Decisions
- **Engine**: React + Canvas (React for UI/menus/math, HTML5 Canvas for mini-games only)
- **Platform**: Desktop web browser
- **Backend**: Vercel Postgres (Neon) + Drizzle ORM — deployed via Vercel
- **State**: Zustand
- **Styling**: Tailwind CSS v4 + retro CSS (Press Start 2P + VT323 fonts)
- **Sound**: Web Audio API (synthetic chiptune sounds, no external files)
- **Bundler**: Vite

## Branding
- Team: Vermont Patriots
- Characters: Blake Draye (#12, QB), Davion Tenderson (#23, Receiver)
- Visual style: Retro 16-bit pixel art, bright colors, chunky sprites, exaggerated motion

## Game Loop
Profile select → Grade select → Hub → Solve math problems → Build streak (5 correct) → Unlock mini-game → 3-2-1 countdown → Play mini-game → Results → Return to hub

## Content
- **Hierarchy**: Grade → Domain → Concept → Level → Problem
- **Template system**: JSON templates with variable ranges, derived variables, hint templates, common mistake expressions
- **Problem engine**: Generates unique problems from templates, computes correct answers, generates plausible wrong choices
- **Grades 3-6**: 8 concepts total, 2-3 levels each
  - Grade 3: Multiplication (3 levels), Division (2 levels)
  - Grade 4: Fractions (3 levels), Angles (2 levels)
  - Grade 5: Fractions+ (2 levels), Decimals (2 levels)
  - Grade 6: Ratios (2 levels), Expressions (3 levels)

## Mini-Games
1. **Passing Drill**: Receiver jukes side-to-side (speeds up), click to throw, accuracy zones, combo system, particle explosions, screen shake
2. **Field Goal**: Two-tap mechanic (power meter → aim meter), wind drift, night stadium with crowd/stars/lights, distance increases per round
- Both accessible from Hub anytime (free play) + unlocked via 5-streak
- Scores saved to database with leaderboard

## Database (Neon via Vercel)
- `profiles` — id, name, avatar
- `progress` — per-concept level tracking, accuracy, best streak, total score
- `mini_game_scores` — game type, score, grade, concept, timestamp
- Schema defined in `src/lib/db/schema.ts`, push via `npx drizzle-kit push`

## Development
- `npm run dev` — start Vite dev server
- `npx tsc --noEmit` — typecheck
- `npx drizzle-kit push` — push schema to Neon (needs DATABASE_URL env var)
- `.env.local` — contains Neon connection strings (pulled via `vercel env pull`)
- Vercel CLI linked: `vercel link --yes`

## Build History
- **Session 1 (2026-03-21)**: Built all 5 steps — scaffold, math engine, hub + progress, mini-games, polish
- Audited all math problem templates via subagent — found and fixed 3 critical, 2 high, 4 medium issues (broken ternaries, digit concatenation in hints, improper fractions, wrong decomposition hints)
- Originally planned Supabase, swapped to Vercel Postgres (Neon) + Drizzle since Jake has Vercel Pro
- Updated global `~/.claude/CLAUDE.md` output routing to be project-aware (outputs go in-project when a project exists)

## Conventions
- Keep it simple — personal project, not production
- Outputs (generated images, docs) go in `outputs/<topic>/`
- No auth for MVP — kids pick a profile name, no passwords
- DB credentials in VITE_ prefix for client-side access (OK for personal use, needs API routes if public)

## PRD Reference
Original PRD: `~/Downloads/boston_football_math_arcade_prd_v5.docx`
