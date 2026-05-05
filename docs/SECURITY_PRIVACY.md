# Security and Privacy Considerations

- Store OAuth access and refresh tokens only on the server.
- Encrypt tokens before database storage with AES-256-GCM using `TOKEN_ENCRYPTION_KEY_BASE64`.
- Never expose the Supabase service role key to the browser.
- Use short-lived OAuth state rows to prevent CSRF.
- Register exact redirect URIs in Oura and WHOOP developer dashboards.
- Use Supabase RLS for family membership boundaries.
- Treat wearable data as sensitive health-adjacent personal data.
- Alerts must only be created when `alerts_enabled = true`.
- Avoid notifications with exact values unless the member allows exact sharing.
- Keep raw provider payloads server-only if you later add stricter views.
- Add token refresh rotation before production. Oura refresh tokens are single-use per the docs, so update stored refresh tokens atomically.
