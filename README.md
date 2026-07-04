# TIM AI — This Is Mine

> A personal musical collaborative assistant that grows with you.

Built for the **IBM Bob Challenge — July 2026** submission.

## What is TIM?

TIM (This Is Mine) is an AI music collaborator trained on *your* life — not billions of strangers' songs. It starts with the curiosity of a 6-year-old and grows through your journals, voice notes, memories, and feedback.

## Running locally

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## Tech stack

- **React + Vite** — UI framework
- **Tailwind CSS** — styling
- **React Router** — navigation
- **Web Audio API** — mic recording + live waveform
- **Basic Pitch** (Spotify) — hum-to-MIDI *(Session 2)*
- **Replicate / MusicGen** — music generation *(Session 2)*
- **localStorage** — memory persistence *(Supabase in Phase 2)*

## Screens

| Screen | Purpose |
|--------|---------|
| **Record** | Hum a melody or tap a rhythm into TIM |
| **Create** | Pick a vibe, let TIM generate a beat around your hum |
| **Memories** | TIM's growing journal of your sessions — proof of growth |

## Deploying

Push to GitHub → connect to [Vercel](https://vercel.com) → auto-deploys on every push.
