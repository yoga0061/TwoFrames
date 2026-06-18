<div align="center">

# 🖼️ TwoFrames

### *A private space for two.*

A minimalist web app where couples share one photo a day, track their moods, and build a timeline of memories — together.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-Auth%20%26%20Firestore-orange?style=flat-square&logo=firebase)](https://firebase.google.com/)
[![Cloudinary](https://img.shields.io/badge/Cloudinary-Media-3448C5?style=flat-square&logo=cloudinary)](https://cloudinary.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)

</div>

---

## ✨ Features

| Feature | Description |
|---|---|
| 📷 **Daily Memory Upload** | One compressed image per user every 24 hours — quality over quantity |
| 🎭 **Mood Tracker** | 8 mood options with real-time sync between partners |
| ⏱️ **Relationship Counter** | Live counter tracking years, months, days, and hours together |
| 🖼️ **Shared Gallery** | Responsive photo grid with fullscreen preview |
| 📅 **Timeline** | Chronological feed of memories and mood updates |
| 💌 **Couple Connect** | Unique invite code to privately link two partners |
| 🔒 **Future Message Vault** | Write time-locked messages to be opened on a future date |
| 🎵 **Couple Playlist** | A shared romantic soundtrack, curated together |

---

## 🛠️ Tech Stack

- **[Next.js 16](https://nextjs.org/)** + **TypeScript** — Framework & type safety
- **[Tailwind CSS](https://tailwindcss.com/)** — Utility-first styling
- **[Framer Motion](https://www.framer.com/motion/)** — Smooth animations
- **[Firebase Authentication](https://firebase.google.com/products/auth)** — Secure user login
- **[Cloud Firestore](https://firebase.google.com/products/firestore)** — Real-time database
- **[Cloudinary](https://cloudinary.com/)** — Image storage & compression

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- A [Firebase](https://firebase.google.com/) project (Auth + Firestore enabled)
- A [Cloudinary](https://cloudinary.com/) account

### Installation

```bash
git clone https://github.com/your-username/twoframes.git
cd twoframes
npm install
```

### Environment Variables

Create a `.env.local` file in the root directory:

```env
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

---

## 📁 Project Structure

```
twoframes/
├── app/                  # Next.js App Router pages
├── components/           # Reusable UI components
│   ├── gallery/          # Shared Gallery & fullscreen viewer
│   ├── mood/             # Mood tracker UI
│   ├── timeline/         # Timeline feed
│   └── vault/            # Future Message Vault
├── lib/                  # Firebase & Cloudinary config
├── hooks/                # Custom React hooks
├── types/                # TypeScript types
└── public/               # Static assets
```

---

## 🔐 Privacy

TwoFrames is designed to be **private by default**. Each couple's data is isolated behind Firebase Authentication and a unique invite code. No data is shared publicly.

---

## 🤝 Contributing

This is a personal project — but if you'd like to suggest features or report a bug, feel free to [open an issue](https://github.com/your-username/twoframes/issues).

---

## 📄 License

MIT © [Your Name](https://github.com/your-username)

---

<div align="center">
  Made with ❤️ for two.
</div>
