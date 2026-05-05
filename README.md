# Family Wellness Dashboard

Private family dashboard starter for combining Oura Ring and WHOOP wellness data with Supabase Auth, encrypted provider tokens, daily sync, privacy controls, and a mobile-friendly Next.js UI.

## What Is Included

- Product docs in `docs/`
- Supabase schema in `supabase/schema.sql`
- Next.js App Router starter
- OAuth start/callback routes for Oura and WHOOP
- Daily sync route
- Normalization utilities
- Dashboard components with privacy-aware rendering

## Official Docs To Check

- Oura API docs: https://cloud.ouraring.com/docs/
- WHOOP developer docs: https://developer.whoop.com/
- Supabase Next.js SSR docs: https://supabase.com/docs/guides/auth/server-side/nextjs

Provider APIs change over time. Before production, verify exact scopes, endpoint fields, refresh-token behavior, rate limits, and dashboard redirect URI settings.

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create a Supabase project and run `supabase/schema.sql` in the SQL editor.

3. Copy `.env.example` to `.env.local` and fill in values:

```bash
cp .env.example .env.local
```

4. Generate a token encryption key:

```bash
openssl rand -base64 32
```

5. Register OAuth applications:

- Oura redirect URI: `http://localhost:3000/api/oauth/oura/callback`
- WHOOP redirect URI: `http://localhost:3000/api/oauth/whoop/callback`

6. Start the app:

```bash
npm run dev
```

7. Open http://localhost:3000.

8. Sign in at http://localhost:3000/login, then use the connection buttons for Oura or WHOOP.

## Daily Sync

Call the cron route with a bearer secret:

```bash
curl -X POST http://localhost:3000/api/cron/daily-sync \
  -H "Authorization: Bearer $CRON_SECRET"
```

On Vercel, configure a cron job that calls this route daily. In production, add provider token refresh before data fetches and alert generation after metric upserts.

## Production Checklist

- Add real Supabase sign-in/sign-up pages.
- Add family invite flow.
- Build the privacy settings form.
- Implement token refresh with single-use refresh-token rotation.
- Add alert creation and notification delivery.
- Add provider pagination and retry handling.
- Restrict raw payload visibility further if needed.
