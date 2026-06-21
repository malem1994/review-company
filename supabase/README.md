# Supabase Setup

This project has a Supabase schema migration at:

```txt
supabase/migrations/20260619072000_create_company_review_schema.sql
```

## Apply manually

1. Open the Supabase dashboard for the configured project.
2. Go to **SQL Editor**.
3. Paste and run the migration SQL.

## Apply with CLI

If you have a linked Supabase CLI project:

```bash
supabase db push
```

If you want Codex to apply this directly to the remote project, provide one of:

- a Supabase database connection string with migration permissions, or
- a Supabase access token/project ref and permission to use the Supabase CLI.

Do not use `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` for schema changes; it cannot create tables.
