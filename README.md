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

## Tech stack

- React 19 + TypeScript
- Vite 6
- Tailwind CSS 4
- Framer Motion
- React Router
- localStorage (no backend)

## Screens

| Screen | Route |
|--------|-------|
| Home (check-in) | `/` |
| Journal | `/history` |
| Memories | `/gallery` |
| Profile | `/profile` |
| Day detail | `/day/:date` |
