# API Architecture

## Routes

- `GET /api/oauth/oura/start`: requires Supabase session, creates `oauth_states`, redirects to Oura.
- `GET /api/oauth/oura/callback`: validates state, exchanges code, encrypts and stores tokens.
- `GET /api/oauth/whoop/start`: requires Supabase session, creates `oauth_states`, redirects to WHOOP.
- `GET /api/oauth/whoop/callback`: validates state, exchanges code, encrypts and stores tokens.
- `POST /api/cron/daily-sync`: protected by `Authorization: Bearer $CRON_SECRET`, pulls provider data and upserts normalized daily metrics.
- `GET /api/family/summary`: returns privacy-filtered family dashboard data for the signed-in user.

## OAuth Notes

The starter uses authorization-code flow only. It does not use client-side implicit flow or fake test shortcuts.

Official docs checked:

- Oura OAuth authorize URL: `https://cloud.ouraring.com/oauth/authorize`
- Oura token URL: `https://api.ouraring.com/oauth/token`
- WHOOP authorize URL: `https://api.prod.whoop.com/oauth/oauth2/auth`
- WHOOP token URL: `https://api.prod.whoop.com/oauth/oauth2/token`

## Background Sync

For Vercel, call `/api/cron/daily-sync` from `vercel.json` cron or an external scheduler. For Supabase, use Edge Functions or pg_cron to call the Next.js route. The route should run server-side only because it decrypts provider tokens.
