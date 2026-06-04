# Pawly 🐾

A minimal pet journal + photo memory app. Track your pet's daily well-being in under 10 seconds and build a beautiful photo timeline.

## Features

- **Quick daily check-in** — Sleep, food, activity, and mood in 4 taps
- **One photo per day** — Capture memories with camera or gallery
- **Journal calendar** — Browse entries by day with mood indicators
- **Memory gallery** — Pinterest-style photo grid with mood badges
- **Pet profile** — Edit name, photo, breed + weekly stats
- **Offline-first** — All data stored locally in your browser

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) on your phone or desktop. The UI is optimized for mobile (max 430px width).

## Login & cloud sync

| Mode | Where data lives | Restore |
|------|------------------|---------|
| **Signed in** | Supabase (PostgreSQL + Storage bucket `photos`) | Automatic on sign-in |
| **Guest** | Browser `localStorage` only | This device only |

### Supabase setup (one-time)

1. Create a free project at [supabase.com](https://supabase.com)
2. Run `supabase/schema.sql` in **SQL Editor**
3. Create Storage bucket **`photos`** (public)
4. Copy `.env.example` → `.env.local` and add your URL + anon key
5. Restart `npm run dev`

## Tech stack

- React 19 + TypeScript
- Vite 6
- Tailwind CSS 4
- Framer Motion
- React Router
- Supabase Auth + DB + Storage
- localStorage cache (offline-friendly)

## Screens

| Screen | Route |
|--------|-------|
| Home (check-in) | `/` |
| Journal | `/history` |
| Memories | `/gallery` |
| Profile | `/profile` |
| Day detail | `/day/:date` |
