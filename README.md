# 🏠 Vastgoedplatform

*Platform voor makelaars, verkopers en kopers om vastgoeddossiers te beheren*

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/martijnhellings-3094s-projects/v0-real-estate-app)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.app-black?style=for-the-badge)](https://v0.app/chat/cJ9hpZcNDCp)
[![Next.js](https://img.shields.io/badge/Next.js-16.0-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)

## 📋 Overzicht

Het Vastgoedplatform is een modern webplatform gebouwd met Next.js dat functionaliteit biedt voor drie typen gebruikers:

- **🏠 Kopers**: Zoek en bekijk properties, gebruik interactieve kaartweergave, stel vragen via AI chatbot
- **📝 Verkopers**: Beheer eigen properties, volg status en interesse
- **💼 Makelaars**: CRM overzicht, beheer meerdere properties, track bezichtigingen en biedingen

## 🏗️ Software Architecture

Bekijk de volledige software architectuur documentatie:

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Uitgebreide architectuur documentatie
- **[architecture-visual.html](./architecture-visual.html)** - Interactief visueel diagram (open in browser)
- **[architecture-diagram.mmd](./architecture-diagram.mmd)** - Mermaid diagram source
- **[architecture-diagram-detailed.mmd](./architecture-diagram-detailed.mmd)** - Entity Relationship Diagram

### Architectuur Samenvatting

```
🌐 Frontend (Next.js + React)
   ├── Koper Dashboard (Property Search, Map, Details)
   ├── Verkoper Dashboard (Property Management)
   └── Makelaar Dashboard (CRM, Overview)

⚙️ Backend (Next.js API Routes)
   ├── /api/chat - AI Chat Handler
   ├── Authentication Logic
   └── Property Logic

💾 Data Layer
   ├── Mock Property Data (10 properties)
   ├── Mock User Data
   └── Browser LocalStorage (Session)

🤖 AI Components
   ├── AI SDK 5.0.93
   ├── OpenAI Integration (prepared)
   └── Rule-based Chat Logic

🚀 Deployment
   └── Vercel Platform (Hosting, CDN, Analytics)
```

## 🚀 Deployment

Your project is live at:

**[https://vercel.com/martijnhellings-3094s-projects/v0-real-estate-app](https://vercel.com/martijnhellings-3094s-projects/v0-real-estate-app)**

## 🛠️ Technologie Stack

| Layer | Technologie | Versie |
|-------|------------|--------|
| Framework | Next.js | 16.0.3 |
| UI Library | React | 19.2.0 |
| Language | TypeScript | ^5 |
| Styling | Tailwind CSS | 4.1.9 |
| Components | Radix UI | Various |
| AI SDK | AI SDK | 5.0.93 |
| AI Provider | @ai-sdk/openai | 2.0.68 |
| Analytics | Vercel Analytics | latest |
| Deployment | Vercel | Platform |

## 📁 Project Structuur

```
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   │   └── chat/         # AI Chat endpoint
│   ├── koper/            # Buyer dashboard
│   ├── makelaar/         # Broker dashboard
│   └── verkoper/         # Seller dashboard
├── components/            # React components
│   ├── ui/               # UI primitives (Radix UI)
│   ├── chat-interface.tsx
│   └── property-map.tsx
├── lib/                  # Business logic
│   ├── auth.ts          # Authentication
│   └── properties.ts    # Property data & logic
└── public/              # Static assets
```

## 🎯 Features

- ✅ Role-based authentication (Makelaar, Verkoper, Koper)
- ✅ Property search en filter functionaliteit
- ✅ Interactieve kaartweergave met afstand berekening
- ✅ AI-powered chat assistent voor property vragen
- ✅ Property detailpagina's met buurtinformatie
- ✅ Biedingen en bezichtigingen tracking
- ✅ Responsive design met Tailwind CSS
- ✅ Server-side rendering (SSR) en Static Generation (SSG)

## 📖 Development

### Installatie

```bash
# Installeer dependencies
pnpm install

# Start development server
pnpm dev

# Build voor productie
pnpm build

# Start productie server
pnpm start
```

### Build your app

Continue building your app on:

**[https://v0.app/chat/cJ9hpZcNDCp](https://v0.app/chat/cJ9hpZcNDCp)**

## 📝 Notes

*Automatically synced with your [v0.app](https://v0.app) deployments*

This repository will stay in sync with your deployed chats on [v0.app](https://v0.app).
Any changes you make to your deployed app will be automatically pushed to this repository from [v0.app](https://v0.app).

## 🔄 How It Works

1. Create and modify your project using [v0.app](https://v0.app)
2. Deploy your chats from the v0 interface
3. Changes are automatically pushed to this repository
4. Vercel deploys the latest version from this repository