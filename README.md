# Vermont Patriots Math Football

A retro arcade math game for kids in grades 3-6. Solve math problems, build streaks, and unlock football mini-games.

**Play now:** https://vt-patriots-math.vercel.app

## What is this?

An arcade-style math practice game where kids play as Vermont Patriots football players Blake Draye (#12) or Davion Tenderson (#23). Answer math problems correctly to build streaks, then play Passing Drill and Field Goal mini-games as rewards.

## Features

- **8 math concepts** across grades 3-6 (multiplication, division, fractions, angles, decimals, ratios, expressions)
- **Template-based problem engine** that generates thousands of unique problems with progressive hints
- **2 canvas mini-games**: Passing Drill (click-to-throw with combos) and Field Goal (power + aim timing)
- **Retro arcade aesthetic**: pixel fonts, scanline overlays, chiptune music, particle effects
- **Player profiles** with progress tracking and a high score leaderboard
- **Streak system**: 5 correct answers in a row unlocks a mini-game

## Tech Stack

- React 19 + TypeScript + Vite
- HTML5 Canvas (mini-games)
- Tailwind CSS v4 (retro theme)
- Zustand (state management)
- Vercel Postgres / Neon + Drizzle ORM
- Web Audio API (all sounds synthesized, no external files)

## Development

```bash
npm install
npm run dev
```

For database setup, create a Neon Postgres database via Vercel, then:

```bash
vercel env pull .env.local
npx drizzle-kit push
```
