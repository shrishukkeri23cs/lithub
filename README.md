# 📖 LitHub - The Academic Discovery Hub

LitHub is a state-of-the-art literature and dataset discovery engine designed for researchers. It aggregates papers from Semantic Scholar, OpenAlex, and arXiv, while linking them to datasets from Zenodo and Papers With Code.

## 🚀 Quick Start

### 1. Backend Setup
```bash
cd server
npm install
# Update .env (see .env.example)
npm start
```

### 2. Frontend Setup
```bash
cd client
npm install
npm run dev
```

## 🛠 Tech Stack
- **Frontend**: Vite, React, Tailwind CSS, Lucide Icons.
- **Backend**: Node.js, Express, Axios.
- **Data Sources**: Semantic Scholar, OpenAlex, Zenodo, Papers With Code.
- **Auth & Storage**: Firebase (Firestore ready).

## 🎨 Design System
- **Theme**: Dark Navy / Amber (#fbbf24)
- **Aesthetic**: Glassmorphism, Radial Gradients, Micro-animations.
- **Fonts**: 
  - *Serif*: DM Serif Display (Headers)
  - *Mono*: IBM Plex Mono (IDs/Tech specs)
  - *Sans*: Inter (Body)

## 📁 Project Structure
```text
LitHub/
├── client/           # React frontend
│   ├── src/
│   │   ├── components/ # Reusable UI pieces
│   │   ├── pages/      # Home, Search, Library
│   │   └── index.css   # Main design tokens
├── server/           # Node.js backend proxy
│   ├── routes/       # Paper & Dataset search logic
│   └── index.js      # Express entry point
└── Logo.png          # Branding asset
```

## 🔐 Configuration Required
- **Firebase**: Create a Firebase project and add your web config to the frontend.
- **Google Sheets**: To use the waitlist, add your Service Account JSON and Sheet ID to `server/.env`.
