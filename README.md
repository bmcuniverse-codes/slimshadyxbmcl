# RCCGSC Food Pantry Platform

A polished, mobile-first food pantry registration and administration platform for RCCGSC.

## Stack
- React + TypeScript + Vite
- Supabase Postgres + Auth + Row Level Security
- Lucide icons
- Responsive CSS

Supabase's current Next.js/SSR guidance recommends cookie-based Auth and RLS for protecting data. This implementation keeps the frontend simple with Supabase Auth + RLS; the public registration/feedback paths are insert-only while signed-in admins can read/manage records.

## Features
- Public pantry landing page with RCCGSC blue/white visual system
- Pantry schedule section (editable in `src/main.tsx`)
- Registration: name, phone, email, family size, preferred distribution
- Feedback survey: experience, 1–5 rating, food preferences, comments
- Secure admin sign-in through Supabase Auth
- Admin dashboard: registration count, family-member total, feedback count, average rating
- Search registrations
- CSV export
- Supabase SQL schema + RLS policies

## Setup
1. Create a Supabase project.
2. Open Supabase SQL Editor and run `supabase/schema.sql`.
3. Create an admin user in Supabase Authentication > Users.
4. Copy `.env.example` to `.env.local` and add your project URL and publishable key.
5. Install dependencies:
   `npm install`
6. Run:
   `npm run dev`
7. Deploy the Vite app to Vercel/Netlify and add the same environment variables.

## Important security note
The included RLS policies protect public data from reads: visitors can insert registrations/surveys but cannot query them. Authenticated users can read/update/delete records. If the project will have more than one authenticated user type, add an `admin_profiles` table/role policy so only explicitly approved coordinators can access the dashboard.

## Customisation
- Pantry schedule: edit the `schedule` constant in `src/main.tsx`.
- Food preference options: edit the `foods` array.
- Branding: adjust CSS variables and logo treatment in `src/styles.css`.
- Church logo: replace the text `R` brandmark with the supplied RCCGSC logo when available.
