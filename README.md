<div align="center">

<img src="https://readme-typing-svg.herokuapp.com?font=Playfair+Display&size=40&duration=3000&pause=1000&color=E91E8C&center=true&vCenter=true&width=600&lines=🖼️+TwoFrames;A+private+space+for+two.;One+photo.+One+day.+Forever." alt="TwoFrames" />

<br/>

<p align="center">
  <b>A private web app where couples share one picture per day, track their moods, and build a beautiful timeline of memories — together.</b>
</p>

<br/>

[![Next.js](https://img.shields.io/badge/Next.js_16-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Framer Motion](https://img.shields.io/badge/Framer_Motion-0055FF?style=for-the-badge&logo=framer&logoColor=white)](https://www.framer.com/motion/)
[![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Cloudinary](https://img.shields.io/badge/Cloudinary-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white)](https://cloudinary.com/)

<br/>

[![GitHub stars](https://img.shields.io/github/stars/yoga0061/twoframes?style=flat-square&color=E91E8C)](https://github.com/yoga0061/twoframes/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/yoga0061/twoframes?style=flat-square&color=3448C5)](https://github.com/yoga0061/twoframes/network)
[![GitHub issues](https://img.shields.io/github/issues/yoga0061/twoframes?style=flat-square&color=orange)](https://github.com/yoga0061/twoframes/issues)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=flat-square)](./LICENSE)

<br/>

[🌐 Live Demo](https://twoframes.vercel.app) · [🐛 Report Bug](https://github.com/yoga0061/twoframes/issues/new?template=bug_report.md) · [💡 Request Feature](https://github.com/yoga0061/twoframes/issues/new?template=feature_request.md)

</div>

---

## 📖 Table of Contents

- [About the Project](#-about-the-project)
- [Features](#-features)
- [Screenshots](#-screenshots)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Project Structure](#-project-structure)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [License](#-license)
- [Contact](#-contact)

---

## 💡 About the Project

**TwoFrames** was built with one idea in mind — *slowing down*.

In a world of endless scrolling and content overload, TwoFrames gives couples a quiet corner of the internet that's just theirs. One photo per day. A shared mood check-in. A growing gallery of moments that matter.

No ads. No algorithms. No followers. Just two people and their story.

> *"The best camera is the one that captures what you feel, not just what you see."*

---

## ✨ Features

<table>
  <tr>
    <td>📷</td>
    <td><b>Daily Memory Upload</b></td>
    <td>One compressed image per user every 24 hours — intentional, not impulsive.</td>
  </tr>
  <tr>
    <td>🎭</td>
    <td><b>Mood Tracker</b></td>
    <td>8 mood options that sync in real time between partners, so you always know how they feel.</td>
  </tr>
  <tr>
    <td>⏱️</td>
    <td><b>Relationship Counter</b></td>
    <td>A live counter showing exactly how long you've been together — down to the hour.</td>
  </tr>
  <tr>
    <td>🖼️</td>
    <td><b>Shared Gallery</b></td>
    <td>A beautiful responsive grid of every memory, with fullscreen preview support.</td>
  </tr>
  <tr>
    <td>📅</td>
    <td><b>Timeline</b></td>
    <td>A chronological feed of all your photos and mood updates — your love story, written in moments.</td>
  </tr>
  <tr>
    <td>💌</td>
    <td><b>Couple Connect</b></td>
    <td>A unique invite code to privately link two accounts — no third parties, just you two.</td>
  </tr>
  <tr>
    <td>🔒</td>
    <td><b>Future Message Vault</b></td>
    <td>Write time-locked messages to be opened on a future date — birthdays, anniversaries, surprises.</td>
  </tr>
  <tr>
    <td>🎵</td>
    <td><b>Couple Playlist</b></td>
    <td>Build a shared romantic soundtrack together, song by song.</td>
  </tr>
</table>

---

## 📸 Screenshots

> _Add screenshots of your app here. Suggested screens: Dashboard, Gallery, Timeline, Mood Tracker, Vault._

| Dashboard | Gallery | Timeline |
|:---------:|:-------:|:--------:|
| ![Dashboard](./screenshots/dashboard.png) | ![Gallery](./screenshots/gallery.png) | ![Timeline](./screenshots/timeline.png) |

| Mood Tracker | Future Vault | Couple Playlist |
|:------------:|:------------:|:---------------:|
| ![Mood](./screenshots/mood.png) | ![Vault](./screenshots/vault.png) | ![Playlist](./screenshots/playlist.png) |

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| [Next.js 16](https://nextjs.org/) | React framework with App Router |
| [TypeScript](https://www.typescriptlang.org/) | Type safety across the entire codebase |
| [Tailwind CSS](https://tailwindcss.com/) | Utility-first styling |
| [Framer Motion](https://www.framer.com/motion/) | Fluid animations and transitions |

### Backend & Infrastructure
| Technology | Purpose |
|---|---|
| [Firebase Authentication](https://firebase.google.com/products/auth) | Secure, passwordless user login |
| [Cloud Firestore](https://firebase.google.com/products/firestore) | Real-time NoSQL database |
| [Cloudinary](https://cloudinary.com/) | Image upload, compression & CDN delivery |

---

## 🚀 Getting Started

### Prerequisites

Make sure you have the following installed and set up:

- **Node.js** v18 or higher — [Download](https://nodejs.org/)
- **npm** v9+ or **yarn**
- A **[Firebase](https://firebase.google.com/)** project with Authentication and Firestore enabled
- A **[Cloudinary](https://cloudinary.com/)** account (free tier works)

### Installation

**1. Clone the repository**

```bash
git clone https://github.com/yoga0061/twoframes.git
cd twoframes
```

**2. Install dependencies**

```bash
npm install
```

**3. Set up environment variables**

```bash
cp .env.example .env.local
```

Then fill in your credentials (see [Environment Variables](#-environment-variables) below).

**4. Run the development server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. 🎉

---

## 🔐 Environment Variables

Create a `.env.local` file in the root of your project with the following keys:

```env
# ──────────────────────────────────────────
# Firebase Configuration
# ──────────────────────────────────────────
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# ──────────────────────────────────────────
# Cloudinary Configuration
# ──────────────────────────────────────────
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
```

> ⚠️ **Never commit your `.env.local` file.** It is already listed in `.gitignore`.

---

## 📁 Project Structure

```
twoframes/
│
├── app/                        # Next.js 16 App Router
│   ├── (auth)/                 # Authentication pages (login, register)
│   ├── (dashboard)/            # Protected app pages
│   │   ├── gallery/            # Shared photo gallery
│   │   ├── timeline/           # Memory timeline
│   │   ├── mood/               # Mood tracker
│   │   ├── vault/              # Future message vault
│   │   └── playlist/           # Couple playlist
│   ├── layout.tsx              # Root layout
│   └── page.tsx                # Landing page
│
├── components/                 # Reusable UI components
│   ├── ui/                     # Base UI primitives
│   ├── gallery/                # Gallery grid & fullscreen viewer
│   ├── mood/                   # Mood picker & sync display
│   ├── timeline/               # Timeline feed
│   ├── vault/                  # Vault message composer & countdown
│   └── playlist/               # Playlist UI
│
├── lib/                        # Core utilities
│   ├── firebase.ts             # Firebase initialization
│   ├── cloudinary.ts           # Cloudinary helpers
│   └── utils.ts                # Shared utility functions
│
├── hooks/                      # Custom React hooks
│   ├── usePartner.ts           # Partner sync hook
│   ├── useMood.ts              # Mood real-time hook
│   └── useUploadLimit.ts       # Daily upload limit hook
│
├── types/                      # Global TypeScript types
│   └── index.ts
│
├── public/                     # Static assets
├── .env.example                # Environment variable template
├── tailwind.config.ts
├── next.config.ts
└── tsconfig.json
```

---

## 🗺️ Roadmap

- [x] Daily photo upload with 24-hour limit
- [x] Real-time mood sync
- [x] Relationship duration counter
- [x] Shared gallery with fullscreen preview
- [x] Chronological timeline
- [x] Couple Connect invite system
- [x] Future Message Vault
- [x] Couple Playlist
- [ ] Push notifications for daily uploads
- [ ] Anniversary reminders
- [ ] Memory recap (monthly/yearly highlights)
- [ ] Mobile app (React Native)
- [ ] Export memory book as PDF

---

## 🤝 Contributing

Contributions, issues and feature requests are welcome!

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'feat: add AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a [Pull Request](https://github.com/yoga0061/twoframes/pulls)

Please make sure your code follows the existing style and all checks pass before opening a PR.

---

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](./LICENSE) for more information.

---

## 📬 Contact

<div align="center">

**yoga0061** — Built with love, for love.

[![GitHub](https://img.shields.io/badge/GitHub-yoga0061-181717?style=for-the-badge&logo=github)](https://github.com/yoga0061)

</div>

---

<div align="center">

Made with ❤️ by [yoga0061](https://github.com/yoga0061)

*If this project made you smile, consider giving it a ⭐*

</div>
