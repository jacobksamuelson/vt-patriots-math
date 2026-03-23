# Vermont Patriots Math Football

A retro arcade math game for kids in grades 3-6. Solve math problems, build streaks, unlock celebrations, and play football mini-games.

**Play now:** https://vt-patriots-math.vercel.app

## What is this?

An arcade-style math practice game where kids play as Vermont Patriots football players Blake Draye (#12) or Davion Tenderson (#23). Answer math problems correctly to build streaks, earn unlockable rewards, and play Passing Drill and Field Goal mini-games. Works on desktop and iPad/mobile.

## Features

- **8 math concepts** across grades 3-6 (multiplication, division, fractions, angles, decimals, ratios, expressions)
- **Template-based problem engine** generating thousands of unique problems with progressive hints and step-by-step solutions
- **2 canvas mini-games**: Passing Drill (click-to-throw with combos, particles, screen shake) and Field Goal (kicker run-up, power + aim timing, night stadium)
- **11 unlockable rewards**: celebrations, ball trails, and titles earned by hitting milestones
- **Retro arcade aesthetic**: pixel fonts, scanline overlays, chiptune intro music, particle effects, CRT glow
- **Player profiles** with progress tracking, high score leaderboard, and trophy case
- **Streak system**: 5 correct answers in a row unlocks a mini-game
- **Touch-friendly**: works on iPad and mobile devices

## Tech Stack

- React 19 + TypeScript + Vite
- HTML5 Canvas (mini-games with mouse + touch support)
- Tailwind CSS v4 (custom retro theme)
- Zustand (state management)
- Vercel Postgres / Neon + Drizzle ORM
- Web Audio API (chiptune music + sound effects, all synthesized)

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

## Deploy

```bash
vercel --prod
```
