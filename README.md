# TwoFrames — Couple Memories

A private web app where couples share **one picture per day** and track their moods together.

## Features

- **Daily Memory Upload** — One compressed image per user every 24 hours
- **Mood Tracker** — 8 mood options, updatable every 5 hours with real-time sync
- **Relationship Counter** — Live years/months/days/hours together
- **Shared Gallery** — Beautiful responsive grid with fullscreen preview
- **Timeline** — Chronological feed of memories and mood updates
- **Couple Connect** — Unique 6-character code to link partners

## Tech Stack

- Next.js 16 + TypeScript
- Tailwind CSS v4
- Framer Motion
- Firebase Auth, Firestore, Storage

## Getting Started

### 1. Clone and install

```bash
npm install
```

### 2. Firebase Setup

1. Create a project at [Firebase Console](https://console.firebase.google.com)
2. Enable **Authentication** (Email/Password)
3. Create a **Firestore Database**
4. Create **Storage** bucket
5. Copy `.env.local.example` to `.env.local` and fill in your Firebase config

### 3. Deploy Firebase Rules

```bash
# Install Firebase CLI if needed
npm install -g firebase-tools
firebase login
firebase init  # select Firestore + Storage, use existing firebase/ folder
firebase deploy --only firestore:rules,firestore:indexes,storage
```

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deploy to Vercel

1. Push to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables from `.env.local`
4. Deploy

## Project Structure

```
src/
├── app/              # Pages (landing, auth, dashboard, gallery, settings)
├── components/       # UI components
├── context/          # Auth context
├── lib/              # Firebase, Firestore helpers, utilities
└── types/            # TypeScript types
firebase/
├── firestore.rules   # Secure Firestore rules
├── storage.rules     # Secure Storage rules
└── firestore.indexes.json
```

## Optimization

- Client-side image compression (~65% quality, max 1200px)
- Lazy-loaded gallery images
- Real-time listeners scoped to couple ID
- Query limits on mood history
