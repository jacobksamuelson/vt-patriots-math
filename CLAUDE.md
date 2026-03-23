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

## Polish Features
- **Splash screen**: Animated scrolling field, VP shield, player sprites flanking title, loading bar, golden PLAY button
- **Intro music**: Chiptune loop via Web Audio API (square melody + triangle bass + sawtooth harmony, 140 BPM), music toggle button
- **Player sprites**: Canvas-drawn pixel-art characters — helmet with stripe, jersey with stripes, facemask, number, idle bounce animation, football for QB
- **Passing Drill effects**: Particle explosions, screen shake, combo system (x2, x3...), ball trail, floating score pops, receiver glow on catch, juking receiver
- **Field Goal**: Kicker run-up animation, leg swing on kick, night stadium with twinkling stars, crowd silhouette, stadium lights, wind arrows, green "MAX" sweet spot on power meter
- **Leaderboard**: High scores from database, filterable by game type, medal rankings

## Unlockables System
11 unlockables across 3 categories, earned by milestones:
- **Celebrations**: Confetti Burst (10 correct), Fireworks (8 streak), TD Dance (2 concepts), Stadium Roar (50 correct), Lightning (10 streak)
- **Ball Trails**: Fire Trail (200 mini-game score), Rainbow Trail (400 mini-game score)
- **Titles**: Rookie (1 concept), Mathlete (4 concepts), MVP (perfect level), Hall of Fame (all 8 concepts)
- Trophy Case screen shows stats, locked/unlocked grid, next unlock hint

## Learning Features
- **Progressive hints**: Two hint levels before showing the answer
- **Step-by-step solutions**: After 2 wrong answers, shows numbered walkthrough of how to solve the problem (auto-generated from templates)
- **Streak system**: 5 correct in a row unlocks a mini-game reward

## Mobile Support
- Touch events (touchstart/touchmove) on all canvas mini-games
- touch-action: none prevents browser scroll/zoom interference
- Both Passing Drill and Field Goal playable on iPad/mobile

## Build History
- **Session 1 (2026-03-21 → 2026-03-22)**: Built all 5 steps + polish + extras
- Steps: scaffold → math engine → hub + progress → mini-games → polish → unlockables + solutions + touch
- Audited all math problem templates via subagent — found and fixed 3 critical, 2 high, 4 medium issues
- Originally planned Supabase, swapped to Vercel Postgres (Neon) + Drizzle since Jake has Vercel Pro
- Kid-tested: son suggested green power meter sweet spot at top (fixed)
- Deployed to Vercel: https://vt-patriots-math.vercel.app
- GitHub: https://github.com/jacobksamuelson/vt-patriots-math
- Updated global `~/.claude/CLAUDE.md` output routing to be project-aware

## Conventions
- Keep it simple — personal project, not production
- Outputs (generated images, docs) go in `outputs/<topic>/`
- No auth for MVP — kids pick a profile name, no passwords
- DB credentials in VITE_ prefix for client-side access (OK for personal use, needs API routes if public)

## PRD Reference
Original PRD: `~/Downloads/boston_football_math_arcade_prd_v5.docx`
