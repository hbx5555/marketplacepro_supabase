<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# ProMarketplace - Hebrew Marketplace App

A modern marketplace application built with React, TypeScript, Supabase, and Google Gemini AI.

## Features

- 🛍️ Item listings with image support
- 🤖 AI-powered item description generation
- 💬 Offer system for buyers and sellers
- 📸 Image compression and optimization
- 🔄 Real-time updates with Supabase
- 🌐 RTL Hebrew interface

## Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Storage, Real-time)
- **AI**: Google Gemini AI for image analysis
- **Build Tool**: Vite

## Prerequisites

- Node.js (v18 or higher)
- Supabase account ([sign up here](https://app.supabase.com))
- Google Gemini API key ([get one here](https://ai.google.dev))

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

Follow the detailed instructions in [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) to:
- Create a Supabase project
- Set up the database schema
- Configure storage bucket
- Get your API credentials

### 3. Configure Environment Variables

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Edit `.env` and add your credentials:

```env
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-key-here"
GEMINI_API_KEY="your-gemini-api-key"
```

### 4. Run the Application

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## Project Structure

```
├── src/
│   ├── App.tsx           # Main application component
│   ├── supabase.ts       # Supabase client configuration
│   ├── types.ts          # TypeScript interfaces
│   └── main.tsx          # Application entry point
├── supabase-schema.sql   # Database schema
├── SUPABASE_SETUP.md     # Detailed setup guide
└── public/               # Static assets
```

## Migration from Firebase

This project was recently migrated from Firebase to Supabase. Key changes:
- Database: Firestore → Supabase PostgreSQL
- Storage: External URLs → Supabase Storage
- Real-time: onSnapshot → Supabase real-time subscriptions

## Build for Production

```bash
npm run build
```

## License

MIT
