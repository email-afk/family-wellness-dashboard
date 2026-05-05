# Database Schema

Use `supabase/schema.sql` as the initial migration.

## Core Tables

- `families`: family group.
- `family_memberships`: users inside a family.
- `member_privacy_settings`: per-user visibility and alert consent.
- `provider_connections`: encrypted Oura/WHOOP tokens.
- `oauth_states`: short-lived CSRF state records for provider OAuth.
- `daily_metrics`: raw and normalized daily metrics.
- `alert_events`: generated alert history.

## Example Query

```sql
select *
from public.family_dashboard_summary
order by display_name;
```
