# SADRC Membership Application

A modern, responsive membership application for the Skegness and District Running Club (SADRC), built with Next.js and Supabase.

## Features
- Secure member registration form
- Supabase authentication and database integration
- Digital signature capture
- PDF display and download
- Responsive Material UI design

## Tech Stack
- Next.js (React framework)
- Supabase (Postgres DB, Auth, Storage)
- Material UI (MUI)
- React Hook Form
- React PDF
- React Signature Canvas

## Getting Started

### 1. Install Dependencies
```
npm install
```

### 2. Set Up Supabase
- Create a project at [supabase.com](https://supabase.com)
- Create a `.env.local` file in the project root with:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Run the Development Server
```
npm run dev
```

### 4. Deploy
- Push to GitHub and connect to Netlify for automatic deployment.

## Project Structure
- `/pages` — Next.js routes
- `/components` — Reusable UI components
- `/lib` — Supabase client and helpers
- `/public/pdfs` — PDF files

---

_Last updated: 2025-04-15_
