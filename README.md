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
2. In Supabase Database > Extensions, enable `pg_cron` (Supabase Cron). Open SQL Editor and run the entire `supabase/schema.sql`. Rerun it on existing installations: it adds the new columns and updates policies without deleting existing rows. Check the `pantry-archive` job in Database > Cron.
   If the tables already exist, rerunning the script updates the included policies without deleting records.
3. Create an admin user in Supabase Authentication > Users.
4. Copy `.env.example` to `.env.local` and add your project URL and publishable key.
5. Install dependencies:
   `npm install`
6. Run:
   `npm run dev`
7. Deploy the Vite app to Vercel/Netlify and add the same environment variables.

## Important security note
The included RLS policies protect public data from reads: visitors can insert registrations/surveys but cannot query them. Authenticated users can read/update/delete records. If the project will have more than one authenticated user type, add an `admin_profiles` table/role policy so only explicitly approved coordinators can access the dashboard.
The registration form supplies a UUID and uses an insert without a returned row, since anonymous users cannot select registrations. If an existing Supabase project still reports an insert policy error, run the updated SQL script in that project's SQL Editor and verify the app's environment variables point to the same project.

## Distribution cycle
- Dates default to the first and third Saturdays of each month. Admins can set Saturday overrides in Dashboard > Schedule. The second date appears in registration at 12:00 a.m. Africa/Lagos on the day after the first date.
- Admins can archive the current active data at any time. The scheduled job runs daily at 23:59 Africa/Lagos and archives the cycle on the Sunday after its third distribution date. Archived rows remain available when “Include archived records” is selected.
- Dashboard totals show active records; historical records remain in the same tables. Existing legacy rows with the old `next`/`future` date values should be archived manually before comparing cycles.
- Create only trusted coordinators as Supabase Auth users. The authenticated policies grant those users access to all pantry records and schedule controls.

## Customisation
- Pantry schedule: edit the `schedule` constant in `src/main.tsx`.
- Food preference options: edit the `foods` array.
- Branding: adjust CSS variables and logo treatment in `src/styles.css`.
- Church logo: replace the text `R` brandmark with the supplied RCCGSC logo when available.
