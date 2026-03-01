# Supabase Setup

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Create a new project
3. In **Project Settings > API**, copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 2. Add environment variables

Create `.env.local` in the project root (or copy from `.env.local.example`):

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## 3. Run the schema migration

In the Supabase Dashboard:

1. Open **SQL Editor**
2. Copy the contents of `supabase/migrations/001_init_schema.sql`
3. Paste and click **Run**

## 4. Seed the database

From the project root:

```bash
npm install
npm run db:seed
```

This copies all mock data (users, properties, appointments, city coordinates) into Supabase. The mock data in `lib/auth.ts`, `lib/properties.ts`, and `lib/agenda.ts` is **unchanged** — it stays in the codebase as backup.
