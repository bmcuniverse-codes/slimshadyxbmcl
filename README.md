# RCCGSC Food Pantry — distribution date and Reset fix

## Apply this update (existing site)

1. Open Supabase **SQL Editor** and run the entire file
   `supabase/restore_distribution_and_fix_reset.sql`.
2. Replace your project source with this ZIP and redeploy the website.
3. Keep your existing `VITE_SUPABASE_URL` and
   `VITE_SUPABASE_PUBLISHABLE_KEY` environment variables.

The SQL update is required. Uploading only the website will not update the
hosted database function or add the restored registration column. Applying
this patch does not delete existing registrations, feedback or archived data.

## Changes

- Registration collects first name, last name, family size (1–30 dropdown)
  and **Preferred Distribution Date**.
- Dates default to the first and third Saturdays and respect admin overrides.
  The second date is hidden through the first distribution day and becomes
  available at midnight the following day, using the existing Africa/Lagos
  schedule time zone. Expired dates are not offered.
- The database validates selected dates as well as the form. A selected date
  is saved and shown in active/archived registrant lists, CSV and analytics.
- Admin date changes refresh the form schedule; invalidated selections clear.
- **Reset all data** has explicit `WHERE` filters on both DELETE statements,
  fixing `DELETE requires a WHERE clause`. Database safety settings remain
  enabled. Reset still requires admin sign-in and the existing confirmation.
- Reset intentionally deletes all registrations and feedback, including the
  archive, in one transaction. Admin accounts and schedule settings remain.
- **Archive current data** still keeps records in the separate Archive tab.
  Automatic archive follows the selected distribution cycle; early bookings
  for a later month are not cleared with the current month.
- Old registrations collected without a date keep a blank date (shown as
  "Not recorded"). Their creation date remains the automatic-archive fallback.
  Missing historical distribution dates are not invented.
- Contact and food-option fields remain removed from registration. The feedback
  form, branding and other features are retained.

## Other installation paths

- New Supabase project: use `supabase/schema.sql`.
- Upgrading the older project before the three-field update: use the updated
  `supabase/update_registration_archive_reset.sql`. It now preserves selected
  dates and includes the Reset fix. The latest restoration patch can then be
  rerun safely.
- The full schema keeps the existing Supabase Cron setup. The latest patch
  does not recreate or reschedule the cron job.

## Local development / Vercel

Use Node.js 22.13+ or 24. Keep your own `.env.local` settings or configure them
from `.env.example`.

```sh
npm ci --include=dev
npm run dev
```

Build command: `npm run build`. Output directory: `dist`.
Vercel install command: `npm ci --include=dev`. Set the two `VITE_SUPABASE_*`
environment variables before building.

## Verification

Passed: TypeScript + production build, 42 local database checks and 14 React
rendering/date-selection checks. Tests cover migration from both earlier
versions, midnight boundaries, admin overrides, server validation, selected
cycle archive behavior, reset permissions, explicit DELETE predicates,
transaction rollback, data preservation and reset on populated/empty tables.

Database tests use PGlite with a controlled test clock; production SQL uses
`now()`. Supabase's native safeupdate/pg_cron extensions and live Auth were not
executed here. Visual browser verification was not completed. No live Supabase
changes or deployment are performed by opening this ZIP.
